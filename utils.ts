import * as fc from 'fast-check'
import {
  not,
} from "fp-ts/lib/function";
import { pipe, } from "fp-ts/lib/pipeable";
import {
  repeat,
  allPass
} from 'ramda';

export function clt(tag: string) {
  return function <T>(value: T) {
    console.log(tag, value)
    return value
  }
}

export function valueOfEl(selector: string) {

  return page
    .$(selector)
    .then(el => el?.evaluate(el => (el as HTMLTextAreaElement).value))

}

export function isValidTodo(input: string): boolean {

  return pipe(
    input,
    x => x.trim(),
    x => x.length > 0 && x.length === input.length,
  )

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
