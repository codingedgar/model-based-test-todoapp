import * as fc from 'fast-check'
import { Page } from 'puppeteer';
import {
  Model,
  CLASS_SELECTORS,
  STATIC,
  ValidInput
} from './cons';
import {
  checkModel,
} from './expects';
import {
  pickToDo,
  filteredToDos,
  isValidTodo,
  itemsLeftCount,
  clearNewToDo
} from './utils';
import { all, } from "ramda";
import { ModelMachine } from './modelMachine';

export class EnterCommand implements fc.AsyncCommand<ModelMachine, Page, false> {
  constructor() { }

  check(_m: Readonly<ModelMachine>) {
    return true
  };

  async run(m: ModelMachine, page: Page) {

    await checkModel(m.state.context)
    // .catch(e => { throw new Error(e) })

    await page.focus(CLASS_SELECTORS.NEW_TODO)

    await page.keyboard.press('Enter');

    m.send(
      {
        type: 'TO_DO_ADDED',
      }
    )

    await checkModel(m.state.context)
    // .catch(e => { throw new Error(e) })

  };

  toString = () => `${EnterCommand.name}`;
}

export class WriteInputCommand implements fc.AsyncCommand<ModelMachine, Page, false> {
  constructor(readonly input: Model['input']) { }

  check(_m: Readonly<ModelMachine>) {
    return true;
  };

  async run(m: ModelMachine, page: Page) {

    await clearNewToDo(CLASS_SELECTORS.NEW_TODO)

    await page.type(CLASS_SELECTORS.NEW_TODO, this.input.text)

    m.send(
      {
        type: 'INPUT_ASSIGNED',
        payload: this.input
      }
    )

    await checkModel(m.state.context)
    // .catch(e => {  throw new Error(e) })

  };

  toString = () => `${WriteInputCommand.name} ${JSON.stringify(this.input)}`;
}

export class MarkAllCompletedCommand implements fc.AsyncCommand<ModelMachine, Page, false> {
  constructor() { }

  check(m: Readonly<ModelMachine>) {

    return m.state.context.toDos.length > 0;

  };

  async run(m: ModelMachine, page: Page) {

    await page.click(CLASS_SELECTORS.TOGGLE_ALL_LABEL)

    m.send(
      {
        type: 'TOGGLE_ALL_COMPLETED'
      }
    )

    await checkModel(m.state.context)
    // .catch(e => { throw new Error(e) })

  };

  toString = () => `${MarkAllCompletedCommand.name}`;
}

export class ToggleItemCompletedCommand implements fc.AsyncCommand<ModelMachine, Page, false> {
  constructor() { }

  check(m: Readonly<ModelMachine>) {

    return filteredToDos(m.state.context).length > 0;

  };

  async run(m: ModelMachine, page: Page) {

    await page
      .$$(CLASS_SELECTORS.TODO_ITEMS_INPUT)
      .then(async els => {

        let index = 0;

        for (const el of els) {

          m.send(
            {
              type: 'TOGGLE_ITEM_COMPLETED',
              index,
            }
          )
          await el.click()

          await checkModel(m.state.context)
          // .catch(e => { throw new Error(e) })

          index++;
        }

      })

  };

  toString = () => `${ToggleItemCompletedCommand.name}`;
}

export class TriggerEditingCommand implements fc.AsyncCommand<ModelMachine, Page, false> {
  constructor(readonly number: number) { }

  check(m: Readonly<ModelMachine>) {

    return filteredToDos(m.state.context).length > 0;

  };

  async run(m: ModelMachine, page: Page) {
    const index = pickToDo(this.number, m.state.context);

    await page
      .$$(CLASS_SELECTORS.TODO_ITEMS_LABEL)
      .then(async els => {
        const el = els[index];

        await el.click({ clickCount: 2 })

        m.send(
          {
            type: 'EDITED',
            index,
            payload: true
          }
        )

        await checkModel(m.state.context);

        await page.keyboard.press('Enter');

        m.send(
          {
            type: 'EDITED',
            index,
            payload: false
          }
        )


      })

    await checkModel(m.state.context);

  };

