import { JSHandle, Page } from 'puppeteer';
import { CLASS_SELECTORS, Model } from './cons';
import { valueOfEl, filteredToDos, itemsLeftCount } from './utils';

export async function checkModel(m: Model) {

  await Promise.all([
    Promise.all([
      checkInput(m),
      checkToDosItems(m),
      checkLocalStorage(m),
      checkCount(m),
      checkToggleAll(m, page),
      checkNewToDo(m),
      checkEditing(m),
      checkClearCompleted(m),
      checkFilterCount(m),
      checkFilterHighlight(m),
    ]),
    Promise.all([
      checkBBBB(m),
    ])
  ])

}

async function checkInput(m: Model) {
  return valueOfEl(CLASS_SELECTORS.NEW_TODO)
    .then(value => {

      // console.log(value?.split('').map(x => x.charCodeAt(0)))
      // console.log(m.input.text.split('').map(x => x.charCodeAt(0)))
      expect(value).toStrictEqual(m.input.text);

    });
}

async function checkBBBB(m: Model) {
  // console.log(m)
  expect(m.navigation[m.navigation.length - 1]).toBe(m.filter)

}
async function checkFilterHighlight(m: Model) {
  if (m.toDos.length > 0) {

    await page.evaluate(
      (selector) => Array.from(
        document.querySelectorAll(selector),
        el => [el.textContent, el.className]
      ),
      CLASS_SELECTORS.FILTER_ITEMS,
    )
      .then(value => {

        expect(value).toEqual([
          ['All', m.filter === 'all' ? 'selected' : ''],
          ['Active', m.filter === 'active' ? 'selected' : ''],
          ['Completed', m.filter === 'completed' ? 'selected' : ''],
        ])

      })

  }

}

async function checkFilterCount(m: Model) {

  await page
    .$$(CLASS_SELECTORS.TODO_ITEMS_INPUT)
    .then(async els => {
      // console.log(m)
      // console.log(els)
      expect(els.length).toBe(filteredToDos(m).length)

    })
}

async function checkClearCompleted(m: Model) {
  if (itemsLeftCount(m.toDos) < m.toDos.length) {
    await valueOfEl(CLASS_SELECTORS.CLEAR_COMPLETED)
      .then(value => {
        expect(value).toBe('Clear completed');
      })
  } else {
    await expect(page).not.toMatchElement(CLASS_SELECTORS.CLEAR_COMPLETED)
  }

}

async function checkEditing(m: Model) {
  if (m.toDos.length > 0) {

    await page.evaluate(
      (selector) => Array.from(
        document.querySelectorAll(selector),
        el => window.getComputedStyle(el).display
      ),
      '.todo-list li .view',
    )
      .then(x => {
        // console.log(m)
        expect(x).toEqual(filteredToDos(m).map(toDo => (toDo.editing) ? 'none' : 'block'));
      })

  }

}

async function checkCount(m: Model) {
  if (m.toDos.length > 0) {

    await valueOfEl(CLASS_SELECTORS.COUNT)
      .then(count => {

        const left = itemsLeftCount(m.toDos);

        if (left === 1) {
          expect(count).toBe(`1 item left`);
        } else {
          expect(count).toBe(`${left} items left`);
        }
      })

  }

}

async function checkLocalStorage(m: Model) {
  if (m.toDos.length > 0) {
    return page.evaluate(
      () => localStorage.getItem('react-todos')
    )
      .then(value => {

        let items = JSON.parse(value!).map((x: { title: string }) => x.title);

        expect(items).toStrictEqual(m.toDos.map(x => x.text));

      })
  }
}

async function checkToDosItems(m: Model) {

  if (m.toDos.length > 0) {

    return Promise.all([
      page.evaluate(
        (selector) => Array.from(document.querySelectorAll(selector), x => [x.textContent]),
        CLASS_SELECTORS.TODO_ITEMS,
      )
        .then(value => {

          expect(value).toEqual(filteredToDos(m).map(x => [x.text]));

        }),
      checkTodoItemsInput(m),
    ])

  }
}

async function checkNewToDo(m: Model) {

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

function allHaveClass(className: string) {
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

async function checkToggleAll(m: Model, page: Page) {

  if (m.toDos.length > 0) {

    return Promise.all([
      page
        .evaluate(
          selector => Array.from(document.querySelectorAll(selector), (x: HTMLLIElement) => [x.textContent, x.className]),
          CLASS_SELECTORS.TODO_ITEMS
        )
        .then(x => {
          // console.log(m)
          expect(x).toEqual(filteredToDos(m).map(({ text, editing, completed }) => [
            text,
            `${(m.completeAll || completed) ? 'completed' : ''}${((m.completeAll || completed) && editing) ? ' ' : ''}${editing ? 'editing' : ''}`
          ]));

        }),
      page
        .$(CLASS_SELECTORS.TOGGLE_ALL)
        .then(el => el?.evaluate(el => (el as HTMLInputElement).checked))
        .then(checked => {

          const left = itemsLeftCount(m.toDos)

          expect(left === 0).toBe(m.completeAll)
          expect(checked).toBe(left === 0)

        }),
      page
        .evaluate(
          selector => Array.from(document.querySelectorAll(selector), (x: HTMLInputElement) => [x.checked]),
          CLASS_SELECTORS.TODO_ITEMS_INPUT
        )
        .then(x => {

          expect(x).toEqual(filteredToDos(m).map((toDo) => [m.completeAll || toDo.completed]));

        }),
    ])
  }
}

async function checkTodoItemsInput(m: Model) {
  return Promise.all([
    page
      .evaluate(
        selector => Array.from(document.querySelectorAll(selector), (x: HTMLInputElement) => [x.checked]),
        CLASS_SELECTORS.TODO_ITEMS_INPUT
      )
      .then(x => {

        expect(x).toEqual(filteredToDos(m).map((toDo) => [toDo.completed]));

      }),
  ])
}
