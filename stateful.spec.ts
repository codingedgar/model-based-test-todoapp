import * as fc from 'fast-check'
import { CLASS_SELECTORS, STATIC } from './cons';
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
  ClearCompletedCommand,
  AddToDosCommands,
  GoToAllCommand,
  GoToActiveCommand,
  GoToCompletedCommand,
  GoBackCommand,
} from './commands';
import {
  validToDoArbitrary,
  whitespaceToDoArbitrary,
  trimToDoArbitrary,
} from './arbitraties';
import { string } from 'fast-check';
import { modelMachine } from './modelMachine';
import { interpret } from 'xstate';

describe('Index', () => {

  it(
    'stateful',
    async () => {

      // try {

      await page.evaluateOnNewDocument(() => localStorage.clear());

      await fc.assert(
        fc.asyncProperty(
          fc.commands(
            [
              validToDoArbitrary()
                .map(toDo => new WriteInputCommand(toDo)),
              whitespaceToDoArbitrary()
                .map(toDo => new WriteInputCommand(toDo)),
              trimToDoArbitrary()
                .map(toDo => new WriteInputCommand(toDo)),
              fc.constant(new WriteInputCommand({ text: '', type: 'empty' })),
              fc.constant(new ValidEnterCommand()),
              fc.constant(new WhiteEnterCommand()),
              fc.constant(new TrimEnterCommand()),
              fc.constant(new EmptyEnterCommand()),
              fc.array(validToDoArbitrary())
                .map(toDos => new AddToDosCommands(toDos)),
              fc.constant(new MarkAllCheckCommand()),
              fc.constant(new ToggleItemCheckedCommand()),
              fc.nat().noShrink().map(number => new TriggerEditingCommand(number)),
              validToDoArbitrary()
                .chain(toDo => fc.record({
                  toDo: fc.constant(toDo),
                  number: fc.nat().noShrink()
                }))
                .map(({ toDo, number }) => new EditTodoCommand(toDo, number)),
              trimToDoArbitrary()
                .chain(toDo => fc.record({
                  toDo: fc.constant(toDo),
                  number: fc.nat().noShrink()
                }))
                .map(({ toDo, number }) => new EditTodoCommand(toDo, number)),
              fc.nat().noShrink().map(number => new EditEmptyCommand(number)),
              validToDoArbitrary()
                .chain(toDo => fc.record({
                  toDo: fc.constant(toDo),
                  number: fc.nat().noShrink()
                }))
                .map(({ toDo, number }) => new EditCancelCommand(toDo, number)),
              fc.constant(new ClearCompletedCommand()),
              fc.constant(new GoToAllCommand()),
              fc.constant(new GoToActiveCommand()),
              fc.constant(new GoToCompletedCommand()),
              fc.constant(new GoBackCommand()),

            ],
            // {
            //   replayPath: "AABABt:q"
            // },
            {
              replayPath: "ABAAB:V"
            },
            // 10,
          ),
          async (commands) => {

            await page.goto('http://todomvc.com/examples/react/', { waitUntil: 'networkidle2' });
            // await page.goto('http://todomvc.com/examples/vanillajs/', { waitUntil: 'networkidle2' });

            await page.waitFor(CLASS_SELECTORS.NEW_TODO);

            await fc.asyncModelRun(
              () => ({
                // model: {
                //   toDos: [],
                //   input: {
                //     text: '',
                //     type: STATIC.EMPTY,
                //   },
                //   filter: STATIC.ALL,
                //   toggleAll: false,
                //   navigation: [STATIC.ALL]
                // },
                // model: interpret(modelMachine).start(),
                model: modelMachine.initialState,
                real: page
              }),
              commands
            );
          }),
        {
          // numRuns: 20,
          numRuns: 100,
          // verbose: true,
          // seed: -1884671988, path: "3:3:1:1:1:1:1:1:1:1:1:1:1:1:1:1:1:1:1:1:1:1:1:1", endOnFailure: true
          seed: -1603525407, path: "1:2", endOnFailure: true
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
