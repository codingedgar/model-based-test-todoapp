import * as fc from 'fast-check'
import { Page } from 'puppeteer';
import {
  Model,
  CLASS_SELECTORS,
  ToDoItem,
  STATIC,
  ValidInput
} from './cons';
import {
  checkNewToDo,
  checkLocalStorage,
  checkToDosItems,
  clearNewToDo,
  checkToggleAll,
  checkTodoItemsInput,
  checkCount,
  checkModel,
} from './expects';
import {
  // clt,
  // valueOfEl,
  pickToDo,
  toggleCheckTodo,
  itemsLeftCount,
  filteredToDos,
  isValidTodo,
} from './utils';
import { remove, init, all, clone } from "ramda";
import { ModelMachine, modelMachine, ModelMachine2, ModelMachine3 } from './modelMachine';

export class EmptyEnterCommand implements fc.AsyncCommand<ModelMachine3, Page, false> {
  constructor() { }

  check(m: Readonly<ModelMachine3>) {

    return m.context.input.type === 'empty';

  };

  async run(m: ModelMachine3, page: Page) {

    // clt('EmptyEnterCommand')(m.input)
    console.log(m.context)
    await checkNewToDo(m.context)

    await page.focus(CLASS_SELECTORS.NEW_TODO)

    await page.keyboard.press('Enter');

    await checkModel(m.context)

  };

  toString = () => `${WhiteEnterCommand.name}`;
}

export class WhiteEnterCommand implements fc.AsyncCommand<ModelMachine3, Page, false> {
  constructor() { }

  check(m: Readonly<ModelMachine3>) {
    // return isWhiteSpacesTodo(m.input.text)
    return m.context.input.type === 'whitespace'
  };

  async run(m: ModelMachine3, page: Page) {

    await page.focus(CLASS_SELECTORS.NEW_TODO)

    await page.keyboard.press('Enter');

    await checkModel(m.context);

  };

  toString = () => `${WhiteEnterCommand.name}`;
}

export class ValidEnterCommand implements fc.AsyncCommand<ModelMachine3, Page, false> {
  constructor() { }

  check(m: Readonly<ModelMachine3>) {
    return m.context.input.type === 'valid'
  };

  async run(m: ModelMachine3, page: Page) {

    // clt('ValidEnterCommand')(m.input)


    await checkModel(m.context)
    // .catch(e => { throw new Error(e) })

    await page.focus(CLASS_SELECTORS.NEW_TODO)

    await page.keyboard.press('Enter');
    // m.toDos = m.toDos.concat({
    //   text: m.input.text,
    //   checked: false,
    //   editing: false
    // });

    // m.toggleAll = itemsLeftCount(m) === 0;

    // m.input = {
    //   text: '',
    //   type: 'empty',
    // };

    m = modelMachine.transition(
      m,
      {
        type: 'ADD_VALID_TO_DO',
      }
    )

    await checkModel(m.context)
    // .catch(e => { throw new Error(e) })

  };

  toString = () => `${ValidEnterCommand.name}`;
}

export class TrimEnterCommand implements fc.AsyncCommand<ModelMachine3, Page, false> {
  constructor() { }

  check(m: Readonly<ModelMachine3>) {

    return m.context.input.type === 'trim';

  };

  async run(m: ModelMachine3, page: Page) {

    // clt('TrimEnterCommand')(m.input)

    await checkModel(m.context);

    await page.focus(CLASS_SELECTORS.NEW_TODO)

    await page.keyboard.press('Enter');

    // m.toDos = m.toDos.concat({
    //   text: m.input.text.trim(),
    //   checked: false,
    //   editing: false
    // });

    // m.input = {
    //   text: '',
    //   type: 'empty',
    // }

    // m.toggleAll = itemsLeftCount(m) === 0;

    m = modelMachine.transition(
      m,
      {
        type: 'ADD_TRIM_TO_DO',
      }
    )

    await checkModel(m.context)
    // .catch(e => { throw new Error(e) })

  };

  toString = () => `${TrimEnterCommand.name}`;
}

export class WriteInputCommand implements fc.AsyncCommand<ModelMachine3, Page, false> {
  constructor(readonly input: Model['input']) { }

  check(_m: Readonly<ModelMachine3>) {
    return true;
  };

