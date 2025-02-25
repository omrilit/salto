/*
 * Copyright 2025 Salto Labs Ltd.
 * Licensed under the Salto Terms of Use (the "License");
 * You may not use this file except in compliance with the License.  You may obtain a copy of the License at https://www.salto.io/terms-of-use
 *
 * CERTAIN THIRD PARTY SOFTWARE MAY BE CONTAINED IN PORTIONS OF THE SOFTWARE. See NOTICE FILE AT https://github.com/salto-io/salto/blob/main/NOTICES
 */
import { logger } from '@salto-io/logging'
import {
  ReadOnlyElementsSource,
  Element,
  Change,
  toChange,
  isObjectTypeChange,
  isAdditionOrRemovalChange,
  getChangeData,
  isAdditionChange,
  ObjectType,
  Field,
} from '@salto-io/adapter-api'
import { collections } from '@salto-io/lowerdash'
import { RemoteMap } from './remote_map'
import { ElementsSource } from './elements_source'

const log = logger(module)
const { awu } = collections.asynciterable

export const getAllElementsChanges = async (
  currentChanges: Change<Element>[],
  elementsSource: ReadOnlyElementsSource,
): Promise<Change<Element>[]> => {
  const elementsInCurrentChanges = new Set(currentChanges.map(getChangeData).map(elem => elem.elemID.getFullName()))
  return awu(await elementsSource.list())
    .filter(id => !elementsInCurrentChanges.has(id.getFullName()))
    .map(id => elementsSource.get(id))
    .map(element => toChange({ after: element }))
    .concat(currentChanges)
    .toArray()
}

const getFieldChangesFromTypeChange = (change: Change<ObjectType>): Change<Field>[] => {
  if (isAdditionOrRemovalChange(change)) {
    return Object.values(getChangeData(change).fields).map(field =>
      isAdditionChange(change) ? toChange({ after: field }) : toChange({ before: field }),
    )
  }
  const { before, after } = change.data
  const allFieldNames = Object.keys({ ...before.fields, ...after.fields })
  return allFieldNames
    .filter(
      fieldName =>
        before.fields[fieldName] === undefined ||
        after.fields[fieldName] === undefined ||
        !before.fields[fieldName].isEqual(after.fields[fieldName]),
    )
    .map(fieldName =>
      toChange({
        before: before.fields[fieldName],
        after: after.fields[fieldName],
      }),
    )
}

export const getBaseChanges = (changes: Change<Element>[]): Change<Element>[] =>
  changes.concat(changes.filter(isObjectTypeChange).flatMap(getFieldChangesFromTypeChange))

export const updateIndex = async <T>({
  changes,
  index,
  indexVersionKey,
  indexVersion,
  indexName,
  mapVersions,
  elementsSource,
  isCacheValid,
  updateChanges,
}: {
  changes: Change<Element>[]
  index: RemoteMap<T>
  indexVersionKey: string
  indexVersion: number
  indexName: string
  mapVersions: RemoteMap<number>
  elementsSource: ElementsSource
  isCacheValid: boolean
  updateChanges: (changes: Change<Element>[], index: RemoteMap<T>) => Promise<void>
}): Promise<void> =>
  log.timeDebug(async () => {
    let relevantChanges = changes
    const isVersionMatch = (await mapVersions.get(indexVersionKey)) === indexVersion
    if (!isCacheValid || !isVersionMatch) {
      if (!isVersionMatch) {
        relevantChanges = await getAllElementsChanges(changes, elementsSource)
        log.info(`${indexName} index map is out of date, re-indexing`)
      }
      if (!isCacheValid) {
        // When cache is invalid, changes will include all of the elements in the workspace.
        log.info(`cache is invalid, re-indexing ${indexName} index`)
      }
      await Promise.all([index.clear(), mapVersions.set(indexVersionKey, indexVersion)])
    }
    await updateChanges(relevantChanges, index)
  }, `updating ${indexName} index`)
