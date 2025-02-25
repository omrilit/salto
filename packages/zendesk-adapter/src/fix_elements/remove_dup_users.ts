/*
 * Copyright 2025 Salto Labs Ltd.
 * Licensed under the Salto Terms of Use (the "License");
 * You may not use this file except in compliance with the License.  You may obtain a copy of the License at https://www.salto.io/terms-of-use
 *
 * CERTAIN THIRD PARTY SOFTWARE MAY BE CONTAINED IN PORTIONS OF THE SOFTWARE. See NOTICE FILE AT https://github.com/salto-io/salto/blob/main/NOTICES
 */

import { ChangeError, InstanceElement, isInstanceElement } from '@salto-io/adapter-api'
import { values } from '@salto-io/lowerdash'
import _ from 'lodash'
import { FixElementsHandler } from './types'
import { USER_SEGMENT_TYPE_NAME } from '../constants'

type UsersList = Array<string | number>
type FixedElementResponse = { fixedInstance: InstanceElement; dupUsers: UsersList }

const dupUsersRemovalWarning = (fixedElem: FixedElementResponse): ChangeError => ({
  elemID: fixedElem.fixedInstance.elemID,
  severity: 'Warning',
  message: 'Duplicate usernames in instance fields',
  detailedMessage: `The following usernames appear multiple times: ${fixedElem.dupUsers.join(', ')}.\nIf you continue, the duplicate entries will be removed from the list.\n`,
})

const removeDupUsersFromUserSegment = (instance: InstanceElement): FixedElementResponse | undefined => {
  const users: Array<string | number> = instance.value.added_user_ids || []
  const dupUsers = _.uniq(users.filter((item: string | number, index) => users.indexOf(item) !== index))

  if (_.isEmpty(dupUsers)) {
    return undefined
  }

  const fixedInstance = instance.clone()
  fixedInstance.value.added_user_ids = _.uniq(users)

  return { fixedInstance, dupUsers }
}

const TYPE_NAME_TO_DUP_REMOVER: Record<string, (instance: InstanceElement) => FixedElementResponse | undefined> = {
  [USER_SEGMENT_TYPE_NAME]: removeDupUsersFromUserSegment,
}

const removeDupUsers = (instance: InstanceElement): undefined | FixedElementResponse =>
  TYPE_NAME_TO_DUP_REMOVER[instance.elemID.typeName]?.(instance)

const isRelevantElement = (element: unknown): element is InstanceElement =>
  isInstanceElement(element) && Object.keys(TYPE_NAME_TO_DUP_REMOVER).includes(element.elemID.typeName)

/**
 * This fixer makes sure that there are no duplicate users in the same field
 */
export const removeDupUsersHandler: FixElementsHandler = () => async elements => {
  const fixedElementsWithUserCount = elements.filter(isRelevantElement).map(removeDupUsers).filter(values.isDefined)
  const errors = fixedElementsWithUserCount.map(dupUsersRemovalWarning)

  return {
    fixedElements: fixedElementsWithUserCount.map(({ fixedInstance }) => fixedInstance),
    errors,
  }
}
