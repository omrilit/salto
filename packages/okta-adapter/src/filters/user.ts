/*
 * Copyright 2025 Salto Labs Ltd.
 * Licensed under the Salto Terms of Use (the "License");
 * You may not use this file except in compliance with the License.  You may obtain a copy of the License at https://www.salto.io/terms-of-use
 *
 * CERTAIN THIRD PARTY SOFTWARE MAY BE CONTAINED IN PORTIONS OF THE SOFTWARE. See NOTICE FILE AT https://github.com/salto-io/salto/blob/main/NOTICES
 */
import _ from 'lodash'
import { logger } from '@salto-io/logging'
import { applyFunctionToChangeData, resolvePath, setPath } from '@salto-io/adapter-utils'
import { collections } from '@salto-io/lowerdash'
import { Change, getChangeData, InstanceElement, isInstanceElement, isModificationChange } from '@salto-io/adapter-api'
import { FilterCreator } from '../filter'
import { getUsers, USER_MAPPING, getUsersFromInstances, shouldConvertUserIds } from '../user_utils'

const log = logger(module)
const { awu } = collections.asynciterable
const { makeArray } = collections.array

const isRelevantInstance = (instance: InstanceElement): boolean =>
  Object.keys(USER_MAPPING).includes(instance.elemID.typeName)

const replaceValues = (instance: InstanceElement, mapping: Record<string, string>): void => {
  const paths = USER_MAPPING[instance.elemID.typeName]
  paths.forEach(path => {
    const usersPath = instance.elemID.createNestedID(...path)
    const resolvedPath = resolvePath(instance, usersPath)
    const userValues = makeArray(resolvedPath)
    if (resolvedPath === undefined) {
      return
    }
    const newValues = userValues.map(value => {
      const newValue = Object.prototype.hasOwnProperty.call(mapping, value) ? mapping[value] : undefined
      return newValue ?? value
    })
    setPath(instance, usersPath, _.isArray(resolvedPath) ? newValues : newValues[0])
  })
}

const replaceValuesForChanges = async (
  changes: Change<InstanceElement>[],
  mapping: Record<string, string>,
): Promise<void> => {
  await awu(changes).forEach(async change => {
    await applyFunctionToChangeData<Change<InstanceElement>>(change, instance => {
      replaceValues(instance, mapping)
      return instance
    })
  })
}

/**
 * Replaces user ids with login name, when 'convertUsersIds' config flag is enabled
 */
const filterCreator: FilterCreator = ({ paginator, config, usersPromise, fetchQuery }) => {
  let userIdToLogin: Record<string, string> = {}
  return {
    name: 'usersFilter',
    onFetch: async elements => {
      if (!shouldConvertUserIds(fetchQuery, config)) {
        log.debug('Converting user ids was disabled (onFetch)')
        return
      }
      const users = await usersPromise
      if (!users || _.isEmpty(users)) {
        log.warn('Could not find any users (onFetch)')
        return
      }
      const mapping = Object.fromEntries(users.map(user => [user.id, user.profile.login]))
      const instances = elements.filter(isInstanceElement).filter(isRelevantInstance)
      instances.forEach(instance => {
        replaceValues(instance, mapping)
      })
    },
    preDeploy: async (changes: Change<InstanceElement>[]) => {
      if (!shouldConvertUserIds(fetchQuery, config)) {
        log.debug('Converting user ids was disabled (preDeploy)')
        return
      }

      // for modification change, get users from both before and after values
      const usersToReplace = getUsersFromInstances(
        changes.flatMap(change =>
          isModificationChange(change) ? [change.data.before, change.data.after] : [getChangeData(change)],
        ),
      )

      if (_.isEmpty(usersToReplace)) {
        return
      }
      const users = await getUsers(paginator, { userIds: usersToReplace, property: 'profile.login' })
      if (_.isEmpty(users)) {
        log.warn('Could not find any users (preDeploy)')
        return
      }

      userIdToLogin = Object.fromEntries(users.map(user => [user.id, user.profile.login]))
      const loginToUserId = Object.fromEntries(users.map(user => [user.profile.login, user.id])) as Record<
        string,
        string
      >
      await replaceValuesForChanges(changes, loginToUserId)
    },
    onDeploy: async (changes: Change<InstanceElement>[]) => {
      if (!shouldConvertUserIds(fetchQuery, config)) {
        log.debug('Converting user ids was disabled (onDeploy)')
        return
      }
      const relevantChanges = changes.filter(change => isRelevantInstance(getChangeData(change)))
      if (_.isEmpty(relevantChanges)) {
        return
      }
      await replaceValuesForChanges(changes, userIdToLogin)
    },
  }
}

export default filterCreator
