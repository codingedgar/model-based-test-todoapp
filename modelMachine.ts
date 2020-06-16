import {
  Machine,
  assign,
  StateMachine,
  Interpreter,
  State
} from "xstate";
import {
  lensIndex,
  set,
  over,
  not,
  remove,
  init,
  last,
} from "ramda";
import {
  Model,
  ToDoItem,
  STATIC
} from "./cons";
import {
  itemsLeftCount,
  itemsLeftCount2
} from "./utils";

type Context = Model

type Event
  = { type: 'ASSIGN_INPUT', payload: Model['input'] }
  | { type: 'ADD_VALID_TO_DO' }
  | { type: 'ADD_TRIM_TO_DO' }
  | { type: 'MARK_ALL_CHECKED' }
  | { type: 'TOGGLE_ITEM_COMPLETED', index: number }
  // | { type: 'ADD_TO_DOS', payload: Model['input'][] }
  | { type: 'EDITED', index: number, payload: boolean }
  | { type: 'TEXT_EDITED', index: number, payload: string }
  | { type: 'REMOVED_FROM_INDEX', index: number }
  | { type: 'COMPLETED_CLEARED' }
  | { type: 'FILTER_SELECTED', payload: 'all' | 'active' | 'completed' }
  | { type: 'WENT_BACK' }

type Schema = {
  states: {
    DEFAULT: {}
  }
}

const ACTION = {
  ASSIGN_INPUT: assign<Context, Event>({
    input: (ctx, e) => (e.type === 'ASSIGN_INPUT') ? e.payload : ctx.input
  }),
  ASSIGN_TODO: assign<Context, Event>(
    (ctx, e) => {
      if (e.type === 'ADD_VALID_TO_DO') {

        const toDos = ctx.toDos.concat({
          text: ctx.input.text,
          checked: false,
          editing: false,
        });

        return {
          ...ctx,
          toDos,
          toggleAll: itemsLeftCount2(toDos) === 0,
        }

      } else {

        return ctx;

      }
    }
  ),
  ASSIGN_TRIM_TODO: assign<Context, Event>(
    (ctx, e) => {
      if (e.type === 'ADD_TRIM_TO_DO') {

        const toDos = ctx.toDos.concat({
          text: ctx.input.text.trim(),
          checked: false,
          editing: false,
        });

        return {
          ...ctx,
          toDos,
          toggleAll: itemsLeftCount2(toDos) === 0,
        }

      } else {

        return ctx;

      }
    }
  ),
  MARK_ALL_CHECKED: assign<Context, Event>(
    (ctx, e) => {
      if (e.type === 'MARK_ALL_CHECKED') {
        return {
          ...ctx,
          toggleAll: !ctx.toggleAll,
          toDos: ctx.toDos.map(todo => ({
            ...todo,
            checked: ctx.toggleAll
          }))
        }

      } else {

        return ctx;

      }
    }
  ),
  TOGGLE_ITEM_COMPLETED: assign<Context, Event>(
    (ctx, e) => {
      if (e.type === 'TOGGLE_ITEM_COMPLETED') {

        const toDos = over(
          lensIndex(e.index),
          not,
          ctx.toDos
        );

        return {
          ...ctx,
          toDos,
          toggleAll: itemsLeftCount2(toDos) === 0,
        }

      } else {

        return ctx;

      }
    }
  ),
  EMPTY_INPUT: assign<Context, Event>({
    input: () => ({
      text: '',
      type: STATIC.EMPTY,
    })
  }),
  EDIT: assign<Context, Event>({
    toDos: (ctx, e) => (e.type === 'EDITED')
      ? over(
        lensIndex(e.index),
        toDo => ({
          ...toDo,
          editing: e.payload
        }),
        ctx.toDos
      )
      : ctx.toDos
  }),
  EDIT_TEXT: assign<Context, Event>({
    toDos: (ctx, e) => (e.type === 'TEXT_EDITED')
      ? over(
        lensIndex(e.index),
        toDo => ({
          ...toDo,
          text: e.payload
        }),
        ctx.toDos
      )
      : ctx.toDos
  }),
  REMOVE_FROM_INDEX: assign<Context, Event>({
    toDos: (ctx, e) => (e.type === 'REMOVED_FROM_INDEX')
      ? remove(e.index, 1, ctx.toDos)
      : ctx.toDos
  }),
  CLEAR_COMPLETED: assign<Context, Event>(
    (ctx, e) => {

      if (e.type === 'COMPLETED_CLEARED') {

        const toDos = ctx.toDos.filter(toDo => !toDo.checked)
        return {
          toDos,
          toggleAll: itemsLeftCount2(toDos) === 0
        }
      } else {

        return ctx;

      }
    }),
  SELECT_FILTER: assign<Context, Event>(
    (ctx, e) => {

      if (e.type === 'FILTER_SELECTED') {

        return {
          navigation: (ctx.filter !== e.payload)
            ? ctx.navigation.concat(e.payload)
            : ctx.navigation,
          filter: e.payload,
        }

      } else {

        return ctx;

      }
    }),
  GO_BACK: assign<Context, Event>(
    (ctx, e) => {

      if (e.type === 'WENT_BACK') {

        const navigation = init(ctx.navigation);

        return {
          navigation,
          filter: last(navigation)
        }

      } else {

        return ctx;

      }
    }),
}

export type ModelMachine = StateMachine<Model, Schema, Event, any>
export type ModelMachine2 = Interpreter<Model, Schema, Event, any>
export type ModelMachine3 = State<Model, Event, Schema, any>

export const modelMachine = Machine<Context, Schema, Event>({
  initial: 'DEFAULT',
  context: {
    toDos: [],
    input: {
      text: '',
      type: STATIC.EMPTY,
    },
    filter: STATIC.ALL,
    toggleAll: false,
    navigation: [STATIC.ALL],
  },
  states: {
    DEFAULT: {
      on: {
        ADD_VALID_TO_DO: {
          actions: [
            ACTION.ASSIGN_TODO,
            ACTION.EMPTY_INPUT,
          ]
        },
        ADD_TRIM_TO_DO: {
          actions: [
            ACTION.ASSIGN_TRIM_TODO,
            ACTION.EMPTY_INPUT,
          ]
        },
        ASSIGN_INPUT: {
          actions: [
            ACTION.ASSIGN_INPUT,
          ]
        },
        TOGGLE_ITEM_COMPLETED: {
          actions: [
            ACTION.TOGGLE_ITEM_COMPLETED,
          ]
        },
        EDITED: {
          actions: [
            ACTION.EDIT,
          ]
        },
        TEXT_EDITED: {
          actions: [
            ACTION.EDIT_TEXT,
          ]
        },
        REMOVED_FROM_INDEX: {
          actions: [
            ACTION.REMOVE_FROM_INDEX,
          ]
        },
        COMPLETED_CLEARED: {
          actions: [
            ACTION.CLEAR_COMPLETED,
          ]
        },
        FILTER_SELECTED: {
          actions: [
            ACTION.SELECT_FILTER,
          ]
        },
        WENT_BACK: {
          actions: [
            ACTION.GO_BACK,
          ]
        },
      }
    }
  }
})
