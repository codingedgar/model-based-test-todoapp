import * as fc from 'fast-check'
import { CLASS_SELECTORS } from './cons';
import {
  // ValidEnterCommand,
  // WhiteEnterCommand,
  // EmptyEnterCommand,
  // TrimEnterCommand,
  WriteInputCommand,
  MarkAllCompletedCommand,
  ToggleItemCompletedCommand,
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
  EnterCommand,
} from './commands';
import {
  validToDoArbitrary,
  whitespaceToDoArbitrary,
  trimToDoArbitrary,
  emptyToDoArbitrary,
} from './arbitraties';
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
              emptyToDoArbitrary()
                .map(toDo => new WriteInputCommand(toDo)),
              fc.constant(new EnterCommand()),
              fc.array(validToDoArbitrary())
                .map(toDos => new AddToDosCommands(toDos)),
              fc.constant(new MarkAllCompletedCommand()),
              fc.constant(new ToggleItemCompletedCommand()),
              fc.nat().noShrink().map(number => new TriggerEditingCommand(number)),
              fc.record({
                toDo: validToDoArbitrary(),
                number: fc.nat().noShrink()
              })
                .map(({ toDo, number }) => new EditTodoCommand(toDo, number)),
              fc.record({
                toDo: trimToDoArbitrary(),
                number: fc.nat().noShrink()
              })
                .map(({ toDo, number }) => new EditTodoCommand(toDo, number)),
              fc.nat().noShrink().map(number => new EditEmptyCommand(number)),
              fc.record({
                toDo: validToDoArbitrary(),
                number: fc.nat().noShrink()
              })
                .map(({ toDo, number }) => new EditCancelCommand(toDo, number)),
              fc.constant(new ClearCompletedCommand()),
              fc.constant(new GoToAllCommand()),
              fc.constant(new GoToActiveCommand()),
              fc.constant(new GoToCompletedCommand()),
              fc.constant(new GoBackCommand()),

            ],
            // {
            //   replayPath: ""
            // },
            // 10,
          ),
          async (commands) => {

            await page.goto('http://todomvc.com/examples/react/', { waitUntil: 'networkidle2' });

            await page.waitFor(CLASS_SELECTORS.NEW_TODO);

            await fc.asyncModelRun(
              () => ({
                model: interpret(modelMachine).start(),
                real: page
              }),
              commands
            );
          }),
        {
          // numRuns: 20,
          numRuns: 100,
          // verbose: true,
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
