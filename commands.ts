import * as fc from 'fast-check'
import { Page } from 'puppeteer';
import {
  Model,
  CLASS_SELECTORS,
  ToDoItem,
  STATIC
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
} from './utils';
import { remove, init } from "ramda";

export class EmptyEnterCommand implements fc.AsyncCommand<Model, Page, false> {
  constructor() { }

  check(m: Readonly<Model>) {

    return m.input.type === 'empty';

  };

  async run(m: Model, page: Page) {

    // clt('EmptyEnterCommand')(m.input)

    await checkNewToDo(m)

    await page.focus(CLASS_SELECTORS.NEW_TODO)

    await page.keyboard.press('Enter');

    await checkModel(m)

  };

  toString = () => `${WhiteEnterCommand.name}`;
}

export class WhiteEnterCommand implements fc.AsyncCommand<Model, Page, false> {
  constructor() { }

  check(m: Readonly<Model>) {
    // return isWhiteSpacesTodo(m.input.text)
    return m.input.type === 'whitespace'
  };

  async run(m: Model, page: Page) {

    await page.focus(CLASS_SELECTORS.NEW_TODO)

    await page.keyboard.press('Enter');

    await checkModel(m);

  };

  toString = () => `${WhiteEnterCommand.name}`;
}

export class ValidEnterCommand implements fc.AsyncCommand<Model, Page, false> {
  constructor() { }

  check(m: Readonly<Model>) {
    return m.input.type === 'valid'
  };

  async run(m: Model, page: Page) {

    // clt('ValidEnterCommand')(m.input)


    await checkModel(m)
    // .catch(e => { throw new Error(e) })

    await page.focus(CLASS_SELECTORS.NEW_TODO)

    await page.keyboard.press('Enter');
    m.toDos = m.toDos.concat({
      text: m.input.text,
      checked: false,
      editing: false
    });

    m.toggleAll = itemsLeftCount(m) === 0;

    m.input = {
      text: '',
      type: 'empty',
    };

    await checkModel(m)
    // .catch(e => { throw new Error(e) })

  };

  toString = () => `${ValidEnterCommand.name}`;
}

export class TrimEnterCommand implements fc.AsyncCommand<Model, Page, false> {
  constructor() { }

  check(m: Readonly<Model>) {

    return m.input.type === 'trim';

  };

  async run(m: Model, page: Page) {

    // clt('TrimEnterCommand')(m.input)

    await checkModel(m);

    await page.focus(CLASS_SELECTORS.NEW_TODO)

    await page.keyboard.press('Enter');

    m.toDos = m.toDos.concat({
      text: m.input.text.trim(),
      checked: false,
      editing: false
    });

    m.input = {
      text: '',
      type: 'empty',
    }

    m.toggleAll = itemsLeftCount(m) === 0;

    await checkModel(m)
    // .catch(e => { throw new Error(e) })

  };

  toString = () => `${TrimEnterCommand.name}`;
}

export class WriteInputCommand implements fc.AsyncCommand<Model, Page, false> {
  constructor(readonly input: Model['input']) { }

  check(_m: Readonly<Model>) {
    return true;
  };

  async run(m: Model, page: Page) {

    await checkModel(m).catch(e => { throw new Error(e) })

    await clearNewToDo(CLASS_SELECTORS.NEW_TODO)

    await page.type(CLASS_SELECTORS.NEW_TODO, this.input.text)
    m.input = this.input

    await checkModel(m)
    // .catch(e => { throw new Error(e) })

  };

  toString = () => `${WriteInputCommand.name} ${JSON.stringify(this.input)}`;
}

export class MarkAllCheckCommand implements fc.AsyncCommand<Model, Page, false> {
  constructor() { }

  check(m: Readonly<Model>) {

    // console.log(m)
    return m.toDos.length > 0;

  };

  async run(m: Model, page: Page) {

    await page.click(CLASS_SELECTORS.TOGGLE_ALL_LABEL)
    m.toggleAll = !m.toggleAll
    m.toDos = m.toDos.map(todo => ({ ...todo, checked: m.toggleAll }))

    await checkModel(m).catch(e => { throw new Error(e) })

  };

  toString = () => `${MarkAllCheckCommand.name}`;
}

export class ToggleItemCheckedCommand implements fc.AsyncCommand<Model, Page, false> {
  constructor() { }

