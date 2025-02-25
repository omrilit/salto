/*
 * Copyright 2025 Salto Labs Ltd.
 * Licensed under the Salto Terms of Use (the "License");
 * You may not use this file except in compliance with the License.  You may obtain a copy of the License at https://www.salto.io/terms-of-use
 *
 * CERTAIN THIRD PARTY SOFTWARE MAY BE CONTAINED IN PORTIONS OF THE SOFTWARE. See NOTICE FILE AT https://github.com/salto-io/salto/blob/main/NOTICES
 */
import _ from 'lodash'
import {
  BuiltinTypes,
  ElemID,
  getChangeData,
  InstanceElement,
  isInstanceElement,
  ModificationChange,
  ObjectType,
  TopLevelElement,
} from '@salto-io/adapter-api'
import { NETSUITE, SELECT_OPTION, SETTINGS_PATH, TYPES_PATH } from './constants'
import { SUITEAPP_CONFIG_TYPES_TO_TYPE_NAMES, DeployResult } from './types'
import { NetsuiteQuery } from './config/query'
import {
  ConfigRecord,
  isSuccessSetConfig,
  SetConfigRecordsValuesResult,
  SetConfigType,
} from './client/suiteapp_client/types'

export const getConfigTypes = (): ObjectType[] => [
  new ObjectType({
    elemID: new ElemID(NETSUITE, SELECT_OPTION),
    fields: {
      text: { refType: BuiltinTypes.STRING },
      value: { refType: BuiltinTypes.UNKNOWN },
    },
    path: [NETSUITE, TYPES_PATH, SELECT_OPTION],
  }),
]

export const toConfigElements = (configRecords: ConfigRecord[], fetchQuery: NetsuiteQuery): TopLevelElement[] => {
  const elements = configRecords.flatMap(configRecord => {
    const typeName = SUITEAPP_CONFIG_TYPES_TO_TYPE_NAMES[configRecord.configType]
    const configRecordType = new ObjectType({
      elemID: new ElemID(NETSUITE, typeName),
      annotations: { fieldsDef: configRecord.fieldsDef },
      isSettings: true,
      path: [NETSUITE, TYPES_PATH, typeName],
    })
    const instance = new InstanceElement(ElemID.CONFIG_NAME, configRecordType, { configRecord }, [
      NETSUITE,
      SETTINGS_PATH,
      configRecordType.elemID.name,
    ])
    return [configRecordType, instance]
  })

  const [instances, types] = _.partition(elements, isInstanceElement)
  const matchingInstances = instances.filter(instance => fetchQuery.isTypeMatch(instance.elemID.typeName))
  return [...types, ...matchingInstances]
}

export const toSetConfigTypes = (changes: ModificationChange<InstanceElement>[]): SetConfigType[] =>
  changes.map(change => {
    const { before, after } = change.data
    const items = Object.entries(after.value)
      .filter(([fieldId, afterValue]) => afterValue !== before.value[fieldId])
      .map(([fieldId, afterValue]) => ({ fieldId, value: afterValue }))
    return { configType: after.value.configType, items }
  })

export const toConfigDeployResult = (
  changes: ModificationChange<InstanceElement>[],
  results: SetConfigRecordsValuesResult,
): DeployResult => {
  if (!_.isArray(results)) {
    return {
      appliedChanges: [],
      errors: [
        {
          message: results.errorMessage,
          detailedMessage: results.errorMessage,
          severity: 'Error',
        },
      ],
    }
  }

  const resultsConfigTypes = new Set(results.map(res => res.configType))
  const [success, fail] = _.partition(results, isSuccessSetConfig)
  const configTypeToChange = _(changes)
    .keyBy(change => getChangeData(change).value.configType)
    .value()

  const appliedChanges = success.map(item => configTypeToChange[item.configType])

  const internalErrorMessage = 'Failed to deploy instance due to internal server error'
  const missingResultsError = changes
    .map(getChangeData)
    .filter(instance => !resultsConfigTypes.has(instance.value.configType))
    .map(instance => ({
      elemID: instance.elemID,
      message: internalErrorMessage,
      detailedMessage: internalErrorMessage,
      severity: 'Error' as const,
    }))

  const failResultsErrors = fail.map(item => {
    const message = `${item.configType}: ${item.errorMessage}`
    return {
      elemID: getChangeData(configTypeToChange[item.configType]).elemID,
      message,
      detailedMessage: message,
      severity: 'Error' as const,
    }
  })
  return { appliedChanges, errors: missingResultsError.concat(failResultsErrors) }
}
