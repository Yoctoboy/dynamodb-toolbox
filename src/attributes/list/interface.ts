/**
 * @debt circular "Remove & prevent imports from entity to schema"
 */
import type { AttributeUpdateItemInput, UpdateItemInput } from '~/entity/actions/update/types.js'
import type { Schema, SchemaAction, ValidValue } from '~/schema/index.js'
import type {
  ConstrainedOverwrite,
  If,
  NarrowObject,
  Overwrite,
  ValueOrGetter
} from '~/types/index.js'
import { ifThenElse } from '~/utils/ifThenElse.js'
import { overwrite } from '~/utils/overwrite.js'

import { $elements, $state, $type } from '../constants/attributeOptions.js'
import type { Always, AtLeastOnce, Never, RequiredOption } from '../constants/index.js'
import type { SharedAttributeState } from '../shared/interface.js'
import type { Attribute } from '../types/index.js'
import type { Validator } from '../types/validator.js'
import { freezeListAttribute } from './freeze.js'
import type { FreezeListAttribute } from './freeze.js'
import type { $ListAttributeElements } from './types.js'

export interface $ListAttributeState<
  STATE extends SharedAttributeState = SharedAttributeState,
  $ELEMENTS extends $ListAttributeElements = $ListAttributeElements
> {
  [$type]: 'list'
  [$state]: STATE
  [$elements]: $ELEMENTS
}

export interface $ListAttributeNestedState<
  STATE extends SharedAttributeState = SharedAttributeState,
  $ELEMENTS extends $ListAttributeElements = $ListAttributeElements
> extends $ListAttributeState<STATE, $ELEMENTS> {
  freeze: (path?: string) => FreezeListAttribute<$ListAttributeState<STATE, $ELEMENTS>, true>
}

/**
 * List attribute interface
 */
export class $ListAttribute<
  STATE extends SharedAttributeState = SharedAttributeState,
  $ELEMENTS extends $ListAttributeElements = $ListAttributeElements
