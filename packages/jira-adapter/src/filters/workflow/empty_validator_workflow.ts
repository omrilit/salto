/*
 * Copyright 2025 Salto Labs Ltd.
 * Licensed under the Salto Terms of Use (the "License");
 * You may not use this file except in compliance with the License.  You may obtain a copy of the License at https://www.salto.io/terms-of-use
 *
 * CERTAIN THIRD PARTY SOFTWARE MAY BE CONTAINED IN PORTIONS OF THE SOFTWARE. See NOTICE FILE AT https://github.com/salto-io/salto/blob/main/NOTICES
 */
import { getChangeData, isAdditionOrModificationChange, isInstanceChange, Value } from '@salto-io/adapter-api'
import { isEmptyValidatorV1, isEmptyValidatorV2 } from '../../change_validators/workflows/empty_validator_workflow'
import { FilterCreator } from '../../filter'
import { isWorkflowV1Instance, WorkflowV1Instance } from './types'
import { isWorkflowInstance, isWorkflowV2Instance, WorkflowV2Instance } from '../workflowV2/types'

const removeEmptyValidators = (instance: WorkflowV1Instance | WorkflowV2Instance): void => {
  if (isWorkflowV1Instance(instance)) {
    Object.values(instance.value.transitions)
      .filter((transition: Value) => transition.rules?.validators !== undefined)
      .forEach((transition: Value) => {
        transition.rules.validators = transition.rules.validators.filter(
          (validator: Value) => !isEmptyValidatorV1(validator),
        )
      })
  } else if (isWorkflowV2Instance(instance)) {
    Object.values(instance.value.transitions)
      .filter((transition: Value) => transition.validators !== undefined)
      .forEach((transition: Value) => {
        transition.validators = transition.validators.filter((validator: Value) => !isEmptyValidatorV2(validator))
      })
  }
}

const filter: FilterCreator = () => ({
  name: 'emptyValidatorWorkflowFilter',
  preDeploy: async changes => {
    changes
      .filter(isInstanceChange)
      .filter(isAdditionOrModificationChange)
      .map(getChangeData)
      .filter(isWorkflowInstance)
      .forEach(removeEmptyValidators)
  },
})

export default filter