  toString = () => `${TriggerEditingCommand.name}`;
}

export class EditTodoCommand implements fc.AsyncCommand<ModelMachine, Page, false> {
  constructor(readonly todo: Model['input'], readonly number: number) { }

  check(m: Readonly<ModelMachine>) {

    return filteredToDos(m.state.context).length > 0;

  };

  async run(m: ModelMachine, page: Page) {
    const index = pickToDo(this.number, m.state.context);

    await page
      .$$(CLASS_SELECTORS.TODO_ITEMS_LABEL)
      .then(async els => {
        const el = els[index];

        await el.click({ clickCount: 2 });
        m.send(
          {
            type: 'EDITED',
            index,
            payload: true
          }
        )

        await Promise
          .all(
            m.state.context.toDos[index].text.split('')
              .map(() =>
                page.keyboard.press('Backspace')
              )
          );

        await checkModel(m.state.context)

        await el.type(this.todo.text);
        await page.keyboard.press('Enter');

        m.send(
          {
            type: 'TEXT_EDITED',
            index,
            payload: (this.todo.type === 'trim') ? this.todo.text.trim() : this.todo.text
          }
        )
        m.send(
          {
            type: 'EDITED',
            index,
            payload: false
          }
        )


      });

    await checkModel(m.state.context)

  };

  toString = () => `${EditTodoCommand.name} ${JSON.stringify(this.todo)}`;
}

export class EditEmptyCommand implements fc.AsyncCommand<ModelMachine, Page, false> {
  constructor(readonly number: number) { }

  check(m: Readonly<ModelMachine>) {

    return filteredToDos(m.state.context).length > 0;

  };

  async run(m: ModelMachine, page: Page) {
    const index = pickToDo(this.number, m.state.context);

    await page
      .$$(CLASS_SELECTORS.TODO_ITEMS_LABEL)
      .then(async els => {
        const el = els[index];

        await el.click({ clickCount: 2 });
        m.send(
          {
            type: 'EDITED',
            index,
            payload: true
          }
        )

        await Promise
          .all(
            m.state.context.toDos[index].text.split('')
              .map(() =>
                page.keyboard.press('Backspace')
              )
          );

        await checkModel(m.state.context);

        m.send(
          {
            type: 'REMOVED_FROM_INDEX',
            index,
            payload: true
          }
        )

        await page.keyboard.press('Enter');

      });

    await checkModel(m.state.context);

  };

  toString = () => `${EditEmptyCommand.name}`;
}

export class EditCancelCommand implements fc.AsyncCommand<ModelMachine, Page, false> {

  model: Readonly<ModelMachine> | undefined

  constructor(readonly todo: Model['input'], readonly number: number) { }

  check(m: Readonly<ModelMachine>) {

    this.model = m;
    return filteredToDos(m.state.context).length > 0;

  };

  async run(m: ModelMachine, page: Page) {
    this.model = m;
    const index = pickToDo(this.number, m.state.context);

    await page
      .$$(CLASS_SELECTORS.TODO_ITEMS_LABEL)
      .then(async els => {

        const el = els[index];

        await el.click({ clickCount: 2 });

        m.send(
          {
            type: 'EDITED',
            index,
            payload: true
          }
        )


        await Promise
          .all(
            m.state.context.toDos[index].text.split('')
              .map(() =>
                page.keyboard.press('Backspace')
              )
          );


        await checkModel(m.state.context)//.catch(e => { throw new Error(e) })

        await el.type(this.todo.text);

        await page.keyboard.press('Escape');
        m.send(
          {
            type: 'EDITED',
            index,
            payload: false
          }
        )

      });

    await checkModel(m.state.context)

  };

  toString = () => `${EditCancelCommand.name} ${JSON.stringify(this.todo)} ${pickToDo(this.number, this.model?.state.context!)}`;

}

export class ClearCompletedCommand implements fc.AsyncCommand<ModelMachine, Page, false> {