> implements $ListAttributeNestedState<STATE, $ELEMENTS>
{
  [$type]: 'list';
  [$state]: STATE;
  [$elements]: $ELEMENTS

  constructor(state: STATE, elements: $ELEMENTS) {
    this[$type] = 'list'
    this[$state] = state
    this[$elements] = elements
  }

  /**
   * Tag attribute as required. Possible values are:
   * - `'atLeastOnce'` _(default)_: Required in PUTs, optional in UPDATEs
   * - `'never'`: Optional in PUTs and UPDATEs
   * - `'always'`: Required in PUTs and UPDATEs
   *
   * @param nextRequired RequiredOption
   */
  required<NEXT_IS_REQUIRED extends RequiredOption = AtLeastOnce>(
    nextRequired: NEXT_IS_REQUIRED = 'atLeastOnce' as NEXT_IS_REQUIRED
  ): $ListAttribute<Overwrite<STATE, { required: NEXT_IS_REQUIRED }>, $ELEMENTS> {
    return new $ListAttribute(overwrite(this[$state], { required: nextRequired }), this[$elements])
  }

  /**
   * Shorthand for `required('never')`
   */
  optional(): $ListAttribute<Overwrite<STATE, { required: Never }>, $ELEMENTS> {
    return this.required('never')
  }

  /**
   * Hide attribute after fetch commands and formatting
   */
  hidden<NEXT_HIDDEN extends boolean = true>(
    nextHidden: NEXT_HIDDEN = true as NEXT_HIDDEN
  ): $ListAttribute<Overwrite<STATE, { hidden: NEXT_HIDDEN }>, $ELEMENTS> {
    return new $ListAttribute(overwrite(this[$state], { hidden: nextHidden }), this[$elements])
  }

  /**
   * Tag attribute as a primary key attribute or linked to a primary attribute
   */
  key<NEXT_KEY extends boolean = true>(
    nextKey: NEXT_KEY = true as NEXT_KEY
  ): $ListAttribute<Overwrite<STATE, { key: NEXT_KEY; required: Always }>, $ELEMENTS> {
    return new $ListAttribute(
      overwrite(this[$state], { key: nextKey, required: 'always' }),
      this[$elements]
    )
  }

  /**
   * Rename attribute before save commands
   */
  savedAs<NEXT_SAVED_AS extends string | undefined>(
    nextSavedAs: NEXT_SAVED_AS
  ): $ListAttribute<Overwrite<STATE, { savedAs: NEXT_SAVED_AS }>, $ELEMENTS> {
    return new $ListAttribute(overwrite(this[$state], { savedAs: nextSavedAs }), this[$elements])
  }

  /**
   * Provide a default value for attribute in Primary Key computing
   *
   * @param nextKeyDefault `keyAttributeInput | (() => keyAttributeInput)`
   */
  keyDefault(
    nextKeyDefault: ValueOrGetter<
      ValidValue<FreezeListAttribute<$ListAttributeState<STATE, $ELEMENTS>>, { mode: 'key' }>
    >
  ): $ListAttribute<
    Overwrite<
      STATE,
      {
        defaults: {
          key: unknown
          put: STATE['defaults']['put']
          update: STATE['defaults']['update']
        }
      }
    >,
    $ELEMENTS
  > {
    return new $ListAttribute(
      overwrite(this[$state], {
        defaults: {
          key: nextKeyDefault as unknown,
          put: this[$state].defaults.put,
          update: this[$state].defaults.update
        }
      }),
      this[$elements]
    )
  }

  /**
   * Provide a default value for attribute in PUT commands
   *
   * @param nextPutDefault `putAttributeInput | (() => putAttributeInput)`
   */
  putDefault(
    nextPutDefault: ValueOrGetter<
      ValidValue<FreezeListAttribute<$ListAttributeState<STATE, $ELEMENTS>>>
    >
  ): $ListAttribute<
    Overwrite<
      STATE,
      {
        defaults: {
          key: STATE['defaults']['key']
          put: unknown
          update: STATE['defaults']['update']
        }
      }
    >,
    $ELEMENTS
  > {
    return new $ListAttribute(
      overwrite(this[$state], {
        defaults: {
          key: this[$state].defaults.key,
          put: nextPutDefault as unknown,
          update: this[$state].defaults.update
        }
      }),
      this[$elements]
    )
  }

  /**
   * Provide a default value for attribute in UPDATE commands
   *
   * @param nextUpdateDefault `updateAttributeInput | (() => updateAttributeInput)`
   */
  updateDefault(
    nextUpdateDefault: ValueOrGetter<
      AttributeUpdateItemInput<FreezeListAttribute<$ListAttributeState<STATE, $ELEMENTS>>, true>
    >
  ): $ListAttribute<
    Overwrite<
      STATE,
      {
        defaults: {
          key: STATE['defaults']['key']
          put: STATE['defaults']['put']
          update: unknown
        }
      }
    >,
    $ELEMENTS
  > {
    return new $ListAttribute(
      overwrite(this[$state], {
        defaults: {
          key: this[$state].defaults.key,
          put: this[$state].defaults.put,
          update: nextUpdateDefault as unknown
        }
      }),
      this[$elements]
    )
  }

  /**
   * Provide a default value for attribute in PUT commands OR Primary Key computing if attribute is tagged as key
   *
   * @param nextDefault `key/putAttributeInput | (() => key/putAttributeInput)`
   */
  default(
    nextDefault: ValueOrGetter<
      If<
        STATE['key'],
        ValidValue<FreezeListAttribute<$ListAttributeState<STATE, $ELEMENTS>>, { mode: 'key' }>,
        ValidValue<FreezeListAttribute<$ListAttributeState<STATE, $ELEMENTS>>>
      >
    >
  ): $ListAttribute<
    Overwrite<
      STATE,
      {
        defaults: If<
          STATE['key'],
          {
            key: unknown
            put: STATE['defaults']['put']
            update: STATE['defaults']['update']
          },
          {
            key: STATE['defaults']['key']
            put: unknown
            update: STATE['defaults']['update']
          }
        >
      }
    >,
    $ELEMENTS
  > {
    return new $ListAttribute(
      overwrite(this[$state], {
        defaults: ifThenElse(
          this[$state].key,
          {
            key: nextDefault as unknown,
            put: this[$state].defaults.put,
            update: this[$state].defaults.update
          },
          {
            key: this[$state].defaults.key,
            put: nextDefault as unknown,
            update: this[$state].defaults.update
          }
        )
      }),
      this[$elements]
    )
  }

  /**
   * Provide a **linked** default value for attribute in Primary Key computing
   *
   * @param nextKeyLink `keyAttributeInput | ((keyInput) => keyAttributeInput)`
   */
  keyLink<SCHEMA extends Schema>(
    nextKeyLink: (
      keyInput: ValidValue<SCHEMA, { mode: 'key' }>
    ) => ValidValue<FreezeListAttribute<$ListAttributeState<STATE, $ELEMENTS>>, { mode: 'key' }>
  ): $ListAttribute<
    Overwrite<
      STATE,
      {
        links: {
          key: unknown
          put: STATE['links']['put']
          update: STATE['links']['update']
        }
      }
    >,
    $ELEMENTS
  > {
    return new $ListAttribute(
      overwrite(this[$state], {
        links: {
          key: nextKeyLink as unknown,
          put: this[$state].links.put,
          update: this[$state].links.update
        }
      }),
      this[$elements]
    )
  }

  /**
   * Provide a **linked** default value for attribute in PUT commands
   *
   * @param nextPutLink `putAttributeInput | ((putItemInput) => putAttributeInput)`
   */
  putLink<SCHEMA extends Schema>(
    nextPutLink: (
      putItemInput: ValidValue<SCHEMA>
    ) => ValidValue<FreezeListAttribute<$ListAttributeState<STATE, $ELEMENTS>>>
  ): $ListAttribute<
    Overwrite<
      STATE,
      {
        links: {
          key: STATE['links']['key']
          put: unknown
          update: STATE['links']['update']
        }
      }
    >,
    $ELEMENTS
  > {
    return new $ListAttribute(
      overwrite(this[$state], {
        links: {
          key: this[$state].links.key,
          put: nextPutLink as unknown,
          update: this[$state].links.update
        }
      }),
      this[$elements]
    )
  }

  /**
   * Provide a **linked** default value for attribute in UPDATE commands
   *
   * @param nextUpdateLink `unknown | ((updateItemInput) => updateAttributeInput)`
   */
  updateLink<SCHEMA extends Schema>(
    nextUpdateLink: (
      updateItemInput: UpdateItemInput<SCHEMA, true>
    ) => AttributeUpdateItemInput<FreezeListAttribute<$ListAttributeState<STATE, $ELEMENTS>>, true>
  ): $ListAttribute<
    Overwrite<
      STATE,
      {
        links: {
          key: STATE['links']['key']
          put: STATE['links']['put']
          update: unknown
        }
      }
    >,
    $ELEMENTS
  > {
    return new $ListAttribute(
      overwrite(this[$state], {
        links: {
          key: this[$state].links.key,
          put: this[$state].links.put,
          update: nextUpdateLink as unknown
        }
      }),
      this[$elements]
    )
  }

  /**
   * Provide a **linked** default value for attribute in PUT commands OR Primary Key computing if attribute is tagged as key
   *
   * @param nextLink `key/putAttributeInput | (() => key/putAttributeInput)`
   */
  link<SCHEMA extends Schema>(
    nextLink: (
      keyOrPutItemInput: If<STATE['key'], ValidValue<SCHEMA, { mode: 'key' }>, ValidValue<SCHEMA>>
    ) => If<
      STATE['key'],
      ValidValue<FreezeListAttribute<$ListAttributeState<STATE, $ELEMENTS>>, { mode: 'key' }>,
      ValidValue<FreezeListAttribute<$ListAttributeState<STATE, $ELEMENTS>>>
    >
  ): $ListAttribute<
    Overwrite<
      STATE,
      {
        links: If<
          STATE['key'],
          {
            key: unknown
            put: STATE['links']['put']
            update: STATE['links']['update']
          },
          {
            key: STATE['links']['key']
            put: unknown
            update: STATE['links']['update']
          }
        >
      }
    >,
    $ELEMENTS
  > {
    return new $ListAttribute(
      overwrite(this[$state], {
        links: ifThenElse(
          this[$state].key,
          {
            key: nextLink as unknown,
            put: this[$state].links.put,
            update: this[$state].links.update
          },
          {
            key: this[$state].links.key,
            put: nextLink as unknown,
            update: this[$state].links.update
          }
        )
      }),
      this[$elements]
    )
  }

  /**
   * Provide a custom validator for attribute in Primary Key computing
   *
   * @param nextKeyValidator `(keyAttributeInput) => boolean | string`
   */
  keyValidate(
    nextKeyValidator: Validator<
      ValidValue<
        FreezeListAttribute<$ListAttribute<STATE, $ELEMENTS>>,
        { mode: 'key'; defined: true }
      >,
      FreezeListAttribute<$ListAttribute<STATE, $ELEMENTS>>
    >
  ): $ListAttribute<
    Overwrite<
      STATE,
      {
        validators: {
          key: Validator
          put: STATE['validators']['put']
          update: STATE['validators']['update']
        }
      }
    >,
    $ELEMENTS
  > {
    return new $ListAttribute(
      overwrite(this[$state], {
        validators: {
          key: nextKeyValidator as Validator,
          put: this[$state].validators.put,
          update: this[$state].validators.update
        }
      }),
      this[$elements]
    )
  }

  /**
   * Provide a custom validator for attribute in PUT commands
   *
   * @param nextPutValidator `(putAttributeInput) => boolean | string`
   */
  putValidate(
    nextPutValidator: Validator<
      ValidValue<FreezeListAttribute<$ListAttribute<STATE, $ELEMENTS>>, { defined: true }>,
      FreezeListAttribute<$ListAttribute<STATE, $ELEMENTS>>
    >
  ): $ListAttribute<
    Overwrite<
      STATE,
      {
        validators: {
          key: STATE['validators']['key']
          put: Validator
          update: STATE['validators']['update']
        }
      }
    >,
    $ELEMENTS
  > {
    return new $ListAttribute(
      overwrite(this[$state], {
        validators: {
          key: this[$state].validators.key,
          put: nextPutValidator as Validator,
          update: this[$state].validators.update
        }
      }),
      this[$elements]
    )
  }

  /**
   * Provide a custom validator for attribute in UPDATE commands
   *
   * @param nextUpdateValidator `(updateAttributeInput) => boolean | string`
   */
  updateValidate(
    nextUpdateValidator: Validator<
      AttributeUpdateItemInput<FreezeListAttribute<$ListAttribute<STATE, $ELEMENTS>>, true>,
      FreezeListAttribute<$ListAttribute<STATE, $ELEMENTS>>
    >
  ): $ListAttribute<
    Overwrite<
      STATE,
      {
        validators: {
          key: STATE['validators']['key']
          put: STATE['validators']['put']
          update: Validator
        }
      }
    >,
    $ELEMENTS
  > {
    return new $ListAttribute(
      overwrite(this[$state], {
        validators: {
          key: this[$state].validators.key,
          put: this[$state].validators.put,
          update: nextUpdateValidator as Validator
        }
      }),
      this[$elements]
    )
  }

  /**
   * Provide a custom validator for attribute in PUT commands OR Primary Key computing if attribute is tagged as key
   *
   * @param nextValidator `(key/putAttributeInput) => boolean | string`
   */
  validate(
    nextValidator: Validator<
      If<
        STATE['key'],
        ValidValue<
          FreezeListAttribute<$ListAttribute<STATE, $ELEMENTS>>,
          { mode: 'key'; defined: true }
        >,
        ValidValue<FreezeListAttribute<$ListAttribute<STATE, $ELEMENTS>>, { defined: true }>
      >,
      FreezeListAttribute<$ListAttribute<STATE, $ELEMENTS>>
    >
  ): $ListAttribute<
    Overwrite<
      STATE,
      {
        validators: If<
          STATE['key'],
          {
            key: Validator
            put: STATE['validators']['put']
            update: STATE['validators']['update']
          },
          {
            key: STATE['validators']['key']
            put: Validator
            update: STATE['validators']['update']
          }
        >
      }
    >,
    $ELEMENTS
  > {
    return new $ListAttribute(
      overwrite(this[$state], {
        validators: ifThenElse(
          /**
           * @debt type "remove this cast"
           */
          this[$state].key as STATE['key'],
          {
            key: nextValidator as Validator,
            put: this[$state].validators.put,
            update: this[$state].validators.update
          },
          {
            key: this[$state].validators.key,
            put: nextValidator as Validator,
            update: this[$state].validators.update
          }
        )
      }),
      this[$elements]
    )
  }

  freeze(path?: string): FreezeListAttribute<$ListAttributeState<STATE, $ELEMENTS>, true> {
    return freezeListAttribute(this[$state], this[$elements], path)
  }
}

