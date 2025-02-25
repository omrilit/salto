/*
 * Copyright 2025 Salto Labs Ltd.
 * Licensed under the Salto Terms of Use (the "License");
 * You may not use this file except in compliance with the License.  You may obtain a copy of the License at https://www.salto.io/terms-of-use
 *
 * CERTAIN THIRD PARTY SOFTWARE MAY BE CONTAINED IN PORTIONS OF THE SOFTWARE. See NOTICE FILE AT https://github.com/salto-io/salto/blob/main/NOTICES
 */
import { Values } from '@salto-io/adapter-api'

export const createDashboardValues = (name: string): Values => ({
  name,
  description: 'desc!',
  layout: 'AAA',
  sharePermissions: [{ type: 'authenticated' }],
})

export const createGadget1Values = (name: string): Values => ({
  moduleKey: 'com.atlassian.jira.gadgets:bubble-chart-dashboard-item',
  color: 'blue',
  position: {
    row: 0,
    column: 2,
  },
  title: `${name}-1`,
  properties: [
    {
      key: 'bubbleType',
      value: 'participants',
    },
    {
      key: 'id',
      value: 10024,
    },
    {
      key: 'isConfigured',
      value: true,
    },
    {
      key: 'name',
      value: 'AlonCompanyProject',
    },
    {
      key: 'recentCommentsPeriod',
      value: 7,
    },
    {
      key: 'refresh',
      value: 15,
    },
    {
      key: 'type',
      value: 'project',
    },
    {
      key: 'useLogarithmicScale',
      value: false,
    },
    {
      key: 'useRelativeColoring',
      value: true,
    },
  ],
})

export const createGadget2Values = (name: string): Values => ({
  moduleKey: 'com.atlassian.jira.gadgets:bubble-chart-dashboard-item',
  color: 'blue',
  position: {
    row: 1,
    column: 2,
  },
  title: `${name}-2`,
  properties: [
    {
      key: 'bubbleType',
      value: 'participants',
    },
    {
      key: 'id',
      value: 10024,
    },
    {
      key: 'isConfigured',
      value: true,
    },
    {
      key: 'name',
      value: 'AlonCompanyProject',
    },
    {
      key: 'recentCommentsPeriod',
      value: 7,
    },
    {
      key: 'refresh',
      value: 15,
    },
    {
      key: 'type',
      value: 'project',
    },
    {
      key: 'useLogarithmicScale',
      value: false,
    },
    {
      key: 'useRelativeColoring',
      value: true,
    },
  ],
})
