import type { A } from 'ts-toolbelt'

import {
  DynamoDBToolboxError,
  Entity,
  ScanCommand,
  Table,
  number,
  prefix,
  schema,
  string
} from '~/index.js'
import type { FormattedItem } from '~/index.js'

const TestTable = new Table({
  name: 'test-table',
  partitionKey: {
    type: 'string',
    name: 'pk'
  },
  sortKey: {
    type: 'string',
    name: 'sk'
  },
  indexes: {
    gsi: {
      type: 'global',
      partitionKey: {
        name: 'gsi_pk',
        type: 'string'
      },
      sortKey: {
        name: 'gsi_sk',
        type: 'string'
      }
    }
  }
})

const Entity1 = new Entity({
  name: 'entity1',
  schema: schema({
    userPoolId: string().key().savedAs('pk'),
    userId: string().key().savedAs('sk'),
    name: string(),
    age: number()
  }),
  table: TestTable
})

const Entity2 = new Entity({
  name: 'entity2',
  schema: schema({
    productGroupId: string().key().savedAs('pk'),
    productId: string().key().savedAs('sk'),
    launchDate: string(),
    price: number()
  }),
  table: TestTable
})

describe('scan', () => {
  test('gets the tableName', async () => {
    const command = TestTable.build(ScanCommand)
    const { TableName } = command.params()

    expect(TableName).toBe('test-table')

    const assertReturnedItems: A.Equals<
      Awaited<ReturnType<typeof command.send>>['Items'],
      FormattedItem[] | undefined
    > = 1
    assertReturnedItems
  })

  // Options
  test('sets capacity options', () => {
    const { ReturnConsumedCapacity } = TestTable.build(ScanCommand)
      .options({ capacity: 'NONE' })
      .params()

    expect(ReturnConsumedCapacity).toBe('NONE')
  })

  test('fails on invalid capacity option', () => {
    const invalidCall = () =>
      TestTable.build(ScanCommand)
        .options({
          // @ts-expect-error
          capacity: 'test'
        })
        .params()

    expect(invalidCall).toThrow(DynamoDBToolboxError)
    expect(invalidCall).toThrow(expect.objectContaining({ code: 'options.invalidCapacityOption' }))
  })

  test('sets consistent option', () => {
    const { ConsistentRead } = TestTable.build(ScanCommand).options({ consistent: true }).params()

    expect(ConsistentRead).toBe(true)
  })

  test('fails on invalid consistent option', () => {
    const invalidCallA = () =>
      TestTable.build(ScanCommand)
        .options({
          // @ts-expect-error
          consistent: 'true'
        })
        .params()

    expect(invalidCallA).toThrow(DynamoDBToolboxError)
    expect(invalidCallA).toThrow(
      expect.objectContaining({ code: 'options.invalidConsistentOption' })
    )

    const invalidCallB = () =>
      TestTable.build(ScanCommand)
        // @ts-expect-error
        .options({
          index: 'gsi',
          consistent: true
        })
        .params()

    expect(invalidCallB).toThrow(DynamoDBToolboxError)
    expect(invalidCallB).toThrow(
      expect.objectContaining({ code: 'options.invalidConsistentOption' })
    )
  })

  test('sets exclusiveStartKey option', () => {
    const { ExclusiveStartKey } = TestTable.build(ScanCommand)
      .options({ exclusiveStartKey: { foo: 'bar' } })
      .params()

    expect(ExclusiveStartKey).toStrictEqual({ foo: 'bar' })
  })

  test('sets index option', () => {
    const { IndexName } = TestTable.build(ScanCommand).options({ index: 'gsi' }).params()

    expect(IndexName).toBe('gsi')
  })

  test('fails on invalid index option', () => {
    const invalidCallA = () =>
      TestTable.build(ScanCommand)
        .options({
          // @ts-expect-error
          index: { foo: 'bar' }
        })
        .params()

    expect(invalidCallA).toThrow(DynamoDBToolboxError)
    expect(invalidCallA).toThrow(expect.objectContaining({ code: 'options.invalidIndexOption' }))

    const invalidCallB = () =>
      TestTable.build(ScanCommand)
        .options({
          // @ts-expect-error
          index: 'unexisting-index'
        })
        .params()

    expect(invalidCallB).toThrow(DynamoDBToolboxError)
    expect(invalidCallB).toThrow(expect.objectContaining({ code: 'options.invalidIndexOption' }))
  })

  test('sets select option', () => {
    const { Select } = TestTable.build(ScanCommand).options({ select: 'COUNT' }).params()

    expect(Select).toBe('COUNT')
  })

  test('fails on invalid select option', () => {
    const invalidCall = () =>
      TestTable.build(ScanCommand)
        .options({
          // @ts-expect-error
          select: 'foobar'
        })
        .params()

    expect(invalidCall).toThrow(DynamoDBToolboxError)
    expect(invalidCall).toThrow(expect.objectContaining({ code: 'options.invalidSelectOption' }))
  })

  test('sets "ALL_PROJECTED_ATTRIBUTES" select option if an index is provided', () => {
    const { Select } = TestTable.build(ScanCommand)
      .options({ select: 'ALL_PROJECTED_ATTRIBUTES', index: 'gsi' })
      .params()

    expect(Select).toBe('ALL_PROJECTED_ATTRIBUTES')
  })

  test('fails if select option is "ALL_PROJECTED_ATTRIBUTES" but no index is provided', () => {
    const invalidCall = () =>
      TestTable.build(ScanCommand)
        // @ts-expect-error
        .options({ select: 'ALL_PROJECTED_ATTRIBUTES' })
        .params()

    expect(invalidCall).toThrow(DynamoDBToolboxError)
    expect(invalidCall).toThrow(expect.objectContaining({ code: 'options.invalidSelectOption' }))
  })

  test('accepts "SPECIFIC_ATTRIBUTES" select option if a projection expression has been provided', () => {
    const { Select } = TestTable.build(ScanCommand)
      .entities(Entity1)
      .options({ attributes: ['age'], select: 'SPECIFIC_ATTRIBUTES' })
      .params()

    expect(Select).toBe('SPECIFIC_ATTRIBUTES')
  })

  test('fails if a projection expression has been provided but select option is NOT "SPECIFIC_ATTRIBUTES"', () => {
    const invalidCall = () =>
      TestTable.build(ScanCommand)
        .entities(Entity1)
        // @ts-expect-error
        .options({ attributes: { entity1: ['age'] }, select: 'ALL_ATTRIBUTES' })
        .params()

    expect(invalidCall).toThrow(DynamoDBToolboxError)
    expect(invalidCall).toThrow(expect.objectContaining({ code: 'options.invalidSelectOption' }))
  })

  test('sets limit option', () => {
    const { Limit } = TestTable.build(ScanCommand).options({ limit: 3 }).params()

    expect(Limit).toBe(3)
  })

  test('fails on invalid limit option', () => {
    const invalidCall = () =>
      TestTable.build(ScanCommand)
        .options({
          // @ts-expect-error
          limit: '3'
        })
        .params()

    expect(invalidCall).toThrow(DynamoDBToolboxError)
    expect(invalidCall).toThrow(expect.objectContaining({ code: 'options.invalidLimitOption' }))
  })

  test('ignores valid maxPages option', () => {
    const validCallA = () => TestTable.build(ScanCommand).options({ maxPages: 3 }).params()
    expect(validCallA).not.toThrow()

    const validCallB = () => TestTable.build(ScanCommand).options({ maxPages: Infinity }).params()
    expect(validCallB).not.toThrow()
  })

  test('fails on invalid maxPages option', () => {
    const invalidCallA = () =>
      TestTable.build(ScanCommand)
        .options({
          // @ts-expect-error
          maxPages: '3'
        })
        .params()

    expect(invalidCallA).toThrow(DynamoDBToolboxError)
    expect(invalidCallA).toThrow(expect.objectContaining({ code: 'options.invalidMaxPagesOption' }))

    // Unable to ts-expect-error here
    const invalidCallB = () => TestTable.build(ScanCommand).options({ maxPages: 0 }).params()

    expect(invalidCallB).toThrow(DynamoDBToolboxError)
    expect(invalidCallB).toThrow(expect.objectContaining({ code: 'options.invalidMaxPagesOption' }))
  })

  test('sets segment and totalSegments options', () => {
    const { Segment, TotalSegments } = TestTable.build(ScanCommand)
      .options({ segment: 3, totalSegments: 4 })
      .params()

    expect(Segment).toBe(3)
    expect(TotalSegments).toBe(4)
  })

  test('fails on invalid segment and/or totalSegments options', () => {
    // segment without totalSegment option
    const invalidCallA = () =>
      TestTable.build(ScanCommand)
        // @ts-expect-error
        .options({ segment: 3 })
        .params()

    expect(invalidCallA).toThrow(DynamoDBToolboxError)
    expect(invalidCallA).toThrow(
      expect.objectContaining({ code: 'scanCommand.invalidSegmentOption' })
    )

    // invalid totalSegments (non number)
    const invalidCallB = () =>
      TestTable.build(ScanCommand)
        .options({
          segment: 3,
          // @ts-expect-error
          totalSegments: 'foo'
        })
        .params()

    expect(invalidCallB).toThrow(DynamoDBToolboxError)
    expect(invalidCallB).toThrow(
      expect.objectContaining({ code: 'scanCommand.invalidSegmentOption' })
    )

    // invalid totalSegments (non-integer)
    const invalidCallC = () =>
      TestTable.build(ScanCommand)
        // Impossible to raise type error here
        .options({ segment: 3, totalSegments: 3.5 })
        .params()

    expect(invalidCallC).toThrow(DynamoDBToolboxError)
    expect(invalidCallC).toThrow(
      expect.objectContaining({ code: 'scanCommand.invalidSegmentOption' })
    )

    // invalid totalSegments (negative integer)
    const invalidCallD = () =>
      TestTable.build(ScanCommand)
        // Impossible to raise type error here
        .options({ segment: 3, totalSegments: -1 })
        .params()

    expect(invalidCallD).toThrow(DynamoDBToolboxError)
    expect(invalidCallD).toThrow(
      expect.objectContaining({ code: 'scanCommand.invalidSegmentOption' })
    )

    // invalid segment (non-number)
    const invalidCallE = () =>
      TestTable.build(ScanCommand)
        .options({
          // @ts-expect-error
          segment: 'foo',
          totalSegments: 4
        })
        .params()

    expect(invalidCallE).toThrow(DynamoDBToolboxError)
    expect(invalidCallE).toThrow(
      expect.objectContaining({ code: 'scanCommand.invalidSegmentOption' })
    )

    // invalid segment (non-integer)
    const invalidCallF = () =>
      TestTable.build(ScanCommand)
        // Impossible to raise type error here
        .options({ segment: 2.5, totalSegments: 4 })
        .params()

    expect(invalidCallF).toThrow(DynamoDBToolboxError)
    expect(invalidCallF).toThrow(
      expect.objectContaining({ code: 'scanCommand.invalidSegmentOption' })
    )

    // invalid segment (negative integer)
    const invalidCallG = () =>
      TestTable.build(ScanCommand)
        // Impossible to raise type error here
        .options({ segment: -1, totalSegments: 4 })
        .params()

    expect(invalidCallG).toThrow(DynamoDBToolboxError)
    expect(invalidCallG).toThrow(
      expect.objectContaining({ code: 'scanCommand.invalidSegmentOption' })
    )

    // invalid segment (above totalSegments)
    const invalidCallH = () =>
      TestTable.build(ScanCommand)
        // Impossible to raise type error here
        .options({ segment: 3, totalSegments: 3 })
        .params()

    expect(invalidCallH).toThrow(DynamoDBToolboxError)
    expect(invalidCallH).toThrow(
      expect.objectContaining({ code: 'scanCommand.invalidSegmentOption' })
    )
  })

  test('overrides tableName', () => {
    const { TableName } = TestTable.build(ScanCommand).options({ tableName: 'tableName' }).params()

    expect(TableName).toBe('tableName')
  })

  test('fails on invalid tableName option', () => {
    // segment without totalSegment option
    const invalidCall = () =>
      TestTable.build(ScanCommand)
        .options({
          // @ts-expect-error
          tableName: 42
        })
        .params()

    expect(invalidCall).toThrow(DynamoDBToolboxError)
    expect(invalidCall).toThrow(expect.objectContaining({ code: 'options.invalidTableNameOption' }))
  })

  test('fails on extra options', () => {
    const invalidCall = () =>
      TestTable.build(ScanCommand)
        .options({
          // @ts-expect-error
          extra: true
        })
        .params()

    expect(invalidCall).toThrow(DynamoDBToolboxError)
    expect(invalidCall).toThrow(expect.objectContaining({ code: 'options.unknownOption' }))
  })

  test('applies blind filter if no entity has been provided', () => {
    const command = TestTable.build(ScanCommand).options({ filter: { attr: 'foo', eq: 'bar' } })
    const { FilterExpression, ExpressionAttributeNames, ExpressionAttributeValues } =
      command.params()

    expect(FilterExpression).toBe('#c_1 = :c_1')
    expect(ExpressionAttributeNames).toMatchObject({ '#c_1': 'foo' })
    expect(ExpressionAttributeValues).toMatchObject({ ':c_1': 'bar' })
  })

  test('ignores filter if entities have been provided', () => {
    const command = TestTable.build(ScanCommand)
      .entities(Entity1)
      .options({
        // @ts-expect-error
        filter: { attr: 'foo', eq: 'bar' }
      })
    const { ExpressionAttributeNames = {}, ExpressionAttributeValues = {} } = command.params()

    expect(Object.values(ExpressionAttributeNames)).not.toContain('foo')
    expect(Object.values(ExpressionAttributeValues)).not.toContain('bar')
  })

  test('applies entity _et filter', () => {
    const command = TestTable.build(ScanCommand).entities(Entity1)
    const { FilterExpression, ExpressionAttributeNames, ExpressionAttributeValues } =
      command.params()

    expect(FilterExpression).toBe('#c0_1 = :c0_1')
    expect(ExpressionAttributeNames).toMatchObject({ '#c0_1': TestTable.entityAttributeSavedAs })
    expect(ExpressionAttributeValues).toMatchObject({ ':c0_1': Entity1.name })

    const assertReturnedItems: A.Equals<
      Awaited<ReturnType<typeof command.send>>['Items'],
      FormattedItem<typeof Entity1>[] | undefined
    > = 1
    assertReturnedItems
  })

  test('does not apply entity _et filter if entityAttrFilter is false', () => {
    const command = TestTable.build(ScanCommand)
      .entities(Entity1)
      .options({ entityAttrFilter: false })

    const { FilterExpression } = command.params()

    expect(FilterExpression).toBe(undefined)
  })

  test('applies entity _et AND additional filter (even if entityAttrFilter is false)', () => {
    const { FilterExpression, ExpressionAttributeNames, ExpressionAttributeValues } =
      TestTable.build(ScanCommand)
        .entities(Entity1)
        .options({
          filters: {
            entity1: { attr: 'age', gte: 40 }
          },
          entityAttrFilter: false
        })
        .params()

    expect(FilterExpression).toBe('(#c0_1 = :c0_1) AND (#c0_2 >= :c0_2)')
    expect(ExpressionAttributeNames).toMatchObject({
      '#c0_1': TestTable.entityAttributeSavedAs,
      '#c0_2': 'age'
    })
    expect(ExpressionAttributeValues).toMatchObject({
      ':c0_1': Entity1.name,
      ':c0_2': 40
    })
  })

  test('applies two entity filters', () => {
    const command = TestTable.build(ScanCommand).entities(Entity1, Entity2)
    const { FilterExpression, ExpressionAttributeNames, ExpressionAttributeValues } =
      command.params()

    expect(FilterExpression).toBe('(#c0_1 = :c0_1) OR (#c1_1 = :c1_1)')
    expect(ExpressionAttributeNames).toMatchObject({
      '#c0_1': TestTable.entityAttributeSavedAs,
      '#c1_1': TestTable.entityAttributeSavedAs
    })
    expect(ExpressionAttributeValues).toMatchObject({
      ':c0_1': Entity1.name,
      ':c1_1': Entity2.name
    })

    const assertReturnedItems: A.Equals<
      Awaited<ReturnType<typeof command.send>>['Items'],
      (FormattedItem<typeof Entity1> | FormattedItem<typeof Entity2>)[] | undefined
    > = 1
    assertReturnedItems
  })

  test('applies two entity filters AND additional filters', () => {
    const { FilterExpression, ExpressionAttributeNames, ExpressionAttributeValues } =
      TestTable.build(ScanCommand)
        .entities(Entity1, Entity2)
        .options({
          filters: {
            entity1: { attr: 'age', gte: 40 },
            entity2: { attr: 'price', gte: 100 }
          }
        })
        .params()

    expect(FilterExpression).toBe(
      '((#c0_1 = :c0_1) AND (#c0_2 >= :c0_2)) OR ((#c1_1 = :c1_1) AND (#c1_2 >= :c1_2))'
    )
    expect(ExpressionAttributeNames).toMatchObject({
      '#c0_1': TestTable.entityAttributeSavedAs,
      '#c0_2': 'age',
      '#c1_1': TestTable.entityAttributeSavedAs,
      '#c1_2': 'price'
    })
    expect(ExpressionAttributeValues).toMatchObject({
      ':c0_1': Entity1.name,
      ':c0_2': 40,
      ':c1_1': Entity2.name,
      ':c1_2': 100
    })
  })

  test('transforms attributes when applying filters', () => {
    const TestEntity3 = new Entity({
      name: 'entity3',
      schema: schema({
        email: string().key().savedAs('pk'),
        sort: string().key().savedAs('sk'),
        transformedStr: string().transform(prefix('foo'))
      }),
      table: TestTable
    })

    const { FilterExpression, ExpressionAttributeNames, ExpressionAttributeValues } =
      TestTable.build(ScanCommand)
        .entities(TestEntity3)
        .options({
          filters: {
            entity3: { attr: 'transformedStr', gte: 'bar', transform: false }
          }
        })
        .params()

    expect(FilterExpression).toContain('#c0_2 >= :c0_2')
    expect(ExpressionAttributeNames).toMatchObject({ '#c0_2': 'transformedStr' })
    expect(ExpressionAttributeValues).toMatchObject({ ':c0_2': 'bar' })

    const { ExpressionAttributeValues: ExpressionAttributeValues2 } = TestTable.build(ScanCommand)
      .entities(TestEntity3)
      .options({
        filters: {
          entity3: { attr: 'transformedStr', gte: 'bar' }
        }
      })
      .params()

    expect(ExpressionAttributeValues2).toMatchObject({ ':c0_2': 'foo#bar' })
  })

  test('applies entity projection expression', () => {
    const command = TestTable.build(ScanCommand)
      .entities(Entity1)
      .options({ attributes: ['age', 'name'] })

    const { ProjectionExpression, ExpressionAttributeNames } = command.params()

    const assertReturnedItems: A.Equals<
      Awaited<ReturnType<typeof command.send>>['Items'],
      FormattedItem<typeof Entity1, { attributes: 'age' | 'name' }>[] | undefined
    > = 1
    assertReturnedItems

    expect(ProjectionExpression).toBe('#p_1, #p_2, #p_3')
    expect(ExpressionAttributeNames).toMatchObject({
      '#p_1': '_et',
      '#p_2': 'age',
      '#p_3': 'name'
    })
  })

  test('applies two entity projection expressions', () => {
    const command = TestTable.build(ScanCommand)
      .entities(Entity1, Entity2)
      .options({
        attributes: ['created', 'modified']
      })

    const { ProjectionExpression, ExpressionAttributeNames } = command.params()

    const assertReturnedItems: A.Equals<
      Awaited<ReturnType<typeof command.send>>['Items'],
      | (
          | FormattedItem<typeof Entity1, { attributes: 'created' | 'modified' }>
          | FormattedItem<typeof Entity2, { attributes: 'created' | 'modified' }>
        )[]
      | undefined
    > = 1
    assertReturnedItems

    expect(ProjectionExpression).toBe('#p_1, #p_2, #p_3')
    expect(ExpressionAttributeNames).toMatchObject({
      '#p_1': '_et',
      '#p_2': '_ct',
      '#p_3': '_md'
    })
  })
})