  constructor() { }

  check(m: Readonly<ModelMachine>) {
    return itemsLeftCount(m.state.context.toDos) < m.state.context.toDos.length;
  };

  async run(m: ModelMachine, page: Page) {

    await page.click(CLASS_SELECTORS.CLEAR_COMPLETED);

    m.send(
      {
        type: 'COMPLETED_CLEARED'
      }
    )

    await checkModel(m.state.context);

  };

  toString = () => `${ClearCompletedCommand.name}`;

}

export class AddToDosCommands implements fc.AsyncCommand<ModelMachine, Page, false> {

  constructor(readonly toDos: ValidInput[]) { }

  check(_m: Readonly<ModelMachine>) {
    return true
  };

  async run(m: ModelMachine, page: Page) {

    expect(all(isValidTodo)(this.toDos.map(x => x.text))).toBe(true)

    for (const toDo of this.toDos) {

      await clearNewToDo(CLASS_SELECTORS.NEW_TODO)

      await page.type(CLASS_SELECTORS.NEW_TODO, toDo.text)
      m.send(
        {
          type: 'INPUT_ASSIGNED',
          payload: toDo,
        }
      )

      await checkModel(m.state.context);
      await page.keyboard.press('Enter')

      m.send(
        {
          type: 'TO_DO_ADDED',
        }
      )

      await checkModel(m.state.context);

    }

    await checkModel(m.state.context);



  };

  toString = () => `${AddToDosCommands.name} ${JSON.stringify(this.toDos)}`;

}

export class GoToAllCommand implements fc.AsyncCommand<ModelMachine, Page, false> {

  constructor() { }

  check(m: Readonly<ModelMachine>) {
    return m.state.context.toDos.length > 0;
  };

  async run(m: ModelMachine, page: Page) {

    await expect(page)
      .toMatchElement(CLASS_SELECTORS.FILTER_ITEMS, { text: 'All' })
      .then(el =>
        el.click()
      )




    m.send(
      {
        type: 'FILTER_SELECTED',
        payload: STATIC.ALL
      }
    )

    await checkModel(m.state.context);

  };

  toString = () => `${GoToAllCommand.name}`;

}

export class GoToActiveCommand implements fc.AsyncCommand<ModelMachine, Page, false> {

  constructor() { }

  check(m: Readonly<ModelMachine>) {
    return m.state.context.toDos.length > 0;
  };

  async run(m: ModelMachine, page: Page) {

    await expect(page)
      .toMatchElement(CLASS_SELECTORS.FILTER_ITEMS, { text: 'Active' })
      .then(el =>
        el.click()
      )



    m.send(
      {
        type: 'FILTER_SELECTED',
        payload: STATIC.ACTIVE
      }
    )

    await checkModel(m.state.context);

  };

  toString = () => `${GoToActiveCommand.name}`;

}

export class GoToCompletedCommand implements fc.AsyncCommand<ModelMachine, Page, false> {

  constructor() { }

  check(m: Readonly<ModelMachine>) {
    return m.state.context.toDos.length > 0;
  };

  async run(m: ModelMachine, page: Page) {

    await expect(page)
      .toMatchElement(CLASS_SELECTORS.FILTER_ITEMS, { text: 'Completed' })
      .then(el =>
        el.click()
      )



    m.send(
      {
        type: 'FILTER_SELECTED',
        payload: STATIC.COMPLETED
      }
    )

    await checkModel(m.state.context);

  };

  toString = () => `${GoToCompletedCommand.name}`;

}

export class GoBackCommand implements fc.AsyncCommand<ModelMachine, Page, false> {

  constructor() { }

  check(m: Readonly<ModelMachine>) {
    return m.state.context.navigation.length > 1;
  };

  async run(m: ModelMachine, page: Page) {

    await page.goBack()

    m.send(
      {
        type: 'WENT_BACK'
      }
    )

    await checkModel(m.state.context);

  };

  toString = () => `${GoBackCommand.name}`;

}