export class ListAttribute<
  STATE extends SharedAttributeState = SharedAttributeState,
  ELEMENTS extends Attribute = Attribute
> implements SharedAttributeState<STATE>
{
  type: 'list'
  path?: string
  elements: ELEMENTS
  required: STATE['required']
  hidden: STATE['hidden']
  key: STATE['key']
  savedAs: STATE['savedAs']
  defaults: STATE['defaults']
  links: STATE['links']
  validators: STATE['validators']

  constructor({ path, elements, ...state }: STATE & { path?: string; elements: ELEMENTS }) {
    this.type = 'list'
    this.path = path
    this.elements = elements
    this.required = state.required
    this.hidden = state.hidden
    this.key = state.key
    this.savedAs = state.savedAs
    this.defaults = state.defaults
    this.links = state.links
    this.validators = state.validators
  }
}

export class ListAttribute_<
  STATE extends SharedAttributeState = SharedAttributeState,
  ELEMENTS extends Attribute = Attribute
> extends ListAttribute<STATE, ELEMENTS> {
  clone<NEXT_STATE extends Partial<SharedAttributeState> = {}>(
    nextState: NarrowObject<NEXT_STATE> = {} as NEXT_STATE
  ): ListAttribute_<ConstrainedOverwrite<SharedAttributeState, STATE, NEXT_STATE>, ELEMENTS> {
    return new ListAttribute_({
      ...({
        ...this,
        defaults: { ...this.defaults },
        links: { ...this.links },
        validators: { ...this.validators },
        ...nextState
      } as ConstrainedOverwrite<SharedAttributeState, STATE, NEXT_STATE>),
      elements: this.elements
    })
  }

  build<SCHEMA_ACTION extends SchemaAction<this> = SchemaAction<this>>(
    schemaAction: new (schema: this) => SCHEMA_ACTION
  ): SCHEMA_ACTION {
    return new schemaAction(this)
  }
}
