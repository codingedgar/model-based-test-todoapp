import { JSHandle, Page } from 'puppeteer';
import { CLASS_SELECTORS, Model } from './cons';
import { valueOfEl, itemsLeftCount } from './utils';

export async function checkModel(m: Model) {

  await Promise.all([
    valueOfEl(CLASS_SELECTORS.NEW_TODO)
      .then(value => {

        // console.log(value?.split('').map(x => x.charCodeAt(0)))
        // console.log(m.input.text.split('').map(x => x.charCodeAt(0)))
        expect(value).toStrictEqual(m.input.text);

      }),
    checkToDosItems(m),
    checkLocalStorage(m),
    checkCount(m),
    checkToggleAll(m, page),
    checkNewToDo(m),
    checkEditing(m),
  ])

}

export async function checkEditing(m: Model) {
  if (m.toDos.length > 0) {

    await page
      .$('.todo-list li .view')
      .then(async view =>
        await view?.evaluate(el => window.getComputedStyle(el).display)
      )
      .then(x => {
        expect(x).toBe((m.toDos[0].editing) ? 'none' : 'block');
      })

  }

}

export async function checkCount(m: Model) {
  if (m.toDos.length > 0) {

    await valueOfEl(CLASS_SELECTORS.COUNT)
      .then(count => {

        const left = itemsLeftCount(m);

        if (left === 1) {
          expect(count).toBe(`1 item left`);
        } else {
          expect(count).toBe(`${left} items left`);
        }

        // if (m.toggleAll) {
        //   expect(count).toBe(`0 items left`);
        //     expect(count).toBe(`${m.toDos.length} item left`);
        // } else {
        //   if (m.toDos.length === 1) {
        //   } else if (m.toDos.length > 1) {
        //     expect(count).toBe(`${m.toDos.length} items left`);
        //   }
        // }
      })

  }

}

export async function clearNewToDo(selector: string) {

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
      // () => localStorage.getItem('todos-vanillajs')
    )
      .then(value => {

        let items = JSON.parse(value!).map((x: { title: string }) => x.title);

        expect(items).toStrictEqual(m.toDos.map(x => x.text));

      })
  }
}

export async function checkToDosItems(m: Model) {

  if (m.toDos.length > 0) {

    return Promise.all([
      page.evaluate(
        (selector) => Array.from(document.querySelectorAll(selector), x => [x.textContent]),
        CLASS_SELECTORS.TODO_ITEMS,
      )
        .then(value => {

          expect(value).toEqual(m.toDos.map(x => [x.text]));

        }),
      checkTodoItemsInput(m),
    ])

  }
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

export function allHaveClass(className: string) {
  return function (handle: JSHandle<any>) {
    return handle.evaluate(el => el.className)
      .then(classes => {
        // console.log(classes)
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

export async function checkToggleAll(m: Model, page: Page) {

  if (m.toDos.length > 0) {

    return Promise.all([
      page
        .evaluate(
          selector => Array.from(document.querySelectorAll(selector), (x: HTMLLIElement) => [x.textContent, x.className]),
          CLASS_SELECTORS.TODO_ITEMS
        )
        .then(x => {

          expect(x).toEqual(m.toDos.map(({ text, editing, checked }) => [
            text,
            `${(m.toggleAll || checked) ? 'completed' : ''}${((m.toggleAll || checked) && editing) ? ' ' : ''}${editing ? 'editing' : ''}`
          ]));

        }),
      page
        .$(CLASS_SELECTORS.TOGGLE_ALL)
        .then(el => el?.evaluate(el => (el as HTMLInputElement).checked))
        .then(checked => {

          const left = itemsLeftCount(m)

          expect(left === m.toDos.length - 1).toBe(m.toggleAll)
          expect(checked).toBe(left === m.toDos.length - 1)

        }),
      page
        .evaluate(
          selector => Array.from(document.querySelectorAll(selector), (x: HTMLInputElement) => [x.checked]),
          CLASS_SELECTORS.TODO_ITEMS_INPUT
        )
        .then(x => {

          expect(x).toEqual(m.toDos.map((toDo) => [m.toggleAll || toDo.checked]));

        }),
    ])
  }
}

export async function checkTodoItemsInput(m: Model) {
  return Promise.all([
    page
      .evaluate(
        selector => Array.from(document.querySelectorAll(selector), (x: HTMLInputElement) => [x.checked]),
        CLASS_SELECTORS.TODO_ITEMS_INPUT
      )
      .then(x => {

        expect(x).toEqual(m.toDos.map((toDo) => [toDo.checked]));

      }),
  ])
}
