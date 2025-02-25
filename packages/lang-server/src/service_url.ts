/*
 * Copyright 2025 Salto Labs Ltd.
 * Licensed under the Salto Terms of Use (the "License");
 * You may not use this file except in compliance with the License.  You may obtain a copy of the License at https://www.salto.io/terms-of-use
 *
 * CERTAIN THIRD PARTY SOFTWARE MAY BE CONTAINED IN PORTIONS OF THE SOFTWARE. See NOTICE FILE AT https://github.com/salto-io/salto/blob/main/NOTICES
 */
import { CORE_ANNOTATIONS, ElemID, isElement, isField } from '@salto-io/adapter-api'
import { PositionContext } from './context'
import { EditorWorkspace } from './workspace'

const getElementIDUrl = async (workspace: EditorWorkspace, elemID: ElemID): Promise<URL | undefined> => {
  const element = await workspace.getValue(elemID)

  if (!isElement(element)) {
    return undefined
  }

  const url = element.annotations[CORE_ANNOTATIONS.SERVICE_URL]
  if (url === undefined) {
    return undefined
  }
  return new URL(url)
}

export const getServiceUrl = async (workspace: EditorWorkspace, context: PositionContext): Promise<URL | undefined> => {
  if (context.ref === undefined) {
    return undefined
  }
  const { element } = context.ref

  if (isField(element)) {
    const url = await getElementIDUrl(workspace, element.elemID)
    if (url !== undefined) {
      return url
    }
  }

  return getElementIDUrl(workspace, element.elemID.createTopLevelParentID().parent)
}
