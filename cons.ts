export type Model = {
  input: {
    text: string
    type: 'valid' | 'trim' | 'whitespace' | 'empty'
  }
  toDos: string[]
};

export const CLASS_SELECTORS = {
  NEW_TODO: '.new-todo',
  TODO_LIST: '.todo-list',
  TODO_ITEMS: '.todo-list li',
  TODO_ITEMS_VISIBLE: '.todo-list li:visible',
  COUNT: 'span.todo-count',
  MAIN: '.main',
  FOOTER: '.footer',
  TOGGLE_ALL: '.toggle-all',
  CLEAR_COMPLETED: '.clear-completed',
  FILTERS: '.filters',
  FILTER_ITEMS: '.filters li a'
}
