export type ToDoItem = {
  text: string
  checked: boolean
  editing: boolean
}

export type Model = {
  input: {
    text: string
    type: 'valid' | 'trim' | 'whitespace' | 'empty'
  }
  toDos: ToDoItem[]
  toggleAll: boolean

};


export const CLASS_SELECTORS = {
  NEW_TODO: '.new-todo',
  TODO_LIST: '.todo-list',
  TODO_ITEMS: '.todo-list li',
  TODO_ITEMS_INPUT: '.todo-list li .toggle',
  TODO_ITEMS_VISIBLE: '.todo-list li:visible',
  TODO_ITEMS_LABEL: '.todo-list li label',
  COUNT: 'span.todo-count',
  MAIN: '.main',
  FOOTER: '.footer',
  TOGGLE_ALL: '.toggle-all',
  // TOGGLE_ALL: 'label[for="toggle-all"]',
  TOGGLE_ALL_LABEL: 'label[for="toggle-all"]',
  CLEAR_COMPLETED: '.clear-completed',
  FILTERS: '.filters',
  FILTER_ITEMS: '.filters li a'
}
