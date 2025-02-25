/*
 * Copyright 2025 Salto Labs Ltd.
 * Licensed under the Salto Terms of Use (the "License");
 * You may not use this file except in compliance with the License.  You may obtain a copy of the License at https://www.salto.io/terms-of-use
 *
 * CERTAIN THIRD PARTY SOFTWARE MAY BE CONTAINED IN PORTIONS OF THE SOFTWARE. See NOTICE FILE AT https://github.com/salto-io/salto/blob/main/NOTICES
 */

import {
  AdditionChange,
  Change,
  InstanceElement,
  ModificationChange,
  getChangeData,
  isAdditionChange,
  isInstanceChange,
  isRemovalChange,
} from '@salto-io/adapter-api'
import { getParent } from '@salto-io/adapter-utils'
import _ from 'lodash'
import { deployChanges } from '../deployment/standard_deployment'
import { FilterCreator } from '../filter'
import { CONTENT_TYPE_HEADER, JSON_CONTENT_TYPE, PORTAL_SETTINGS_TYPE_NAME } from '../constants'
import JiraClient from '../client/client'

const deployPortalSettings = async (
  change: AdditionChange<InstanceElement> | ModificationChange<InstanceElement>,
  client: JiraClient,
): Promise<void> => {
  const portalSettings = getChangeData(change)
  const parent = getParent(portalSettings)
  const nameUrl = `/rest/servicedesk/1/servicedesk-data/${parent.value.key}/name`
  if (isAdditionChange(change) || change.data.before.value.name !== change.data.after.value.name) {
    await client.put({
      url: nameUrl,
      data: { name: portalSettings.value.name },
    })
  }
  if (isAdditionChange(change) || change.data.before.value.description !== change.data.after.value.description) {
    await client.put({
      url: `/rest/servicedesk/1/servicedesk-data/${parent.value.key}/desc`,
      data: { description: portalSettings.value.description },
    })
  }
  if (
    isAdditionChange(change) ||
    change.data.before.value.announcementSettings?.canAgentsManagePortalAnnouncement !==
      change.data.after.value.announcementSettings?.canAgentsManagePortalAnnouncement
  ) {
    if (change.data.after.value.announcementSettings?.canAgentsManagePortalAnnouncement === true) {
      await client.put({
        url: `/rest/servicedesk/1/${parent.value.key}/settings/agent-announcements/enable`,
        data: null,
        headers: { [CONTENT_TYPE_HEADER]: JSON_CONTENT_TYPE },
      })
    } else {
      await client.put({
        url: `/rest/servicedesk/1/${parent.value.key}/settings/agent-announcements/disable`,
        data: null,
        headers: { [CONTENT_TYPE_HEADER]: JSON_CONTENT_TYPE },
      })
    }
  }
}

/*
 * This filter is responsible for deploying portal settings because each attribute
 * of the portal settings is deployed to a different endpoint.
 */
const filter: FilterCreator = ({ config, client }) => ({
  name: 'portalSettingsFilter',
  deploy: async changes => {
    if (!config.fetch.enableJSM) {
      return {
        deployResult: { appliedChanges: [], errors: [] },
        leftoverChanges: changes,
      }
    }
    const [portalChanges, leftoverChanges] = _.partition(
      changes,
      (change): change is Change<InstanceElement> =>
        isInstanceChange(change) && getChangeData(change).elemID.typeName === PORTAL_SETTINGS_TYPE_NAME,
    )
    const deployResult = await deployChanges(portalChanges, async change => {
      if (isRemovalChange(change)) {
        return undefined
      }
      return deployPortalSettings(change, client)
    })

    return {
      leftoverChanges,
      deployResult,
    }
  },
})

export default filter
