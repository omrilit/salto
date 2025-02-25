/*
 * Copyright 2025 Salto Labs Ltd.
 * Licensed under the Salto Terms of Use (the "License");
 * You may not use this file except in compliance with the License.  You may obtain a copy of the License at https://www.salto.io/terms-of-use
 *
 * CERTAIN THIRD PARTY SOFTWARE MAY BE CONTAINED IN PORTIONS OF THE SOFTWARE. See NOTICE FILE AT https://github.com/salto-io/salto/blob/main/NOTICES
 */
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import { ObjectType, InstanceElement, OAuthMethod } from '@salto-io/adapter-api'
import { buildElementsSourceFromElements } from '@salto-io/adapter-utils'
import { adapter, createUrlFromUserInput } from '../src/adapter_creator'
import { oauthAccessTokenCredentialsType, basicCredentialsType } from '../src/auth'
import { configType } from '../src/config'
import { ZENDESK } from '../src/constants'
import * as connection from '../src/client/connection'

describe('adapter creator', () => {
  let mockAxiosAdapter: MockAdapter
  beforeEach(() => {
    mockAxiosAdapter = new MockAdapter(axios, { delayResponse: 1, onNoMatch: 'throwException' })
  })

  afterEach(() => {
    mockAxiosAdapter.restore()
  })

  it('should return a config containing the right parameters', () => {
    const config = adapter.configType as ObjectType
    expect(Object.keys(config?.fields)).toEqual(Object.keys(configType.fields))
  })
  it('should use username+token as the basic auth method', () => {
    expect(Object.keys(adapter.authenticationMethods.basic.credentialsType.fields)).toEqual(
      Object.keys(basicCredentialsType.fields),
    )
  })
  it('should use accessToken as the OAuth auth method', () => {
    expect(adapter.authenticationMethods.oauth).toBeDefined()
    expect(Object.keys((adapter.authenticationMethods.oauth as OAuthMethod).credentialsType.fields)).toEqual(
      Object.keys(oauthAccessTokenCredentialsType.fields),
    )
  })
  it('should return oauth params - only accessToken and subdomain', async () => {
    expect(
      await (adapter.authenticationMethods.oauth as OAuthMethod).createFromOauthResponse(
        {
          clientId: 'client',
          port: 8080,
          subdomain: 'abc',
        },
        {
          fields: {
            accessToken: 'token',
          },
        },
      ),
    ).toEqual({
      subdomain: 'abc',
      accessToken: 'token',
    })
  })
  it('should return the zendesk adapter', () => {
    // with basic auth method
    expect(
      adapter.operations({
        credentials: new InstanceElement(ZENDESK, adapter.authenticationMethods.basic.credentialsType),
        config: new InstanceElement(ZENDESK, adapter.configType as ObjectType, {
          fetch: {
            include: [
              {
                type: '.*',
              },
            ],
            exclude: [],
          },
          apiDefinitions: {
            types: {},
          },
        }),
        elementsSource: buildElementsSourceFromElements([]),
      }),
    ).toBeDefined()

    // with OAuth auth method
    expect(
      adapter.operations({
        credentials: new InstanceElement(ZENDESK, adapter.authenticationMethods.oauth?.credentialsType as ObjectType, {
          authType: 'oauth',
          accessToken: 'token',
          subdomain: 'abc',
        }),
        config: new InstanceElement(ZENDESK, adapter.configType as ObjectType, {
          fetch: {
            include: [
              {
                type: '.*',
              },
            ],
            exclude: [],
          },
          apiDefinitions: {
            types: {},
          },
        }),
        elementsSource: buildElementsSourceFromElements([]),
      }),
    ).toBeDefined()
  })

  it('should ignore unexpected configuration values', () => {
    expect(
      adapter.operations({
        credentials: new InstanceElement(ZENDESK, adapter.authenticationMethods.basic.credentialsType),
        config: new InstanceElement(ZENDESK, adapter.configType as ObjectType, {
          fetch: {
            include: [
              {
                type: '.*',
              },
            ],
            exclude: [],
          },
          apiDefinitions: {
            types: {},
          },
          somethingElse: {},
        }),
        elementsSource: buildElementsSourceFromElements([]),
      }),
    ).toBeDefined()
  })

  it('should throw error when deploy config is invalid', () => {
    expect(() =>
      adapter.operations({
        credentials: new InstanceElement(ZENDESK, adapter.authenticationMethods.basic.credentialsType),
        config: new InstanceElement(ZENDESK, adapter.configType as ObjectType, {
          fetch: { include: [{ type: '.*' }], exclude: [] },
          apiDefinitions: {
            types: { c: { request: { url: '/api/v2/c' } } },
            supportedTypes: { c: ['c'] },
          },
          deploy: {
            defaultMissingUserFallback: 'invalid@user',
          },
        }),
        elementsSource: buildElementsSourceFromElements([]),
      }),
    ).toThrow(
      new Error(
        'Invalid user value in deploy.defaultMissingUserFallback: invalid@user. Value can be either ##DEPLOYER## or a valid user name',
      ),
    )
    expect(() =>
      adapter.operations({
        credentials: new InstanceElement(ZENDESK, adapter.authenticationMethods.basic.credentialsType),
        config: new InstanceElement(ZENDESK, adapter.configType as ObjectType, {
          fetch: { include: [{ type: '.*' }], exclude: [] },
          apiDefinitions: {
            types: { c: { request: { url: '/api/v2/c' } } },
            supportedTypes: { c: ['c'] },
          },
          deploy: {
            defaultMissingUserFallback: '#DEPLOYER#',
          },
        }),
        elementsSource: buildElementsSourceFromElements([]),
      }),
    ).toThrow(
      new Error(
        'Invalid user value in deploy.defaultMissingUserFallback: #DEPLOYER#. Value can be either ##DEPLOYER## or a valid user name',
      ),
    )
  })

  it('should throw error on inconsistent configuration between fetch and apiDefinitions', () => {
    expect(() =>
      adapter.operations({
        credentials: new InstanceElement(ZENDESK, adapter.authenticationMethods.basic.credentialsType),
        config: new InstanceElement(ZENDESK, adapter.configType as ObjectType, {
          fetch: {
            include: [{ type: 'a' }, { type: 'b' }],
            exclude: [],
          },
          apiDefinitions: {
            types: {
              c: {
                request: {
                  url: '/api/v2/c',
                },
              },
            },
            supportedTypes: {
              a: ['a'],
              b: ['b'],
            },
          },
        }),
        elementsSource: buildElementsSourceFromElements([]),
      }),
    ).toThrow(new Error('Invalid type names in fetch: a,b does not match any of the supported types.'))
  })

  it('should return right url for oauth request', () => {
    expect(
      createUrlFromUserInput({
        subdomain: 'abc',
        port: 8080,
        clientId: 'client',
      }),
    ).toEqual(
      'https://abc.zendesk.com/oauth/authorizations/new?response_type=token&redirect_uri=http://localhost:8080&client_id=client&scope=read%20write',
    )

    expect(
      createUrlFromUserInput({
        subdomain: 'abc',
        domain: 'zendesk1.org',
        port: 8080,
        clientId: 'client',
      }),
    ).toEqual(
      'https://abc.zendesk1.org/oauth/authorizations/new?response_type=token&redirect_uri=http://localhost:8080&client_id=client&scope=read%20write',
    )
    expect(
      createUrlFromUserInput({
        subdomain: 'abc',
        domain: '',
        port: 8080,
        clientId: 'client',
      }),
    ).toEqual(
      'https://abc.zendesk.com/oauth/authorizations/new?response_type=token&redirect_uri=http://localhost:8080&client_id=client&scope=read%20write',
    )
    expect(
      createUrlFromUserInput({
        subdomain: 'abc',
        domain: undefined,
        port: 8080,
        clientId: 'client',
      }),
    ).toEqual(
      'https://abc.zendesk.com/oauth/authorizations/new?response_type=token&redirect_uri=http://localhost:8080&client_id=client&scope=read%20write',
    )
  })

  it('should validate credentials using createConnection', async () => {
    jest.spyOn(connection, 'createConnection')
    jest.spyOn(connection, 'validateCredentials')
    mockAxiosAdapter.onGet('/api/v2/account').reply(200, {
      settings: {},
    })

    // basic auth token method
    expect(
      await adapter.validateCredentials(
        new InstanceElement('config', basicCredentialsType, {
          username: 'user123/token',
          token: 'token123',
          subdomain: 'abc',
        }),
      ),
    ).toEqual({ accountId: 'https://abc.zendesk.com' })

    // basic auth password method
    expect(
      await adapter.validateCredentials(
        new InstanceElement('config', basicCredentialsType, {
          username: 'user123',
          password: 'pwd456',
          subdomain: 'abc',
        }),
      ),
    ).toEqual({ accountId: 'https://abc.zendesk.com' })

    // OAuth auth method
    expect(
      await adapter.validateCredentials(
        new InstanceElement('config', oauthAccessTokenCredentialsType, {
          authType: 'oauth',
          accessToken: 'token',
          subdomain: 'abc',
        }),
      ),
    ).toEqual({ accountId: 'https://abc.zendesk.com' })

    // with domain provided
    expect(
      await adapter.validateCredentials(
        new InstanceElement('config', basicCredentialsType, {
          username: 'user123',
          password: 'pwd456',
          subdomain: 'abc',
          domain: 'zendesk1.com',
        }),
      ),
    ).toEqual({ accountId: 'https://abc.zendesk1.com' })

    // with domain is an empty string
    expect(
      await adapter.validateCredentials(
        new InstanceElement('config', oauthAccessTokenCredentialsType, {
          authType: 'oauth',
          accessToken: 'token',
          subdomain: 'abc',
          domain: '',
        }),
      ),
    ).toEqual({ accountId: 'https://abc.zendesk.com' })

    expect(connection.createConnection).toHaveBeenCalledTimes(5)
    expect(connection.validateCredentials).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        credentials: { username: 'user123/token', token: 'token123', subdomain: 'abc' },
      }),
    )

    expect(connection.validateCredentials).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        credentials: { username: 'user123', password: 'pwd456', subdomain: 'abc' },
      }),
    )

    expect(connection.validateCredentials).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        credentials: { accessToken: 'token', subdomain: 'abc' },
      }),
    )

    expect(connection.validateCredentials).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({
        credentials: { username: 'user123', password: 'pwd456', subdomain: 'abc', domain: 'zendesk1.com' },
      }),
    )

    expect(connection.validateCredentials).toHaveBeenNthCalledWith(
      5,
      expect.objectContaining({
        credentials: { accessToken: 'token', subdomain: 'abc' },
      }),
    )
  })
  describe('isProduction check', () => {
    it('should give correct answer if it is a production account', async () => {
      jest.spyOn(connection, 'createConnection')
      jest.spyOn(connection, 'validateCredentials')
      mockAxiosAdapter.onGet('/api/v2/account/settings').reply(200, {
        settings: {},
      })
      mockAxiosAdapter.onGet('/api/v2/account').reply(200, {
        account: {
          sandbox: false,
        },
      })

      // basic auth method
      expect(
        await adapter.validateCredentials(
          new InstanceElement('config', basicCredentialsType, {
            username: 'user123',
            password: 'pwd456',
            subdomain: 'abc',
          }),
        ),
      ).toEqual({ accountId: 'https://abc.zendesk.com', isProduction: true })
    })
    it('should give correct answer if it is not a production account', async () => {
      jest.spyOn(connection, 'createConnection')
      jest.spyOn(connection, 'validateCredentials')
      mockAxiosAdapter.onGet('/api/v2/account/settings').reply(200, {
        settings: {},
      })
      mockAxiosAdapter.onGet('/api/v2/account').reply(200, {
        account: {
          sandbox: true,
        },
      })

      // basic auth method
      expect(
        await adapter.validateCredentials(
          new InstanceElement('config', basicCredentialsType, {
            username: 'user123',
            password: 'pwd456',
            subdomain: 'abc',
          }),
        ),
      ).toEqual({ accountId: 'https://abc.zendesk.com', isProduction: false })
    })
    it('should not return isProduction if re is invalid', async () => {
      jest.spyOn(connection, 'createConnection')
      jest.spyOn(connection, 'validateCredentials')
      mockAxiosAdapter.onGet('/api/v2/account/settings').reply(200, {
        settings: {},
      })
      mockAxiosAdapter.onGet('/api/v2/account').reply(200, {
        account: {},
      })

      // basic auth method
      expect(
        await adapter.validateCredentials(
          new InstanceElement('config', basicCredentialsType, {
            username: 'user123',
            password: 'pwd456',
            subdomain: 'abc',
          }),
        ),
      ).toEqual({ accountId: 'https://abc.zendesk.com' })
    })
    it('should not return isProduction on failed status', async () => {
      jest.spyOn(connection, 'createConnection')
      jest.spyOn(connection, 'validateCredentials')
      mockAxiosAdapter.onGet('/api/v2/account').reply(400, {})

      // basic auth method
      await expect(() =>
        adapter.validateCredentials(
          new InstanceElement('config', basicCredentialsType, {
            username: 'user123',
            password: 'pwd456',
            subdomain: 'abc',
          }),
        ),
      ).rejects.toThrow()
    })
  })
})
