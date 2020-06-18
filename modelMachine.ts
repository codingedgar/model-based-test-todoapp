import {
  Machine,
  assign,
  StateMachine,
  Interpreter,
  State
} from "xstate";
import {
  lensIndex,
  over,
  remove,
  init,
  last,
} from "ramda";
import {
  Model,
  STATIC,
} from "./cons";
import {
  itemsLeftCount
} from "./utils";

type Context = Model

type Event
  = { type: 'INPUT_ASSIGNED', payload: Model['input'] }
  | { type: 'TO_DO_ADDED' }
  | { type: 'TOGGLE_ALL_COMPLETED' }
  | { type: 'TOGGLE_ITEM_COMPLETED', index: number }
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
    input: (ctx, e) => (e.type === 'INPUT_ASSIGNED') ? e.payload : ctx.input
  }),
  ASSIGN_TO_DO: assign<Context, Event>(
    (ctx, e) => {
      if (
        e.type === 'TO_DO_ADDED'
        && (
          ctx.input.type === 'valid'
          || ctx.input.type === 'trim'
        )
      ) {

        const toDos = ctx.toDos.concat({
          text: (ctx.input.type === 'trim')
            ? ctx.input.text.trim()
            : ctx.input.text,
          completed: false,
          editing: false,
        });

        return {
          ...ctx,
          toDos,
          completeAll: itemsLeftCount(toDos) === 0,
          input: {
            text: '',
            type: 'empty'
          }
        }

      } else {

        return ctx;

      }
    }
  ),
  TOGGLE_ALL_COMPLETED: assign<Context, Event>(
    (ctx, e) => {
      if (e.type === 'TOGGLE_ALL_COMPLETED') {
        return {
          ...ctx,
          completeAll: !ctx.completeAll,
          toDos: ctx.toDos.map(todo => ({
            ...todo,
            completed: !ctx.completeAll
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
          toDo => ({
            ...toDo,
            completed: !toDo.completed
          }),
          ctx.toDos
        );

        return {
          ...ctx,
          toDos,
          completeAll: itemsLeftCount(toDos) === 0,
        }

      } else {

        return ctx;

      }
    }
  ),
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

        const toDos = ctx.toDos.filter(toDo => !toDo.completed)
        return {
          toDos,
          completeAll: itemsLeftCount(toDos) === 0
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
  strict: true,
  context: {
    toDos: [],
    input: {
      text: '',
      type: STATIC.EMPTY,
    },
    filter: STATIC.ALL,
    completeAll: false,
    navigation: [STATIC.ALL],
  },
  states: {
    DEFAULT: {
      on: {
        TO_DO_ADDED: {
          actions: [
            ACTION.ASSIGN_TO_DO,
          ]
        },
        INPUT_ASSIGNED: {
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
        TOGGLE_ALL_COMPLETED: {
          actions: [
            ACTION.TOGGLE_ALL_COMPLETED,
          ]
        },
      }
    }
  }
})
