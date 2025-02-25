/*
 * Copyright 2025 Salto Labs Ltd.
 * Licensed under the Salto Terms of Use (the "License");
 * You may not use this file except in compliance with the License.  You may obtain a copy of the License at https://www.salto.io/terms-of-use
 *
 * CERTAIN THIRD PARTY SOFTWARE MAY BE CONTAINED IN PORTIONS OF THE SOFTWARE. See NOTICE FILE AT https://github.com/salto-io/salto/blob/main/NOTICES
 */
import { ElemID, InstanceElement, ObjectType } from '@salto-io/adapter-api'
import {
  INSTANCE_FULL_NAME_FIELD,
  INTERNAL_ID_FIELD,
  METADATA_TYPE,
  PROFILE_METADATA_TYPE,
  RECORDS_PATH,
  SALESFORCE,
} from '../../src/constants'
import filterCreator from '../../src/filters/profile_paths'
import { FilterResult } from '../../src/filter'
import mockClient from '../client'
import { mockQueryResult } from '../connection'
import { defaultFilterContext } from '../utils'
import { FilterWith } from './mocks'

describe('profile paths filter', () => {
  const { connection, client } = mockClient()
  const filter = filterCreator({
    client,
    config: defaultFilterContext,
  }) as FilterWith<'onFetch'>
  const origInstance = new InstanceElement(
    'test',
    new ObjectType({ elemID: new ElemID(SALESFORCE, 'instanceType') }),
    undefined,
    [SALESFORCE, RECORDS_PATH, PROFILE_METADATA_TYPE, 'test'],
  )

  let instance: InstanceElement
  beforeEach(() => {
    jest.clearAllMocks()
    instance = origInstance.clone()
    connection.query.mockResolvedValue(
      mockQueryResult({
        records: [
          { Id: 'PlatformPortalInternalId', Name: 'Authenticated Website' },
          { Id: 'AdminInternalId', Name: 'System Administrator' },
        ],
        totalSize: 2,
      }),
    )
  })

  it('should not run query when we do not fetch profiles', async () => {
    await filter.onFetch([])
    expect(connection.query).not.toHaveBeenCalled()
  })

  it('should replace profile instance path', async () => {
    ;(await instance.getType()).annotations[METADATA_TYPE] = PROFILE_METADATA_TYPE
    instance.value[INSTANCE_FULL_NAME_FIELD] = 'Admin'
    instance.value[INTERNAL_ID_FIELD] = 'AdminInternalId'
    await filter.onFetch([instance])
    expect(instance.path).toEqual([SALESFORCE, RECORDS_PATH, PROFILE_METADATA_TYPE, 'System_Administrator'])
  })

  it('should replace instance path for PlatformPortal Profile', async () => {
    ;(await instance.getType()).annotations[METADATA_TYPE] = PROFILE_METADATA_TYPE
    instance.value[INSTANCE_FULL_NAME_FIELD] = 'PlatformPortal'
    instance.value[INTERNAL_ID_FIELD] = 'PlatformPortalInternalId'
    await filter.onFetch([instance])
    expect(instance.path).toEqual([SALESFORCE, RECORDS_PATH, PROFILE_METADATA_TYPE, 'Authenticated_Website2'])
  })

  it('should not replace instance path for other metadataTypes', async () => {
    ;(await instance.getType()).annotations[METADATA_TYPE] = 'some other metadataType'
    instance.value[INSTANCE_FULL_NAME_FIELD] = 'Admin'
    instance.value[INTERNAL_ID_FIELD] = 'AdminInternalId'
    await filter.onFetch([instance])
    expect(instance.path).toEqual(origInstance.path)
  })

  it('should not replace instance path if it has no path', async () => {
    ;(await instance.getType()).annotations[METADATA_TYPE] = PROFILE_METADATA_TYPE
    instance.value[INSTANCE_FULL_NAME_FIELD] = 'Admin'
    instance.value[INTERNAL_ID_FIELD] = 'AdminInternalId'
    instance.path = undefined
    await filter.onFetch([instance])
    expect(instance.path).toBeUndefined()
  })
  describe('when feature is throwing an error', () => {
    it('should return a warning', async () => {
      ;(await instance.getType()).annotations[METADATA_TYPE] = PROFILE_METADATA_TYPE
      instance.value[INSTANCE_FULL_NAME_FIELD] = 'PlatformPortal'
      instance.value[INTERNAL_ID_FIELD] = 'PlatformPortalInternalId'
      connection.query.mockImplementation(() => {
        throw new Error()
      })
      const res = (await filter.onFetch([instance])) as FilterResult
      const err = res.errors ?? []
      expect(res.errors).toHaveLength(1)
      expect(err[0]).toEqual({
        severity: 'Warning',
        message: 'Other issues',
        detailedMessage:
          'Failed to update the NaCl file names for some of your salesforce profiles. Therefore, profiles NaCl file names might differ from their display names in some cases.',
      })
    })
  })
})
