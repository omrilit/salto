/*
 * Copyright 2025 Salto Labs Ltd.
 * Licensed under the Salto Terms of Use (the "License");
 * You may not use this file except in compliance with the License.  You may obtain a copy of the License at https://www.salto.io/terms-of-use
 *
 * CERTAIN THIRD PARTY SOFTWARE MAY BE CONTAINED IN PORTIONS OF THE SOFTWARE. See NOTICE FILE AT https://github.com/salto-io/salto/blob/main/NOTICES
 */
import _ from 'lodash'
import { ChangeValidator, getChangeData, isInstanceChange, isRemovalChange } from '@salto-io/adapter-api'
import { client as clientUtils } from '@salto-io/adapter-components'
import { getUsers } from '../user_utils'
import { paginate } from '../client/pagination'
import ZendeskClient from '../client/client'
import { CUSTOM_ROLE_TYPE_NAME } from '../constants'
import { ZendeskFetchConfig } from '../user_config'

const { createPaginator } = clientUtils

/*
 * Checks that no user with agent role is associated with the removed custom_role
 *
 */
export const customRoleRemovalValidator: (client: ZendeskClient, fetchConfig: ZendeskFetchConfig) => ChangeValidator =
  (client, fetchConfig) => async changes => {
    const relevantInstances = changes
      .filter(isRemovalChange)
      .filter(isInstanceChange)
      .filter(change => getChangeData(change).elemID.typeName === CUSTOM_ROLE_TYPE_NAME)
      .map(getChangeData)

    if (_.isEmpty(relevantInstances)) {
      return []
    }

    const paginator = createPaginator({
      client,
      paginationFuncCreator: paginate,
    })
    const { users } = await getUsers(paginator, fetchConfig.resolveUserIDs)
    if (_.isEmpty(users)) {
      return []
    }
    const agentUsers = users.filter(user => user.role === 'agent' && user.custom_role_id !== undefined)
    const agentsByCustomRoleId = _.groupBy(agentUsers, agentUser => agentUser.custom_role_id)
    return relevantInstances
      .filter(customRoleInstance => agentsByCustomRoleId[customRoleInstance.value.id] !== undefined)
      .map(customRoleInstance => {
        const relatedAgents = agentsByCustomRoleId[customRoleInstance.value.id]
        return {
          elemID: customRoleInstance.elemID,
          severity: 'Error',
          message: 'Cannot remove a custom role with associated agents',
          detailedMessage: `${relatedAgents.length} agents are associated with this role (partial list): [${relatedAgents
            .map(agent => agent.email)
            .slice(0, 10)
            .join(', ')}].\nPlease disconnect the agents from the role in the Zendesk UI before deploying this change.`,
        }
      })
  }