  check(m: Readonly<Model>) {

    // console.log(m)
    return filteredToDos(m).length > 0;

  };

  async run(m: Model, page: Page) {

    await page
      .$$(CLASS_SELECTORS.TODO_ITEMS_INPUT)
      .then(async els => {

        let index = 0;

        for (const el of els) {

          m = toggleCheckTodo(index, m);

          await el.click()

          await checkModel(m)
          // .catch(e => { throw new Error(e) })
          // ;

          index++;
        }

      })

  };

  toString = () => `${ToggleItemCheckedCommand.name}`;
}

export class TriggerEditingCommand implements fc.AsyncCommand<Model, Page, false> {
  constructor(readonly number: number) { }

  check(m: Readonly<Model>) {

    // console.log(m)
    return filteredToDos(m).length > 0;

  };

  async run(m: Model, page: Page) {
    const index = pickToDo(this.number, m);

    await page
      .$$(CLASS_SELECTORS.TODO_ITEMS_LABEL)
      .then(async els => {
        const el = els[index];

        await el.click({ clickCount: 2 })
        m.toDos[index].editing = true;

        await checkModel(m);

        await page.keyboard.press('Enter');

        m.toDos[index].editing = false;


      })

    await checkModel(m);

  };

  toString = () => `${TriggerEditingCommand.name}`;
}

export class EditTodoCommand implements fc.AsyncCommand<Model, Page, false> {
  constructor(readonly todo: Model['input'], readonly number: number) { }

  check(m: Readonly<Model>) {

    // console.log(m)
    return filteredToDos(m).length > 0;

  };

  async run(m: Model, page: Page) {
    const index = pickToDo(this.number, m);

    await page
      .$$(CLASS_SELECTORS.TODO_ITEMS_LABEL)
      .then(async els => {
        const el = els[index];

        await el.click({ clickCount: 2 });
        m.toDos[index].editing = true;

        await Promise
          .all(
            m.toDos[index].text.split('')
              .map(() =>
                page.keyboard.press('Backspace')
              )
          );

        await checkModel(m)

        await el.type(this.todo.text);
        await page.keyboard.press('Enter');
        m.toDos[index].text = (this.todo.type === 'trim') ? this.todo.text.trim() : this.todo.text;

        m.toDos[index].editing = false;


      });

    await checkModel(m)

  };

  toString = () => `${EditTodoCommand.name} ${JSON.stringify(this.todo)}`;
}

export class EditEmptyCommand implements fc.AsyncCommand<Model, Page, false> {
  constructor(readonly number: number) { }

  check(m: Readonly<Model>) {

    // console.log(m)
    return filteredToDos(m).length > 0;

  };

  async run(m: Model, page: Page) {
    const index = pickToDo(this.number, m);

    await page
      .$$(CLASS_SELECTORS.TODO_ITEMS_LABEL)
      .then(async els => {
        const el = els[index];

        await el.click({ clickCount: 2 });
        m.toDos[index].editing = true;

        await Promise
          .all(
            m.toDos[index].text.split('')
              .map(() =>
                page.keyboard.press('Backspace')
              )
          );

        await checkModel(m);

        m.toDos = remove(index, 1, m.toDos);

        await page.keyboard.press('Enter');

      });

    await checkModel(m);

  };

  toString = () => `${EditEmptyCommand.name}`;
}

export class EditCancelCommand implements fc.AsyncCommand<Model, Page, false> {

  model: Model | undefined

  constructor(readonly todo: Model['input'], readonly number: number) { }

  check(m: Readonly<Model>) {

    this.model = m;
    return filteredToDos(m).length > 0;

  };

  async run(m: Model, page: Page) {
    this.model = m;
    const index = pickToDo(this.number, m);

    await page
      .$$(CLASS_SELECTORS.TODO_ITEMS_LABEL)
      .then(async els => {

        const el = els[index];

        await el.click({ clickCount: 2 });

        m.toDos[index].editing = true

        await Promise
          .all(
            m.toDos[index].text.split('')
              .map(() =>
                page.keyboard.press('Backspace')
              )
          );


        await checkModel(m)//.catch(e => { throw new Error(e) })

        await el.type(this.todo.text);

        await page.keyboard.press('Escape');
        m.toDos[index].editing = false

      });

    await checkModel(m)

  };