  async run(m: ModelMachine3, page: Page) {

    // await checkModel(m.context).catch(e => { throw new Error(e) })
    console.log(m.context)
    console.log(m.transitions)
    console.log(m.history?.transitions)
    await clearNewToDo(CLASS_SELECTORS.NEW_TODO)

    await page.type(CLASS_SELECTORS.NEW_TODO, this.input.text)

    // m.input = this.input
    m = modelMachine.transition(
      m,
      {
        type: 'ASSIGN_INPUT',
        payload: this.input
      }
    )
    console.log(m.context);
    await checkModel(m.context)
    // .catch(e => {  throw new Error(e) })

  };

  toString = () => `${WriteInputCommand.name} ${JSON.stringify(this.input)}`;
}

export class MarkAllCheckCommand implements fc.AsyncCommand<ModelMachine3, Page, false> {
  constructor() { }

  check(m: Readonly<ModelMachine3>) {

    // console.log(m)
    return m.context.toDos.length > 0;

  };

  async run(m: ModelMachine3, page: Page) {

    await page.click(CLASS_SELECTORS.TOGGLE_ALL_LABEL)
    // m.toggleAll = !m.toggleAll
    // m.toDos = m.toDos.map(todo => ({ ...todo, checked: m.toggleAll }))

    m = modelMachine.transition(
      m,
      {
        type: 'MARK_ALL_CHECKED'
      }
    )

    await checkModel(m.context).catch(e => { throw new Error(e) })

  };

  toString = () => `${MarkAllCheckCommand.name}`;
}

export class ToggleItemCheckedCommand implements fc.AsyncCommand<ModelMachine3, Page, false> {
  constructor() { }

  check(m: Readonly<ModelMachine3>) {

    // console.log(m)
    return filteredToDos(m.context).length > 0;

  };

  async run(m: ModelMachine3, page: Page) {

    await page
      .$$(CLASS_SELECTORS.TODO_ITEMS_INPUT)
      .then(async els => {

        let index = 0;

        for (const el of els) {

          // m = toggleCheckTodo(index, m.context);
          m = modelMachine.transition(
            m,
            {
              type: 'TOGGLE_ITEM_COMPLETED',
              index,
            }
          )

          await el.click()

          await checkModel(m.context)
          // .catch(e => { throw new Error(e) })
          // ;

          index++;
        }

      })

  };

  toString = () => `${ToggleItemCheckedCommand.name}`;
}

export class TriggerEditingCommand implements fc.AsyncCommand<ModelMachine3, Page, false> {
  constructor(readonly number: number) { }

  check(m: Readonly<ModelMachine3>) {

    // console.log(m)
    return filteredToDos(m.context).length > 0;

  };

  async run(m: ModelMachine3, page: Page) {
    const index = pickToDo(this.number, m.context);

    await page
      .$$(CLASS_SELECTORS.TODO_ITEMS_LABEL)
      .then(async els => {
        const el = els[index];

        await el.click({ clickCount: 2 })

        m = modelMachine.transition(
          m,
          {
            type: 'EDITED',
            index,
            payload: true
          }
        )
        // m.toDos[index].editing = true;

        await checkModel(m.context);

        await page.keyboard.press('Enter');

        m = modelMachine.transition(
          m,
          {
            type: 'EDITED',
            index,
            payload: false
          }
        )
        // m.toDos[index].editing = false;


      })

    await checkModel(m.context);

  };

  toString = () => `${TriggerEditingCommand.name}`;
}

export class EditTodoCommand implements fc.AsyncCommand<ModelMachine3, Page, false> {
  constructor(readonly todo: Model['input'], readonly number: number) { }

  check(m: Readonly<ModelMachine3>) {

    // console.log(m)
    return filteredToDos(m.context).length > 0;

  };

  async run(m: ModelMachine3, page: Page) {
    const index = pickToDo(this.number, m.context);

    await page
      .$$(CLASS_SELECTORS.TODO_ITEMS_LABEL)
      .then(async els => {
        const el = els[index];

        await el.click({ clickCount: 2 });
        // m.toDos[index].editing = true;
        m = modelMachine.transition(
          m,
          {
            type: 'EDITED',
            index,
            payload: true
          }
        )

        await Promise
          .all(
            m.context.toDos[index].text.split('')
              .map(() =>
                page.keyboard.press('Backspace')
              )
          );

        await checkModel(m.context)

        await el.type(this.todo.text);
        await page.keyboard.press('Enter');

        // m.toDos[index].text = (this.todo.type === 'trim') ? this.todo.text.trim() : this.todo.text;
        // m.toDos[index].editing = false;
        m = modelMachine.transition(
          m,
          {
            type: 'TEXT_EDITED',
            index,
            payload: (this.todo.type === 'trim') ? this.todo.text.trim() : this.todo.text
          }
        )
        m = modelMachine.transition(
          m,
          {
            type: 'EDITED',
            index,
            payload: false
          }
        )


      });

    await checkModel(m.context)

  };

