import type { Condition } from '~/entity/actions/parseCondition/index.js'
import type { Entity } from '~/entity/index.js'
import type { CapacityOption } from '~/options/capacity.js'
import type { MetricsOption } from '~/options/metrics.js'
import type { ReturnValuesOption } from '~/options/returnValues.js'
import type { ReturnValuesOnConditionFalseOption } from '~/options/returnValuesOnConditionFalse.js'

export type UpdateItemCommandReturnValuesOption = ReturnValuesOption

export const updateItemCommandReturnValuesOptionsSet = new Set<UpdateItemCommandReturnValuesOption>(
  ['NONE', 'ALL_OLD', 'UPDATED_OLD', 'ALL_NEW', 'UPDATED_NEW']
)

export interface UpdateItemOptions<ENTITY extends Entity = Entity> {
  capacity?: CapacityOption
  metrics?: MetricsOption
  returnValues?: UpdateItemCommandReturnValuesOption
  returnValuesOnConditionFalse?: ReturnValuesOnConditionFalseOption
  condition?: Condition<ENTITY>
  tableName?: string
}
