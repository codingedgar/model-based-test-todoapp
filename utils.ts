import {
  not,
} from "fp-ts/lib/function";
import { pipe, } from "fp-ts/lib/pipeable";
import {
  repeat,
  allPass,
  clamp,
} from 'ramda';
import { Model } from "./cons";

export function filteredToDos(m: Model): Model['toDos'] {
  return m.toDos.filter(
    x => m.filter === 'all' || (x.checked === (m.filter === 'completed'))
  )
}

export function toggleCheckTodo(index: number, m: Model): Model {
  m.toDos[index].checked = !m.toDos[index].checked;
  m.toggleAll = itemsLeftCount(m) === 0;

  return m
}

export function itemsLeftCount2(toDos: Model['toDos']) {
  return toDos.reduce(
    (acc, toDo) => (!toDo.checked)
      ? acc + 1
      : acc,
    0
  )

}

export function itemsLeftCount(m: Model) {
  return m.toDos.reduce(
    (acc, toDo) => (!toDo.checked)
      ? acc + 1
      : acc,
    0
  )

}

export function pickToDo(number: number, m: Model) {
  // console.log(m)
  return scale(
    number,
    0,
    m.toDos.length - 1,
    0,
    2147483647
  )
}

function scale(n: number, toMin: number, toMax: number, fromMin: number, fromMax: number) {
  return clamp(
    toMin,
    toMax,
    Math.floor(
      (
        (
          (toMax - toMin) * (n - fromMin)
        )
        / (fromMax - fromMin)
      )
      + toMin
    ),
  );
}

export function clt(tag: string) {
  return function <T>(value: T) {
    console.log(tag, value)
    return value
  }
}

export function valueOfEl(selector: string) {

  // console.log('value', selector);

  return page
    .$(selector)
    .then(el => {
      return el?.evaluate(el => {

        if (el.nodeName === 'INPUT') {
          // return [el.nodeName, (el as HTMLTextAreaElement).value];
          return (el as HTMLTextAreaElement).value;
        } else if (el.nodeName === 'SPAN') {
          // return [el.nodeName, (el as HTMLSpanElement).textContent];
          return (el as HTMLSpanElement).textContent;
        } else if (el.nodeName === 'BUTTON') {
          // return [el.nodeName, (el as HTMLSpanElement).textContent];
          return (el as HTMLButtonElement).textContent;
        }

      })
    })
  // .then(x => (console.log('xx', x), x ? x[1] : x))
}

export function isValidTodo(input: string): boolean {

  return allPass([
    input => {
      const trimmed = input.trim();
      return trimmed.length > 0 && trimmed.length === input.length;
    },
    (input: string) => {
      // console.log(JSON.stringify(input))
      // console.log(JSON.stringify(!input.match(/[^\u0000]/gm)))
      return !input.match(/[\u0000]/gm);
    }
  ])(input)

}

export function isEmptyTodo(input: string): boolean {

  return input.length === 0

}

export function isInvalidTodo(input: string): boolean {

  return pipe(
    input,
    allPass([
      not(isValidTodo),
      not(isWhiteSpacesTodo),
      not(isTrimmableTextTodo),
      not(isEmptyTodo),
    ])
  )

}

export function isWhiteSpacesTodo(input: string): boolean {

  return pipe(
    input,
    x => !!x.match(/^\s*$/gi)
  )

}

export function isTrimmableTextTodo(input: string): boolean {

  return pipe(
    input,
    x => x.trim(),
    x => x.length > 0 && x.length < input.length
  )

}

export function focused() {
  return page.evaluateHandle(() => document.activeElement);
}

export function repeatString(input: string, times: number) {

  return repeat(input, times).join('')

}

export function repeatWhiteSpace(times: number) {

  return repeat(' ', times).join('')

}