  toString = () => `${EditTodoCommand.name} ${JSON.stringify(this.todo)}`;
}

export class EditEmptyCommand implements fc.AsyncCommand<ModelMachine3, Page, false> {
  constructor(readonly number: number) { }

  check(m: Readonly<ModelMachine3>) {

    // console.log(m)
    return filteredToDos(m.context).length > 0;

  };

  async run(m: ModelMachine3, page: Page) {
    const index = pickToDo(this.number, m.context);

    await page
      .$$(CLASS_SELECTORS.TODO_ITEMS_LABEL)
      .then(async els => {
        const el = els[index];

        await el.click({ clickCount: 2 });
        // m.toDos[index].editing = true;
        m = modelMachine.transition(
          m,
          {
            type: 'EDITED',
            index,
            payload: true
          }
        )

        await Promise
          .all(
            m.context.toDos[index].text.split('')
              .map(() =>
                page.keyboard.press('Backspace')
              )
          );

        await checkModel(m.context);

        // m.toDos = remove(index, 1, m.toDos);
        m = modelMachine.transition(
          m,
          {
            type: 'REMOVED_FROM_INDEX',
            index,
            payload: true
          }
        )

        await page.keyboard.press('Enter');

      });

    await checkModel(m.context);

  };

  toString = () => `${EditEmptyCommand.name}`;
}

export class EditCancelCommand implements fc.AsyncCommand<ModelMachine3, Page, false> {

  model: ModelMachine3 | undefined

  constructor(readonly todo: Model['input'], readonly number: number) { }

  check(m: Readonly<ModelMachine3>) {

    this.model = m;
    return filteredToDos(m.context).length > 0;

  };

  async run(m: ModelMachine3, page: Page) {
    this.model = m;
    const index = pickToDo(this.number, m.context);

    await page
      .$$(CLASS_SELECTORS.TODO_ITEMS_LABEL)
      .then(async els => {

        const el = els[index];

        await el.click({ clickCount: 2 });

        // m.toDos[index].editing = true
        m = modelMachine.transition(
          m,
          {
            type: 'EDITED',
            index,
            payload: true
          }
        )


        await Promise
          .all(
            m.context.toDos[index].text.split('')
              .map(() =>
                page.keyboard.press('Backspace')
              )
          );


        await checkModel(m.context)//.catch(e => { throw new Error(e) })

        await el.type(this.todo.text);

        await page.keyboard.press('Escape');
        // m.toDos[index].editing = false
        m = modelMachine.transition(
          m,
          {
            type: 'EDITED',
            index,
            payload: false
          }
        )

      });

    await checkModel(m.context)

  };

  toString = () => `${EditCancelCommand.name} ${JSON.stringify(this.todo)} ${pickToDo(this.number, this.model?.context!)}`;

}

export class ClearCompletedCommand implements fc.AsyncCommand<ModelMachine3, Page, false> {

  constructor() { }

  check(m: Readonly<ModelMachine3>) {
    // console.log(m.toDos.length)
    // console.log(itemsLeftCount(m))
    return itemsLeftCount(m.context) < m.context.toDos.length;
  };

  async run(m: ModelMachine3, page: Page) {

    // console.log('hi', m)
    await page.click(CLASS_SELECTORS.CLEAR_COMPLETED);
    // m.toDos = m.toDos.filter(toDo => !toDo.checked);
    // m.toggleAll = itemsLeftCount(m) === 0;

    m = modelMachine.transition(
      m,
      {
        type: 'COMPLETED_CLEARED'
      }
    )

    await checkModel(m.context);

  };

  toString = () => `${ClearCompletedCommand.name}`;

}

export class AddToDosCommands implements fc.AsyncCommand<ModelMachine3, Page, false> {

  constructor(readonly toDos: ValidInput[]) { }

  check(_m: Readonly<ModelMachine3>) {
    return true
  };

