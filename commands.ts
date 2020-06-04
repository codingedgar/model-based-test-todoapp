import * as fc from 'fast-check'
import { Page } from 'puppeteer';
import {
  Model,
  CLASS_SELECTORS
} from './cons';
import {
  checkNewToDo,
  checkLocalStorage,
  checkToDosItems,
  clear,
} from './expects';
import {
  // clt,
  valueOfEl,
} from './utils';

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

    await checkNewToDo(m);

    await checkToDosItems(m);

    await checkLocalStorage(m);

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

    // clt('WhiteEnterCommand')(m.input)

    await checkNewToDo(m)

    await page.focus(CLASS_SELECTORS.NEW_TODO)

    await page.keyboard.press('Enter');

    await checkNewToDo(m);

    await checkToDosItems(m);
    await checkLocalStorage(m);

  };

  toString = () => `${WhiteEnterCommand.name}`;
}

export class ValidEnterCommand implements fc.AsyncCommand<Model, Page, false> {
  constructor() { }

  check(m: Readonly<Model>) {
    return m.input.type === 'valid'
    // return isValidTodo(m.input.text)
  };

  async run(m: Model, page: Page) {

    // clt('ValidEnterCommand')(m.input)

    m.toDos = m.toDos.concat((m.input.type === 'valid') ? m.input.text : m.input.text.trim());

    await checkNewToDo(m);

    await page.focus(CLASS_SELECTORS.NEW_TODO)

    await page.keyboard.press('Enter');

    await valueOfEl(CLASS_SELECTORS.NEW_TODO)
      .then(value => {

        expect(value).toBe('');

      })

    await checkToDosItems(m);

    await checkLocalStorage(m);

    m.input = {
      text: '',
      type: 'empty',
    };

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

    m.toDos = m.toDos.concat(m.input.text.trim());

    await checkNewToDo(m)

    await page.focus(CLASS_SELECTORS.NEW_TODO)

    await page.keyboard.press('Enter');

    m.input = {
      text: '',
      type: 'empty',
    }

    await checkNewToDo(m);

    await checkToDosItems(m);

    await checkLocalStorage(m);

  };

  toString = () => `${TrimEnterCommand.name}`;
}

export class WriteInputCommand implements fc.AsyncCommand<Model, Page, false> {
  constructor(readonly input: Model['input']) { }

  check(_m: Readonly<Model>) {
    return true;
  };

  async run(m: Model, page: Page) {

    // clt('WriteInputCommand')(m.input);

    await checkNewToDo(m);

    await clear(CLASS_SELECTORS.NEW_TODO)

    m.input = this.input

    await page.type(CLASS_SELECTORS.NEW_TODO, this.input.text)

    await checkNewToDo(m);

    await checkToDosItems(m);

    await checkLocalStorage(m);

  };

  toString = () => `${WriteInputCommand.name} ${JSON.stringify(this.input)}`;
}
