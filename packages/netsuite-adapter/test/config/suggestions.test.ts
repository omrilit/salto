/*
 * Copyright 2025 Salto Labs Ltd.
 * Licensed under the Salto Terms of Use (the "License");
 * You may not use this file except in compliance with the License.  You may obtain a copy of the License at https://www.salto.io/terms-of-use
 *
 * CERTAIN THIRD PARTY SOFTWARE MAY BE CONTAINED IN PORTIONS OF THE SOFTWARE. See NOTICE FILE AT https://github.com/salto-io/salto/blob/main/NOTICES
 */
import _ from 'lodash'
import { InstanceElement, ElemID } from '@salto-io/adapter-api'
import { formatConfigSuggestionsReasons } from '@salto-io/adapter-utils'
import { fullFetchConfig, fullQueryParams } from '../../src/config/config_creator'
import {
  toLargeSizeFoldersExcludedMessage,
  toLargeTypesExcludedMessage,
  STOP_MANAGING_ITEMS_MSG,
  getConfigFromConfigChanges,
  ALIGNED_INACTIVE_CRITERIAS,
  toRemovedDeprecatedConfigsMessage,
  toLargeFilesCountFoldersExcludedMessage,
} from '../../src/config/suggestions'
import { NetsuiteQueryParameters, fetchDefault, configType, NetsuiteConfig } from '../../src/config/types'
import { INACTIVE_FIELDS } from '../../src/constants'