  async run(m: ModelMachine3, page: Page) {

    expect(all(isValidTodo)(this.toDos.map(x => x.text))).toBe(true)
    console.log(m.transitions)

    for (const toDo of this.toDos) {

      await clearNewToDo(CLASS_SELECTORS.NEW_TODO)

      await page.type(CLASS_SELECTORS.NEW_TODO, toDo.text)
      // m.input = { text: toDo.text, type: 'valid' }
      m = modelMachine.transition(
        m,
        {
          type: 'ASSIGN_INPUT',
          payload: toDo,
        }
      )

      await checkModel(m.context);
      await page.keyboard.press('Enter')

      // m.input = { text: '', type: 'empty' }
      // m.toDos = m.toDos.concat({
      //   checked: false,
      //   editing: false,
      //   text: toDo.text,
      // });
      // m.toggleAll = itemsLeftCount(m) === 0;
      // console.log(m.context)
      m = modelMachine.transition(
        m,
        {
          type: 'ADD_VALID_TO_DO',
        }
      )
      // console.log(m.context)

      await checkModel(m.context);

    }

    await checkModel(m.context);
    m = modelMachine.transition(
      m,
      {
        type: 'FILTER_SELECTED',
        payload: 'completed'
      }
    )


    console.log(m.context)
    // console.log(m.transitions)
    // console.log(m.history?.transitions)

  };

  toString = () => `${AddToDosCommands.name} ${JSON.stringify(this.toDos)}`;

}

export class GoToAllCommand implements fc.AsyncCommand<ModelMachine3, Page, false> {

  constructor() { }

  check(m: Readonly<ModelMachine3>) {
    return m.context.toDos.length > 0;
  };

  async run(m: ModelMachine3, page: Page) {

    await expect(page)
      .toMatchElement(CLASS_SELECTORS.FILTER_ITEMS, { text: 'All' })
      .then(el =>
        el.click()
      )


    // if (m.context.filter !== STATIC.ALL) {
    //   m.navigation = m.navigation.concat(STATIC.ALL)
    // }

    // m.filter = STATIC.ALL

    m = modelMachine.transition(
      m,
      {
        type: 'FILTER_SELECTED',
        payload: STATIC.ALL
      }
    )

    await checkModel(m.context);

  };

  toString = () => `${GoToAllCommand.name}`;

}

export class GoToActiveCommand implements fc.AsyncCommand<ModelMachine3, Page, false> {

  constructor() { }

  check(m: Readonly<ModelMachine3>) {
    return m.context.toDos.length > 0;
  };

  async run(m: ModelMachine3, page: Page) {

    await expect(page)
      .toMatchElement(CLASS_SELECTORS.FILTER_ITEMS, { text: 'Active' })
      .then(el =>
        el.click()
      )

    // if (m.filter !== STATIC.ACTIVE) {
    //   m.navigation = m.navigation.concat(STATIC.ACTIVE)
    // }

    // m.filter = STATIC.ACTIVE

    m = modelMachine.transition(
      m,
      {
        type: 'FILTER_SELECTED',
        payload: STATIC.ACTIVE
      }
    )

    await checkModel(m.context);

  };

  toString = () => `${GoToActiveCommand.name}`;

}

export class GoToCompletedCommand implements fc.AsyncCommand<ModelMachine3, Page, false> {

  constructor() { }

  check(m: Readonly<ModelMachine3>) {
    return m.context.toDos.length > 0;
  };

  async run(m: ModelMachine3, page: Page) {

    await expect(page)
      .toMatchElement(CLASS_SELECTORS.FILTER_ITEMS, { text: 'Completed' })
      .then(el =>
        el.click()
      )

    // if (m.filter !== STATIC.COMPLETED) {
    //   m.navigation = m.navigation.concat(STATIC.COMPLETED)
    // }

    // m.filter = STATIC.COMPLETED

    m = modelMachine.transition(
      m,
      {
        type: 'FILTER_SELECTED',
        payload: STATIC.COMPLETED
      }
    )

    await checkModel(m.context);

  };

  toString = () => `${GoToCompletedCommand.name}`;

}

export class GoBackCommand implements fc.AsyncCommand<ModelMachine3, Page, false> {

  constructor() { }

  check(m: Readonly<ModelMachine3>) {
    return m.context.navigation.length > 1;
  };

  async run(m: ModelMachine3, page: Page) {

    await page.goBack()
    // console.log(m)
    // m.navigation = init(m.navigation);
    // m.filter = m.navigation[m.navigation.length - 1]

    m = modelMachine.transition(
      m,
      {
        type: 'WENT_BACK'
      }
    )

    await checkModel(m.context);

  };

  toString = () => `${GoBackCommand.name}`;

}
