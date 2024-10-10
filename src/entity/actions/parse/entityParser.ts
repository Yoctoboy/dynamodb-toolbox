import { EntityAction } from '~/entity/index.js'
import type { Entity, FullItem, InputItem, TransformedItem } from '~/entity/index.js'
import { Parser } from '~/schema/actions/parse/index.js'
import type { $extension, ExtensionParser, WriteMode } from '~/schema/index.js'
import { PrimaryKeyParser } from '~/table/actions/parsePrimaryKey/index.js'
import type { PrimaryKey } from '~/table/actions/parsePrimaryKey/index.js'

import { $parser } from './constants.js'

export interface EntityParsingOptions {
  mode?: WriteMode | undefined
  parseExtension?: ExtensionParser | undefined
}

interface InferItemOptions<OPTIONS extends EntityParsingOptions> {
  mode: OPTIONS extends { mode: WriteMode } ? OPTIONS['mode'] : undefined
  extension: OPTIONS extends { parseExtension: ExtensionParser }
    ? NonNullable<OPTIONS['parseExtension'][$extension]>
    : undefined
}

export class EntityParser<ENTITY extends Entity = Entity> extends EntityAction<ENTITY> {
  static override actionName: 'parse';
  [$parser]: Parser<ENTITY['schema']>

  constructor(entity: ENTITY) {
    super(entity)
    this[$parser] = new Parser(entity.schema)
  }

  parse<OPTIONS extends EntityParsingOptions = {}>(
    input: { [KEY: string]: unknown },
    { mode, parseExtension }: OPTIONS = {} as OPTIONS
  ): {
    parsedItem: FullItem<ENTITY, InferItemOptions<OPTIONS>>
    item: TransformedItem<ENTITY, InferItemOptions<OPTIONS>> & PrimaryKey<ENTITY['table']>
    key: PrimaryKey<ENTITY['table']>
  } {
    const parser = this[$parser].start(input, { mode, parseExtension } as OPTIONS)
    parser.next() // defaulted
    parser.next() // linked
    /**
     * @debt type "we could remove those casts by using named generator yields: const parsedItem = parser.next<"parsed">().value"
     */
    const parsedItem = parser.next().value as FullItem<ENTITY, InferItemOptions<OPTIONS>>
    const item = parser.next().value as TransformedItem<ENTITY, InferItemOptions<OPTIONS>>

    const keyInput = this.entity.computeKey ? this.entity.computeKey(parsedItem) : item
    const key = new PrimaryKeyParser<ENTITY['table']>(this.entity.table).parse(keyInput)

    return {
      parsedItem: parsedItem,
      item: { ...item, ...key },
      key
    }
  }

  reparse<OPTIONS extends EntityParsingOptions = {}>(
    input: InputItem<ENTITY, InferItemOptions<OPTIONS>>,
    options: OPTIONS = {} as OPTIONS
  ): {
    parsedItem: FullItem<ENTITY, InferItemOptions<OPTIONS>>
    item: TransformedItem<ENTITY, InferItemOptions<OPTIONS>> & PrimaryKey<ENTITY['table']>
    key: PrimaryKey<ENTITY['table']>
  } {
    return this.parse(input, options)
  }
}
