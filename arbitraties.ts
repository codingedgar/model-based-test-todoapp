import * as fc from "fast-check";
import { isValidTodo, repeatWhiteSpace } from "./utils";

export function validToDoArbitrary() {
  return fc.unicodeString()
    .filter(isValidTodo)
    .map(text => ({
      text: text,
      type: 'valid' as const
    }))
}

export function whitespaceToDoArbitrary() {

  return fc.integer(1, 15)
    .map(repeatWhiteSpace)
    .map(text => ({
      text: text,
      type: 'whitespace' as const
    }))

}

export function trimToDoArbitrary() {

  return fc.record({
    start: fc.integer(1, 15),
    middle: validToDoArbitrary(),
    end: fc.integer(1, 15),
  })
    .map(x => `${repeatWhiteSpace(x.start)}${x.middle}${repeatWhiteSpace(x.end)}`)
    .map(text => ({
      text: text,
      type: 'trim' as const
    }))

}
