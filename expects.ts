import { JSHandle } from 'puppeteer';
import { CLASS_SELECTORS, Model } from './cons';
import { valueOfEl } from './utils';

export async function clear(selector: string) {

  return page
    .focus(CLASS_SELECTORS.NEW_TODO)
    .then(
      () =>
        valueOfEl(selector)
          .then(el =>
            Promise.all(
              el!
                .split('')
                .map(() =>
                  page.keyboard.press('Backspace')
                )
            )
          )
    )
    .then(
      () =>
        valueOfEl(CLASS_SELECTORS.NEW_TODO)
          .then(value => {

            expect(value).toStrictEqual('');

          })
    )

}

export async function checkLocalStorage(m: Model) {
  if (m.toDos.length > 0) {
    return page.evaluate(
      () => localStorage.getItem('react-todos')
    )
      .then(value => {

        let items = JSON.parse(value!).map((x: { title: string }) => x.title);

        expect(items).toStrictEqual(m.toDos);

      })
  }
}

export async function checkToDosItems(m: Model) {

  return page.evaluate(
    (selector) => Array.from(document.querySelectorAll(selector), x => x.textContent),
    CLASS_SELECTORS.TODO_ITEMS,
  )
    .then(value => {

      // console.log(JSON.stringify(value))
      expect(value).toEqual(m.toDos);

    })

}

export async function checkNewToDo(m: Model) {

  return valueOfEl(CLASS_SELECTORS.NEW_TODO)
    .then(value => {

      expect(value).toStrictEqual(m.input.text);

    })

}

export function hasClass(className: string) {
  return function (handle: JSHandle<any>) {
    return handle.evaluate(el => el.className)
      .then(classes => {
        expect(`.${classes}`).toBe(className)
      })
  }
}

export function hasNoItems() {
  return page.evaluate(
    (CLASS_SELECTORS) => document.querySelectorAll(CLASS_SELECTORS.todoItems).length,
    CLASS_SELECTORS
  )
    .then(length => {
      expect(length).toBe(0)
    })
}