describe('netsuite config suggestions', () => {
  const skipList: NetsuiteQueryParameters = {
    types: {
      testAll: ['.*'],
      testExistingPartial: ['scriptid1', 'scriptid2'],
    },
    filePaths: ['SomeRegex'],
  }

  const currentConfigWithSkipList = {
    skipList,
    client: {
      sdfConcurrencyLimit: 2,
      fetchTypeTimeoutInMinutes: 15,
      maxItemsInImportObjectsRequest: 10,
    },
  }
  const currentConfigWithFetch = {
    fetch: {
      include: fetchDefault.include,
      exclude: {
        types: [
          { name: 'testAll', ids: ['.*'] },
          { name: 'testExistingPartial', ids: ['scriptid1', 'scriptid2'] },
          { name: '.*', criteria: { isInactive: true } },
        ],
        fileCabinet: ['SomeRegex'],
      },
    },
    client: {
      sdfConcurrencyLimit: 2,
      fetchTypeTimeoutInMinutes: 15,
      maxItemsInImportObjectsRequest: 10,
    },
  }
  const newFailedFilePath = '/path/to/file'
  const newLargeFolderPath = '/largeFolder/'
  const newLargeFilesCountFolderPath = '/largeFilesCountFolder/'
  const newLargeFolderExclusion = `^${newLargeFolderPath}.*`
  const newLargeFilesCountFolderExclusion = `^${newLargeFilesCountFolderPath}.*`

  const suggestedSkipListTypes = {
    testExistingPartial: ['scriptid3', 'scriptid4'],
    testNew: ['scriptid5', 'scriptid6'],
  }

  it('should return undefined when having no currentConfig suggestions', () => {
    expect(
      getConfigFromConfigChanges(
        {
          failedToFetchAllAtOnce: false,
          failedFilePaths: {
            lockedError: [],
            otherError: [],
            largeSizeFoldersError: [],
            largeFilesCountFoldersError: [],
          },
          failedTypes: { lockedError: {}, unexpectedError: {}, excludedTypes: [] },
          failedCustomRecords: [],
        },
        currentConfigWithFetch,
      ),
    ).toBeUndefined()
  })

  it('should return updated currentConfig with defined values when having suggestions and the currentConfig is empty', () => {
    const lockedFiles = ['lockedFile']
    const lockedTypes = { lockedType: ['lockedInstance'] }
    const configFromConfigChanges = getConfigFromConfigChanges(
      {
        failedToFetchAllAtOnce: true,
        failedFilePaths: {
          lockedError: lockedFiles,
          otherError: [newFailedFilePath],
          largeSizeFoldersError: [],
          largeFilesCountFoldersError: [],
        },
        failedTypes: { lockedError: lockedTypes, unexpectedError: suggestedSkipListTypes, excludedTypes: [] },
        failedCustomRecords: [],
      },
      { fetch: fullFetchConfig() },
    )?.config as InstanceElement[]
    expect(
      configFromConfigChanges[0].isEqual(
        new InstanceElement(ElemID.CONFIG_NAME, configType, {
          fetch: {
            include: fullQueryParams(),
            exclude: {
              types: Object.entries(suggestedSkipListTypes).map(([name, ids]) => ({ name, ids })),
              fileCabinet: [newFailedFilePath],
            },
          },
          client: {
            fetchAllTypesAtOnce: false,
          },
        }),
      ),
    ).toBe(true)

    expect(
      configFromConfigChanges[1].isEqual(
        new InstanceElement(ElemID.CONFIG_NAME, configType, {
          fetch: {
            lockedElementsToExclude: {
              types: Object.entries(lockedTypes).map(([name, ids]) => ({ name, ids })),
              fileCabinet: lockedFiles,
            },
          },
        }),
      ),
    ).toBe(true)

    expect(configFromConfigChanges[1].path).toEqual(['lockedElements'])
  })

  it('should return updated currentConfig when having suggestions and the currentConfig has values', () => {
    const newExclude = {
      types: [
        { name: 'testAll', ids: ['.*'] },
        { name: 'testExistingPartial', ids: ['scriptid1', 'scriptid2', 'scriptid3', 'scriptid4'] },
        { name: '.*', criteria: { isInactive: true } },
        { name: 'testNew', ids: ['scriptid5', 'scriptid6'] },
        { name: 'excludedTypeTest' },
      ],
      fileCabinet: [
        'SomeRegex',
        _.escapeRegExp(newFailedFilePath),
        newLargeFolderExclusion,
        newLargeFilesCountFolderExclusion,
      ],
      customRecords: [{ name: 'excludedCustomRecord' }],
    }
    const configChange = getConfigFromConfigChanges(
      {
        failedToFetchAllAtOnce: true,
        failedFilePaths: {
          lockedError: [],
          otherError: [newFailedFilePath],
          largeSizeFoldersError: [newLargeFolderPath],
          largeFilesCountFoldersError: [newLargeFilesCountFolderPath],
        },
        failedTypes: { lockedError: {}, unexpectedError: suggestedSkipListTypes, excludedTypes: ['excludedTypeTest'] },
        failedCustomRecords: ['excludedCustomRecord'],
      },
      currentConfigWithFetch,
    )
    expect(
      configChange?.config[0].isEqual(
        new InstanceElement(ElemID.CONFIG_NAME, configType, {
          fetch: {
            include: currentConfigWithFetch.fetch.include,
            exclude: newExclude,
          },
          client: {
            fetchAllTypesAtOnce: false,
            fetchTypeTimeoutInMinutes: 15,
            maxItemsInImportObjectsRequest: 10,
            sdfConcurrencyLimit: 2,
          },
        }),
      ),
    ).toBe(true)

    expect(configChange?.message).toBe(
      formatConfigSuggestionsReasons([
        STOP_MANAGING_ITEMS_MSG,
        toLargeSizeFoldersExcludedMessage([newLargeFolderPath]),
        toLargeFilesCountFoldersExcludedMessage([newLargeFilesCountFolderPath]),
        toLargeTypesExcludedMessage(['excludedTypeTest', 'excludedCustomRecord']),
      ]),
    )
  })

  it('should combine configuration messages when needed', () => {
    const newSkipList = _.cloneDeep(skipList)
    newSkipList.types = { ...newSkipList.types, someType: ['.*'] }
    newSkipList.filePaths?.push('.*someRegex.*')
    const config = {
      ...currentConfigWithSkipList,
      typesToSkip: ['someType'],
      filePathRegexSkipList: ['someRegex'],
      fileCabinet: ['SomeRegex', _.escapeRegExp(newFailedFilePath), newLargeFolderExclusion],
      fetch: fullFetchConfig(),
    }

    const configChange = getConfigFromConfigChanges(
      {
        failedToFetchAllAtOnce: false,
        failedFilePaths: {
          lockedError: [],
          otherError: [newFailedFilePath],
          largeSizeFoldersError: [newLargeFolderPath],
          largeFilesCountFoldersError: [newLargeFilesCountFolderPath],
        },
        failedTypes: { lockedError: {}, unexpectedError: {}, excludedTypes: [] },
        failedCustomRecords: [],
      },
      config,
    )

    expect(configChange?.message).toBe(
      formatConfigSuggestionsReasons([
        STOP_MANAGING_ITEMS_MSG,
        toLargeSizeFoldersExcludedMessage([newLargeFolderPath]),
        toLargeFilesCountFoldersExcludedMessage([newLargeFilesCountFolderPath]),
      ]),
    )
  })

  it('should align inactive fields', () => {
    const config: NetsuiteConfig = {
      fetch: fullFetchConfig(),
    }
    config.fetch.exclude.types = Object.values(INACTIVE_FIELDS).map(fieldName => ({
      name: '.*',
      criteria: {
        [fieldName]: true,
      },
    }))
    const configChange = getConfigFromConfigChanges(
      {
        failedToFetchAllAtOnce: false,
        failedFilePaths: {
          lockedError: [],
          otherError: [],
          largeSizeFoldersError: [],
          largeFilesCountFoldersError: [],
        },
        failedTypes: { lockedError: {}, unexpectedError: {}, excludedTypes: [] },
        failedCustomRecords: [],
      },
      config,
    )
    expect(configChange?.config[0].value).toEqual({
      fetch: {
        include: fullQueryParams(),
        exclude: {
          types: [
            {
              name: '.*',
              criteria: {
                isInactive: true,
              },
            },
          ],
          fileCabinet: [],
        },
      },
    })
    expect(configChange?.message).toMatch(ALIGNED_INACTIVE_CRITERIAS)
  })

  it('should remove deprecated configs', () => {
    const config: NetsuiteConfig = {
      fetch: fullFetchConfig(),
      suiteAppClient: {},
    }
    Object.assign(config.fetch, { skipResolvingAccountSpecificValuesToTypes: [] })
    Object.assign(config.suiteAppClient ?? {}, { maxRecordsPerSuiteQLTable: [] })
    Object.assign(config, { useChangesDetection: true })

    const configChange = getConfigFromConfigChanges(
      {
        failedToFetchAllAtOnce: false,
        failedFilePaths: {
          lockedError: [],
          otherError: [],
          largeSizeFoldersError: [],
          largeFilesCountFoldersError: [],
        },
        failedTypes: { lockedError: {}, unexpectedError: {}, excludedTypes: [] },
        failedCustomRecords: [],
      },
      config,
    )

    expect(configChange?.config[0].value).toEqual({
      fetch: fullFetchConfig(),
      suiteAppClient: {},
    })
    expect(configChange?.message).toMatch(
      toRemovedDeprecatedConfigsMessage([
        'fetch.skipResolvingAccountSpecificValuesToTypes',
        'suiteAppClient.maxRecordsPerSuiteQLTable',
        'useChangesDetection',
      ]),
    )
  })
})
