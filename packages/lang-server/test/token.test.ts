/*
 * Copyright 2025 Salto Labs Ltd.
 * Licensed under the Salto Terms of Use (the "License");
 * You may not use this file except in compliance with the License.  You may obtain a copy of the License at https://www.salto.io/terms-of-use
 *
 * CERTAIN THIRD PARTY SOFTWARE MAY BE CONTAINED IN PORTIONS OF THE SOFTWARE. See NOTICE FILE AT https://github.com/salto-io/salto/blob/main/NOTICES
 */
import path from 'path'
import fs from 'fs'
import { getToken } from '../src/token'

describe('Test go to definitions', () => {
  let naclFileContent: string

  beforeAll(async () => {
    const naclPath = path.resolve(`${__dirname}/../test/test-nacls/all.nacl`)
    naclFileContent = fs.readFileSync(naclPath).toString()
  })

  describe('position out of bounds', () => {
    it('line too high should return undefined', () => {
      expect(getToken(naclFileContent, { line: 100000, col: 1 })).toBeUndefined()
    })

    it('line too low should return undefined', () => {
      expect(getToken(naclFileContent, { line: -100000, col: 1 })).toBeUndefined()
    })

    it('column too high should return undefined', () => {
      expect(getToken(naclFileContent, { line: 1, col: 1000000 })).toBeUndefined()
    })

    it('column too low should return undefined', () => {
      expect(getToken(naclFileContent, { line: 1, col: -1000000 })).toBeUndefined()
    })
  })
  it('empty position should return undefined', () => {
    expect(getToken(naclFileContent, { line: 168, col: 0 })).toBeUndefined()
  })
  it('For valid token the right token should be return', () => {
    expect(getToken(naclFileContent, { line: 135, col: 5 })).toEqual({ value: 'vs.person', type: 'word' })
  })
  it('For a position of the first character of a valid token the right token should be return', () => {
    expect(getToken(naclFileContent, { line: 135, col: 0 })).toEqual({ value: 'vs.person', type: 'word' })
  })
  it('For a position of the last character of a valid token the right token should be return', () => {
    expect(getToken(naclFileContent, { line: 135, col: 9 })).toEqual({ value: 'vs.person', type: 'word' })
  })
})
