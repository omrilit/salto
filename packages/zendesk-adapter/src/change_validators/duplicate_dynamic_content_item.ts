/*
 * Copyright 2025 Salto Labs Ltd.
 * Licensed under the Salto Terms of Use (the "License");
 * You may not use this file except in compliance with the License.  You may obtain a copy of the License at https://www.salto.io/terms-of-use
 *
 * CERTAIN THIRD PARTY SOFTWARE MAY BE CONTAINED IN PORTIONS OF THE SOFTWARE. See NOTICE FILE AT https://github.com/salto-io/salto/blob/main/NOTICES
 */
import {
  Change,
  ChangeError,
  ChangeValidator,
  getChangeData,
  InstanceElement,
  isAdditionOrModificationChange,
  isInstanceChange,
} from '@salto-io/adapter-api'
import { getInstancesFromElementSource } from '@salto-io/adapter-utils'
import { collections } from '@salto-io/lowerdash'
import _ from 'lodash'
import { DYNAMIC_CONTENT_ITEM_TYPE_NAME } from '../constants'

const { awu } = collections.asynciterable

const isRelevantChange = (change: Change<InstanceElement>): boolean => {
  const instance = getChangeData(change)
  return instance.elemID.typeName === DYNAMIC_CONTENT_ITEM_TYPE_NAME
}

const toError = (field: string, instance: InstanceElement, conflictingElements: string[]): ChangeError => ({
  elemID: instance.elemID,
  severity: 'Error',
  message: `Cannot do this change since this dynamic content item ${field} is already in use`,
  detailedMessage: `The dynamic content item ${field} '${instance.value[field]}' is already used by the following elements:
${conflictingElements.join(', ')}. Please change the ${field} of the dynamic content item and try again.`,
})

export const duplicateDynamicContentItemValidator: ChangeValidator = async (changes, elementSource) => {
  const relevantChanges = changes
    .filter(isInstanceChange)
    .filter(isAdditionOrModificationChange)
    .filter(isRelevantChange)
  if (_.isEmpty(relevantChanges) || elementSource === undefined) {
    return []
  }
  const relevantInstances = await getInstancesFromElementSource(elementSource, [DYNAMIC_CONTENT_ITEM_TYPE_NAME])
  return awu(relevantChanges)
    .map(async change => {
      const changeInstance = getChangeData(change)
      const getConflictedInstances = (field: string): string[] =>
        relevantInstances
          .filter(
            relevantInstance =>
              relevantInstance.value[field]?.toLowerCase() === changeInstance.value[field]?.toLowerCase(),
          )
          .filter(relevantInstance => relevantInstance.elemID.getFullName() !== changeInstance.elemID.getFullName())
          .map(relevantInstance => relevantInstance.elemID.getFullName())

      const errors = []
      const conflictedInstanceNames = getConflictedInstances('name')
      if (conflictedInstanceNames.length > 0) {
        errors.push(toError('name', changeInstance, conflictedInstanceNames))
      }
      const conflictedInstancePlaceholders = getConflictedInstances('placeholder')
      if (conflictedInstancePlaceholders.length > 0) {
        errors.push(toError('placeholder', changeInstance, conflictedInstancePlaceholders))
      }
      return errors
    })
    .flat()
    .toArray()
}
