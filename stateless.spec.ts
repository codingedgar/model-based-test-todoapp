import { CLASS_SELECTORS } from './cons';
import { focused } from './utils';
import { hasNoItems, hasClass } from './expects';

describe('Index', () => {

  describe('stateless', () => {

    beforeEach(async () => {
      await page.goto('http://todomvc.com/examples/react/', { waitUntil: 'networkidle2' });
      await page.waitFor(CLASS_SELECTORS.NEW_TODO);
      // await page.bringToFront();
      // await page.waitFor(1000 * 3);
      // console.log('waited')
    },
      // 1000 * 10
    )

    describe(
      'When page is initially opened',
      function () {
        it(
          'should focus on the todo input field',
          async function () {

            await focused()
              .then(hasClass(CLASS_SELECTORS.NEW_TODO))

          }
        )
      })

    describe('No Todos', function () {
      it(
        'starts with nothing',
        async () => {
          await hasNoItems()
        }
      )

      it(
        'should hide #main and #footer',
        async function () {

          await expect(page).not.toMatchElement(CLASS_SELECTORS.TODO_ITEMS);
          await expect(page).not.toMatchElement(CLASS_SELECTORS.MAIN);
          await expect(page).not.toMatchElement(CLASS_SELECTORS.FOOTER);

        },
        // 1000 * 10
      )
    })

  })

})
