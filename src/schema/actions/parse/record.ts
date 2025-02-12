import type { RecordAttribute } from '~/attributes/index.js'
import { DynamoDBToolboxError } from '~/errors/index.js'
import { formatValuePath } from '~/schema/actions/utils/formatValuePath.js'
import { cloneDeep } from '~/utils/cloneDeep.js'
import { isObject } from '~/utils/validation/isObject.js'

import { attrParser } from './attribute.js'
import type { ParseAttrValueOptions } from './options.js'
import type { ParserReturn, ParserYield } from './parser.js'
import { applyCustomValidation } from './utils.js'

export function* recordAttributeParser<OPTIONS extends ParseAttrValueOptions = {}>(
  attribute: RecordAttribute,
  inputValue: unknown,
  options: OPTIONS = {} as OPTIONS
): Generator<ParserYield<RecordAttribute, OPTIONS>, ParserReturn<RecordAttribute, OPTIONS>> {
  const { valuePath = [], ...restOptions } = options
  const { fill = true, transform = true } = restOptions

  const parsers: [Generator<any, any>, Generator<any, any>][] = []
  const undefinedEntries: [string, undefined][] = []

  const isInputValueObject = isObject(inputValue)
  if (isInputValueObject) {
    for (const [key, element] of Object.entries(inputValue)) {
      if (element === undefined) {
        undefinedEntries.push([key, undefined])
        continue
      }

      const nextValuePath = [...valuePath, key]
      parsers.push([
        attrParser(attribute.keys, key, { ...restOptions, valuePath: nextValuePath }),
        attrParser(attribute.elements, element, {
          ...restOptions,
          defined: false,
          valuePath: nextValuePath
        })
      ])
    }
  }

  if (fill) {
    if (isInputValueObject) {
      const defaultedValue = Object.fromEntries([
        ...parsers
          .map(([keyParser, elementParser]) => [keyParser.next().value, elementParser.next().value])
          .filter(([, element]) => element !== undefined),
        ...undefinedEntries
      ])
      const itemInput = yield defaultedValue

      const linkedValue = Object.fromEntries([
        ...parsers
          .map(([keyParser, elementParser]) => [
            keyParser.next().value,
            elementParser.next(itemInput).value
          ])
          .filter(([, element]) => element !== undefined),
        ...undefinedEntries
      ])
      yield linkedValue
    } else {
      const defaultedValue = cloneDeep(inputValue)
      yield defaultedValue as ParserYield<RecordAttribute, OPTIONS>

      const linkedValue = defaultedValue
      yield linkedValue as ParserYield<RecordAttribute, OPTIONS>
    }
  }

  if (!isInputValueObject) {
    const { type } = attribute
    const path = formatValuePath(valuePath)

    throw new DynamoDBToolboxError('parsing.invalidAttributeInput', {
      message: `Attribute${path !== undefined ? ` '${path}'` : ''} should be a ${type}.`,
      path,
      payload: { received: inputValue, expected: type }
    })
  }

  const parsedValue = Object.fromEntries(
    parsers
      .map(([keyParser, elementParser]) => [keyParser.next().value, elementParser.next().value])
      .filter(([, element]) => element !== undefined)
  )
  if (parsedValue !== undefined) {
    applyCustomValidation(attribute, parsedValue, options)
  }

  if (transform) {
    yield parsedValue
  } else {
    return parsedValue
  }

  const transformedValue = Object.fromEntries(
    parsers
      .map(([keyParser, elementParser]) => [keyParser.next().value, elementParser.next().value])
      .filter(([, element]) => element !== undefined)
  )
  return transformedValue
}
