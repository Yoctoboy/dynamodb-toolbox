import type { Attribute } from '~/attributes/index.js'
import { DynamoDBToolboxError } from '~/errors/index.js'
import { SchemaAction } from '~/schema/index.js'
import type {
  FullValue,
  InputValue,
  Schema,
  TransformedValue,
  WriteValueOptions
} from '~/schema/index.js'

import { attrParser } from './attribute.js'
import type { InferValueOptions, ParsingOptions } from './options.js'
import { schemaParser } from './schema.js'

type ParserInput<
  SCHEMA extends Schema | Attribute,
  OPTIONS extends ParsingOptions = {},
  WRITE_VALUE_OPTIONS extends WriteValueOptions = InferValueOptions<OPTIONS>
> = OPTIONS extends { fill: false }
  ? FullValue<SCHEMA, WRITE_VALUE_OPTIONS>
  : InputValue<SCHEMA, WRITE_VALUE_OPTIONS>

export type ParserYield<
  SCHEMA extends Schema | Attribute,
  OPTIONS extends ParsingOptions = {},
  WRITE_VALUE_OPTIONS extends WriteValueOptions = InferValueOptions<OPTIONS>
> = OPTIONS extends { fill: false }
  ? FullValue<SCHEMA, WRITE_VALUE_OPTIONS>
  : InputValue<SCHEMA, WRITE_VALUE_OPTIONS> | FullValue<SCHEMA, WRITE_VALUE_OPTIONS>

export type ParserReturn<
  SCHEMA extends Schema | Attribute,
  OPTIONS extends ParsingOptions = {},
  WRITE_VALUE_OPTIONS extends WriteValueOptions = InferValueOptions<OPTIONS>
> = OPTIONS extends { transform: false }
  ? FullValue<SCHEMA, WRITE_VALUE_OPTIONS>
  : TransformedValue<SCHEMA, WRITE_VALUE_OPTIONS>

export class Parser<SCHEMA extends Schema | Attribute> extends SchemaAction<SCHEMA> {
  start<OPTIONS extends ParsingOptions = {}>(
    inputValue: unknown,
    options: OPTIONS = {} as OPTIONS
  ): Generator<ParserYield<SCHEMA, OPTIONS>, ParserReturn<SCHEMA, OPTIONS>> {
    if (this.schema.type === 'schema') {
      return schemaParser(this.schema, inputValue, options) as Generator<
        ParserYield<SCHEMA, OPTIONS>,
        ParserReturn<SCHEMA, OPTIONS>
      >
    } else {
      return attrParser(this.schema, inputValue, options) as Generator<
        ParserYield<SCHEMA, OPTIONS>,
        ParserReturn<SCHEMA, OPTIONS>
      >
    }
  }

  parse<OPTIONS extends ParsingOptions = {}>(
    inputValue: unknown,
    options: OPTIONS = {} as OPTIONS
  ): ParserReturn<SCHEMA, OPTIONS> {
    const parser = this.start(inputValue, options)

    let done = false
    let value: ParserReturn<SCHEMA, OPTIONS>
    do {
      const nextState = parser.next()
      done = Boolean(nextState.done)
      // TODO: Not cast
      value = nextState.value as ParserReturn<SCHEMA, OPTIONS>
    } while (!done)

    return value
  }

  reparse<OPTIONS extends ParsingOptions = {}>(
    inputValue: ParserInput<SCHEMA, OPTIONS>,
    options: OPTIONS = {} as OPTIONS
  ): ParserReturn<SCHEMA, OPTIONS> {
    return this.parse(inputValue, options)
  }

  validate<OPTIONS extends ParsingOptions = {}>(
    inputValue: unknown,
    options: OPTIONS = {} as OPTIONS
  ): inputValue is ParserReturn<SCHEMA, OPTIONS> {
    try {
      this.parse(inputValue, { ...options, fill: false, transform: false })
    } catch (error) {
      if (error instanceof DynamoDBToolboxError && DynamoDBToolboxError.match(error, 'parsing.')) {
        return false
      }

      throw error
    }

    return true
  }
}
