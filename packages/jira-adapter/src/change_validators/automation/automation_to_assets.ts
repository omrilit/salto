/*
 * Copyright 2025 Salto Labs Ltd.
 * Licensed under the Salto Terms of Use (the "License");
 * You may not use this file except in compliance with the License.  You may obtain a copy of the License at https://www.salto.io/terms-of-use
 *
 * CERTAIN THIRD PARTY SOFTWARE MAY BE CONTAINED IN PORTIONS OF THE SOFTWARE. See NOTICE FILE AT https://github.com/salto-io/salto/blob/main/NOTICES
 */
import {
  ChangeValidator,
  CORE_ANNOTATIONS,
  getChangeData,
  isAdditionChange,
  isAdditionOrModificationChange,
  isInstanceChange,
  SeverityLevel,
} from '@salto-io/adapter-api'
import { values } from '@salto-io/lowerdash'
import _ from 'lodash'
import { AUTOMATION_TYPE } from '../../constants'
import { JiraConfig } from '../../config/config'

const { isDefined } = values
type Component = {
  component: string
  schemaVersion: number
  type: string
  value: {
    workspaceId?: string
    schemaId?: string
    objectTypeId?: string
  }
}

const hasRelevantComponent = (components: Component[]): boolean =>
  components.some(
    ({ value }) =>
      value !== undefined &&
      (value.workspaceId !== undefined || value.schemaId !== undefined || value.objectTypeId !== undefined),
  )

const getUniqueValues = (components: Component[], key: keyof Component['value']): string[] =>
  [...new Set(components.map(component => component.value?.[key]).filter(isDefined))].sort()

const isComponentChanged = (beforeComponents: Component[], afterComponents: Component[]): boolean => {
  const keys: Array<'workspaceId' | 'schemaId' | 'objectTypeId'> = ['workspaceId', 'schemaId', 'objectTypeId']
  return keys.some(key => !_.isEqual(getUniqueValues(beforeComponents, key), getUniqueValues(afterComponents, key)))
}

export const automationToAssetsValidator: (config: JiraConfig) => ChangeValidator = config => async changes => {
  if (config.fetch.enableJSM && (config.fetch.enableJsmExperimental || config.fetch.enableJSMPremium)) {
    return []
  }
  return changes
    .filter(isInstanceChange)
    .filter(isAdditionOrModificationChange)
    .filter(change => getChangeData(change).elemID.typeName === AUTOMATION_TYPE)
    .filter(change => {
      const instance = getChangeData(change)
      if (isAdditionChange(change)) {
        return hasRelevantComponent(instance.value.components)
      }
      return isComponentChanged(change.data.before.value.components, change.data.after.value.components)
    })
    .map(getChangeData)
    .map(instance => ({
      elemID: instance.elemID,
      severity: 'Warning' as SeverityLevel,
      message: 'Missing Assets support for Automation Linked to Assets Elements.',
      detailedMessage: `The automation '${instance.annotations[CORE_ANNOTATIONS.ALIAS]}', linked to the Assets object, requires the Assets support in Salto. This automation currently uses internal IDs but does not have the Assets support. If you have modified internal IDs, ensure they are accurate in the target environment. Incorrect IDs, without the Assets support, could lead to deployment issues.`,
    }))
}
