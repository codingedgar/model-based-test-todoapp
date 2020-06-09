import * as fc from 'fast-check'
import { CLASS_SELECTORS } from './cons';
import {
  ValidEnterCommand,
  WhiteEnterCommand,
  EmptyEnterCommand,
  TrimEnterCommand,
  WriteInputCommand,
  MarkAllCheckCommand,
  ToggleItemCheckedCommand,
  TriggerEditingCommand,
  EditTodoCommand,
  EditEmptyCommand,
  EditCancelCommand,
} from './commands';
import {
  validToDoArbitrary,
  whitespaceToDoArbitrary,
  trimToDoArbitrary,
} from './arbitraties';

describe('Index', () => {

  it(
    'stateful',
    async () => {

      // try 

      await page.evaluateOnNewDocument(() => localStorage.clear());

      await fc.assert(
        fc.asyncProperty(
          fc.commands(
            [
              validToDoArbitrary()
                .map(text => new WriteInputCommand({ text: text, type: 'valid' })),
              whitespaceToDoArbitrary()
                .map(text => new WriteInputCommand({ text: text, type: 'whitespace' })),
              trimToDoArbitrary()
                .map(text => new WriteInputCommand({
                  text: text,
                  type: 'trim',
                })),
              fc.constant(new WriteInputCommand({ text: '', type: 'empty' })),
              fc.constant(new ValidEnterCommand()),
              fc.constant(new WhiteEnterCommand()),
              fc.constant(new TrimEnterCommand()),
              fc.constant(new EmptyEnterCommand()),
              fc.constant(new MarkAllCheckCommand()),
              fc.constant(new ToggleItemCheckedCommand()),
              fc.constant(new TriggerEditingCommand()),
              validToDoArbitrary()
                .map(text => new EditTodoCommand({ text: text, type: 'valid' })),
              trimToDoArbitrary()
                .map(text => new EditTodoCommand({
                  text: text,
                  type: 'trim',
                })),
              fc.constant(new EditEmptyCommand()),
              validToDoArbitrary()
                .chain(text => fc.record({
                  text: fc.constant(text),
                  number: fc.nat().noShrink()
                }))
                .map(({ text, number }) => new EditCancelCommand(
                  {
                    text,
                    type: 'valid'
                  },
                  number
                )),
            ],
            // {
            //   replayPath: "ABDB//H:1B"
            // },
            // 10,
          ),
          async (commands) => {

            await page.goto('http://todomvc.com/examples/react/', { waitUntil: 'networkidle2' });
            // await page.goto('http://todomvc.com/examples/vanillajs/', { waitUntil: 'networkidle2' });

            await page.waitFor(CLASS_SELECTORS.NEW_TODO);

            await fc.asyncModelRun(
              () => ({
                model: {
                  toDos: [],
                  input: {
                    text: '',
                    type: 'empty' as const,
                  },
                  toggleAll: false,
                },
                real: page
              }),
              commands
            );
          }),
        {
          numRuns: 20,
          // verbose: true,
          // seed: 1859182401, path: "3:3:5:5:5:5:5:5:5:5:5:5:5:5:5:5:5:5:5:5:5:5:5:5:5:5:5:5:5:5:5:5:5:5:5", endOnFailure: true
        }
      );
      // } catch (e) {
      //   console.log(e)
      //   await page.waitFor(100000000)
      // }
    },
    1000 * 60 * 10
  )

})
