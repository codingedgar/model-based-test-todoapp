import * as fc from 'fast-check'
import { Page } from 'puppeteer';
import {
  Model,
  CLASS_SELECTORS,
  ToDoItem
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
  valueOfEl, scale, pickToDo, toggleCheckTodo,
} from './utils';
import { tail, type } from "ramda";

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

export class MarkAllInvalidCheckCommand implements fc.AsyncCommand<Model, Page, false> {
  constructor() { }

  check(m: Readonly<Model>) {

    return m.toDos.length === 0;

  };

  async run(m: Model, page: Page) {

    await page.focus(CLASS_SELECTORS.NEW_TODO)

    await page.keyboard.press('Enter');

    await checkModel(m).catch(e => { throw new Error(e) })

  };

  toString = () => `${MarkAllInvalidCheckCommand.name}`;
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
    return m.toDos.length > 0;

  };

  async run(m: Model, page: Page) {

    await page
      .$$(CLASS_SELECTORS.TODO_ITEMS_INPUT)
      .then(async els => {

        let index = 0;

        expect(els.length).toBe(m.toDos.length)

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
  constructor() { }

  check(m: Readonly<Model>) {

    // console.log(m)
    return m.toDos.length > 0;

  };

  async run(m: Model, page: Page) {

    await page
      .$$(CLASS_SELECTORS.TODO_ITEMS_LABEL)
      .then(async els => {
        const el = els[0];

        await el.click({ clickCount: 2 })

        await page
          .$('.todo-list li.editing .view')
          .then(async view =>
            await view?.evaluate(el => window.getComputedStyle(el).display)
          )
          .then(x => {
            expect(x).toBe('none')
          })

        await checkLocalStorage(m);

        await page.keyboard.press('Enter');

      })

  };

  toString = () => `${TriggerEditingCommand.name}`;
}

export class EditTodoCommand implements fc.AsyncCommand<Model, Page, false> {
  constructor(readonly todo: Model['input']) { }

  check(m: Readonly<Model>) {

    // console.log(m)
    return m.toDos.length > 0;

  };

  async run(m: Model, page: Page) {

    await page
      .$$(CLASS_SELECTORS.TODO_ITEMS_LABEL)
      .then(async els => {
        const el = els[0];

        await el.click({ clickCount: 2 });
        m.toDos[0].editing = true;

        await Promise
          .all(
            m.toDos[0].text.split('')
              .map(() =>
                page.keyboard.press('Backspace')
              )
          );

        await checkModel(m)

        await el.type(this.todo.text);
        await page.keyboard.press('Enter');
        m.toDos[0].text = (this.todo.type === 'trim') ? this.todo.text.trim() : this.todo.text;

        m.toDos[0].editing = false;


      });

    await checkModel(m)

  };

  toString = () => `${EditTodoCommand.name} ${JSON.stringify(this.todo)}`;
}

export class EditEmptyCommand implements fc.AsyncCommand<Model, Page, false> {
  constructor() { }

  check(m: Readonly<Model>) {

    // console.log(m)
    return m.toDos.length > 0;

  };

  async run(m: Model, page: Page) {

    await page
      .$$(CLASS_SELECTORS.TODO_ITEMS_LABEL)
      .then(async els => {
        const el = els[0];

        await el.click({ clickCount: 2 });

        await Promise
          .all(
            m.toDos[0].text.split('')
              .map(() =>
                page.keyboard.press('Backspace')
              )
          );

        await checkLocalStorage(m);

        m.toDos = tail(m.toDos);

        await page.keyboard.press('Enter');


        await checkLocalStorage(m);

      });

    await checkToDosItems(m);

  };

  toString = () => `${EditEmptyCommand.name}`;
}

export class EditCancelCommand implements fc.AsyncCommand<Model, Page, false> {

  model: Model | undefined

  constructor(readonly todo: Model['input'], readonly number: number) { }

  check(m: Readonly<Model>) {

    this.model = m;
    return m.toDos.length > 0;

  };

  async run(m: Model, page: Page) {
    this.model = m;

    await page
      .$$(CLASS_SELECTORS.TODO_ITEMS_LABEL)
      .then(async els => {

        const el = els[pickToDo(this.number, m)];

        await el.click({ clickCount: 2 });

        m.toDos[0].editing = true

        await Promise
          .all(
            m.toDos[0].text.split('')
              .map(() =>
                page.keyboard.press('Backspace')
              )
          );


        await checkModel(m)

        await el.type(this.todo.text);

        await page.keyboard.press('Escape');
        m.toDos[0].editing = false

      });

    await checkModel(m)
    
  };

  toString = () => `${EditCancelCommand.name} ${JSON.stringify(this.todo)} ${pickToDo(this.number, this.model!)}`;

}
