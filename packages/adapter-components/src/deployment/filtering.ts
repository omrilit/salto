/*
 * Copyright 2025 Salto Labs Ltd.
 * Licensed under the Salto Terms of Use (the "License");
 * You may not use this file except in compliance with the License.  You may obtain a copy of the License at https://www.salto.io/terms-of-use
 *
 * CERTAIN THIRD PARTY SOFTWARE MAY BE CONTAINED IN PORTIONS OF THE SOFTWARE. See NOTICE FILE AT https://github.com/salto-io/salto/blob/main/NOTICES
 */
import _ from 'lodash'
import {
  ActionName,
  ElemID,
  InstanceElement,
  ModificationChange,
  ReadOnlyElementsSource,
  getChangeData,
} from '@salto-io/adapter-api'
import { WALK_NEXT_STEP, resolvePath, setPath, transformElement, walkOnValue } from '@salto-io/adapter-utils'
import { OPERATION_TO_ANNOTATION } from './annotations'

export const filterUndeployableValues = async (
  instance: InstanceElement,
  action: ActionName,
  elementsSource?: ReadOnlyElementsSource,
): Promise<InstanceElement> =>
  transformElement({
    element: instance,
    strict: false,
    allowEmptyArrays: true,
    allowExistingEmptyObjects: true,
    elementsSource,
    transformFunc: ({ value, field }) => {
      // The === false is because if the value is undefined, we don't want to filter it out
      if (field?.annotations[OPERATION_TO_ANNOTATION[action]] === false) {
        return undefined
      }
      return value
    },
  })

export const filterIgnoredValues = async (
  instance: InstanceElement,
  fieldsToIgnore: string[] | ((path: ElemID) => boolean),
  configFieldsToIgnore: string[] = [],
  elementsSource?: ReadOnlyElementsSource,
): Promise<InstanceElement> => {
  const filteredInstance = _.isFunction(fieldsToIgnore)
    ? await transformElement({
        element: instance,
        strict: false,
        allowEmptyArrays: true,
        allowExistingEmptyObjects: true,
        elementsSource,
        transformFunc: ({ value, path }) => {
          if (path !== undefined && fieldsToIgnore(path)) {
            return undefined
          }
          return value
        },
      })
    : instance

  filteredInstance.value = _.omit(filteredInstance.value, [
    ...configFieldsToIgnore,
    ...(Array.isArray(fieldsToIgnore) ? fieldsToIgnore : []),
  ])

  return filteredInstance
}

/**
 * Transform removed change values to null, for APIs that require explicit null values
 */
export const transformRemovedValuesToNull = ({
  change,
  applyToPath,
  skipSubFields = false,
}: {
  change: ModificationChange<InstanceElement>
  applyToPath?: string[]
  skipSubFields?: boolean
}): ModificationChange<InstanceElement> => {
  const { before, after: afterOriginal } = change.data
  const after = afterOriginal.clone()
  const elemId = applyToPath
    ? getChangeData(change).elemID.createNestedID(...applyToPath)
    : getChangeData(change).elemID
  walkOnValue({
    elemId,
    value: resolvePath(before, elemId),
    func: ({ value, path }) => {
      const valueInAfter = resolvePath(after, path)
      if (valueInAfter === undefined) {
        if (!_.isPlainObject(value) || skipSubFields) {
          setPath(after, path, null)
          return WALK_NEXT_STEP.SKIP
        }
        // if value is an object, we want to recurse into it to set all its values to null
        return WALK_NEXT_STEP.RECURSE
      }
      // Arrays are being skipped to avoid setting null to removed array elements
      if (Array.isArray(value)) {
        return WALK_NEXT_STEP.SKIP
      }
      return WALK_NEXT_STEP.RECURSE
    },
  })
  return {
    ...change,
    data: {
      before,
      after,
    },
  }
}