  toString = () => `${EditCancelCommand.name} ${JSON.stringify(this.todo)} ${pickToDo(this.number, this.model!)}`;

}

export class ClearCompletedCommand implements fc.AsyncCommand<Model, Page, false> {

  constructor() { }

  check(m: Readonly<Model>) {
    // console.log(m.toDos.length)
    // console.log(itemsLeftCount(m))
    return itemsLeftCount(m) < m.toDos.length;
  };

  async run(m: Model, page: Page) {

    // console.log('hi', m)
    await page.click(CLASS_SELECTORS.CLEAR_COMPLETED);
    m.toDos = m.toDos.filter(toDo => !toDo.checked);
    m.toggleAll = itemsLeftCount(m) === 0;
    await checkModel(m);

  };

  toString = () => `${ClearCompletedCommand.name}`;

}

export class AddToDosCommands implements fc.AsyncCommand<Model, Page, false> {

  constructor(readonly toDos: Model['input'][]) { }

  check(m: Readonly<Model>) {
    return true
  };

  async run(m: Model, page: Page) {

    for (const toDo of this.toDos) {

      await clearNewToDo(CLASS_SELECTORS.NEW_TODO)

      await page.type(CLASS_SELECTORS.NEW_TODO, toDo.text)
      m.input = { text: toDo.text, type: 'valid' }

      await page.keyboard.press('Enter')
      m.input = { text: '', type: 'empty' }
      m.toDos = m.toDos.concat({
        checked: false,
        editing: false,
        text: toDo.text,
      });
      m.toggleAll = itemsLeftCount(m) === 0;

    }

    await checkModel(m);

  };

  toString = () => `${AddToDosCommands.name} ${JSON.stringify(this.toDos)}`;

}

export class GoToAllCommand implements fc.AsyncCommand<Model, Page, false> {

  constructor() { }

  check(m: Readonly<Model>) {
    return m.toDos.length > 0;
  };

  async run(m: Model, page: Page) {

    await expect(page)
      .toMatchElement(CLASS_SELECTORS.FILTER_ITEMS, { text: 'All' })
      .then(el =>
        el.click()
      )

    if (m.filter !== STATIC.ALL) {
      m.navigation = m.navigation.concat(STATIC.ALL)
    }

    m.filter = STATIC.ALL

    await checkModel(m);

  };

  toString = () => `${GoToAllCommand.name}`;

}

export class GoToActiveCommand implements fc.AsyncCommand<Model, Page, false> {

  constructor() { }

  check(m: Readonly<Model>) {
    return m.toDos.length > 0;
  };

  async run(m: Model, page: Page) {

    await expect(page)
      .toMatchElement(CLASS_SELECTORS.FILTER_ITEMS, { text: 'Active' })
      .then(el =>
        el.click()
      )

    if (m.filter !== STATIC.ACTIVE) {
      m.navigation = m.navigation.concat(STATIC.ACTIVE)
    }

    m.filter = STATIC.ACTIVE

    await checkModel(m);

  };

  toString = () => `${GoToActiveCommand.name}`;

}

export class GoToCompletedCommand implements fc.AsyncCommand<Model, Page, false> {

  constructor() { }

  check(m: Readonly<Model>) {
    return m.toDos.length > 0;
  };

  async run(m: Model, page: Page) {

    await expect(page)
      .toMatchElement(CLASS_SELECTORS.FILTER_ITEMS, { text: 'Completed' })
      .then(el =>
        el.click()
      )

    if (m.filter !== STATIC.COMPLETED) {
      m.navigation = m.navigation.concat(STATIC.COMPLETED)
    }

    m.filter = STATIC.COMPLETED

    await checkModel(m);

  };

  toString = () => `${GoToActiveCommand.name}`;

}

export class GoBackCommand implements fc.AsyncCommand<Model, Page, false> {

  constructor() { }

  check(m: Readonly<Model>) {
    return m.navigation.length > 1;
  };

  async run(m: Model, page: Page) {

    await page.goBack()
    console.log(m)
    m.navigation = init(m.navigation);
    m.filter = m.navigation[m.navigation.length - 1]

    await checkModel(m);

  };

  toString = () => `${GoBackCommand.name}`;

}
