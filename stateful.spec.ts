import * as fc from 'fast-check'
import { CLASS_SELECTORS } from './cons';
import {
  ValidEnterCommand,
  WhiteEnterCommand,
  EmptyEnterCommand,
  TrimEnterCommand,
  WriteInputCommand,
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
              // fc.constant((clt('ValidEnterCommand')(null), new ValidEnterCommand())),
              // fc.constant((clt('InvalidEnterCommand')(null), new InvalidEnterCommand())),
            ],
            // {
            //   replayPath: "BBn:F"
            // },
            // 10,
          ),
          async (commands) => {

            await page.goto('http://todomvc.com/examples/react/', { waitUntil: 'networkidle2' });

            await page.waitFor(CLASS_SELECTORS.NEW_TODO);

            await fc.asyncModelRun(
              () => ({
                model: {
                  toDos: [],
                  input: {
                    text: '',
                    type: 'empty' as const,
                  }
                },
                real: page
              }),
              commands
            );
          }),
        {
          // seed: 225534091, path: "11:5:3:3:3:3:3:3:3:3:3:3:3:3", endOnFailure: true,
          numRuns: 50,
        }
      );
    },
    1000 * 60 * 10
  )

})
