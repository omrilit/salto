/*
 * Copyright 2025 Salto Labs Ltd.
 * Licensed under the Salto Terms of Use (the "License");
 * You may not use this file except in compliance with the License.  You may obtain a copy of the License at https://www.salto.io/terms-of-use
 *
 * CERTAIN THIRD PARTY SOFTWARE MAY BE CONTAINED IN PORTIONS OF THE SOFTWARE. See NOTICE FILE AT https://github.com/salto-io/salto/blob/main/NOTICES
 */
import _ from 'lodash'
import { CORE_ANNOTATIONS, ElemID, InstanceElement, ObjectType, ReferenceExpression } from '@salto-io/adapter-api'
import { addAliasToElements, AliasData } from '../src/add_alias'

const groupByTypeName = (instances: InstanceElement[]): Record<string, InstanceElement[]> =>
  _.groupBy(instances, instance => instance.elemID.typeName)

describe('addAliasToElements', () => {
  const appInstallationTypeName = 'app_installation'
  const dynamicContentItemTypeName = 'dynamic_content_item'
  const dynamicContentItemVariantsTypeName = 'dynamic_content_item__variants'
  const localeTypeName = 'locale'
  const categoryTypeName = 'category'
  const categoryOrderTypeName = 'category_order'
  const categoryTranslationTypeName = 'category_translation'
  const anotherTranslationTypeName = 'another_translation'
  const ZENDESK = 'zendesk'

  const aliasMap: Record<string, AliasData> = {
    [appInstallationTypeName]: {
      aliasComponents: [
        {
          fieldName: 'settings.name',
        },
      ],
    },
    [dynamicContentItemTypeName]: {
      aliasComponents: [
        {
          fieldName: 'name',
        },
      ],
    },
    [dynamicContentItemVariantsTypeName]: {
      aliasComponents: [
        {
          fieldName: '_parent.0',
          referenceFieldName: '_alias',
        },
        {
          fieldName: 'locale_id',
          referenceFieldName: 'locale',
        },
      ],
      separator: ' - ',
    },
    [localeTypeName]: {
      aliasComponents: [
        {
          fieldName: 'presentation_name',
        },
      ],
    },
    [categoryTypeName]: {
      aliasComponents: [
        {
          fieldName: 'name',
        },
      ],
    },
    [categoryTranslationTypeName]: {
      aliasComponents: [
        {
          fieldName: 'locale',
          referenceFieldName: 'locale',
        },
        {
          fieldName: '_parent.0',
          referenceFieldName: '_alias',
        },
      ],
      separator: ' - ',
    },
    [categoryOrderTypeName]: {
      aliasComponents: [
        {
          fieldName: '_parent.0',
          referenceFieldName: '_alias',
        },
        {
          constant: 'Category Order',
        },
      ],
    },
    [anotherTranslationTypeName]: {
      aliasComponents: [
        {
          fieldName: 'locale',
          referenceFieldName: 'locale',
          useFieldValueAsFallback: true,
        },
        {
          fieldName: '_parent.0',
          referenceFieldName: '_alias',
        },
      ],
      separator: ' - ',
    },
  }

  const appInstallationType = new ObjectType({ elemID: new ElemID(ZENDESK, appInstallationTypeName) })
  const dynamicContentItemType = new ObjectType({ elemID: new ElemID(ZENDESK, dynamicContentItemTypeName) })
  const dynamicContentItemVariantsType = new ObjectType({
    elemID: new ElemID(ZENDESK, dynamicContentItemVariantsTypeName),
  })
  const localeType = new ObjectType({ elemID: new ElemID(ZENDESK, localeTypeName) })
  const categoryType = new ObjectType({ elemID: new ElemID(ZENDESK, categoryTypeName) })
  const categoryOrderType = new ObjectType({ elemID: new ElemID(ZENDESK, categoryOrderTypeName) })
  const categoryTranslationType = new ObjectType({ elemID: new ElemID(ZENDESK, categoryTranslationTypeName) })
  const anotherTranslationType = new ObjectType({ elemID: new ElemID(ZENDESK, anotherTranslationTypeName) })

  const localeInstance = new InstanceElement('instance4', localeType, {
    locale: 'en-us', // will be used for category translation
    presentation_name: 'en-us',
  })

  const categoryInstance = new InstanceElement('instance6', categoryType, {
    name: 'category name',
  })

  it('should add alias annotation correctly', async () => {
    const appInstallationInstance = new InstanceElement('instance1', appInstallationType, {
      settings: { name: 'app installation name' },
    })
    const appInstallationInstanceInvalid = new InstanceElement('instance2', appInstallationType, {})
    const dynamicContentItemInstance = new InstanceElement('instance3', dynamicContentItemType, {
      name: 'dynamic content name',
    })
    const dynamicContentItemVariantsInstance = new InstanceElement(
      'instance5',
      dynamicContentItemVariantsType,
      {
        locale_id: new ReferenceExpression(localeInstance.elemID, localeInstance),
      },
      undefined,
      {
        _parent: [new ReferenceExpression(dynamicContentItemInstance.elemID, dynamicContentItemInstance)],
      },
    )
    const categoryOrderInstance = new InstanceElement('instance7', categoryOrderType, {}, undefined, {
      _parent: [new ReferenceExpression(categoryInstance.elemID, categoryInstance)],
    })
    const categoryTranslationInstance = new InstanceElement(
      'instance8',
      categoryTranslationType,
      {
        locale: new ReferenceExpression(localeInstance.elemID, localeInstance),
      },
      undefined,
      {
        _parent: [new ReferenceExpression(categoryInstance.elemID, categoryInstance)],
      },
    )
    const categoryTranslationInstanceInvalid = new InstanceElement('instance9', categoryTranslationType, {
      locale: new ReferenceExpression(localeInstance.elemID),
    })
    const anotherTranslationInstance = new InstanceElement(
      'instance10',
      anotherTranslationType,
      {
        locale: 'en-au',
      },
      undefined,
      {
        _parent: [new ReferenceExpression(categoryInstance.elemID, categoryInstance)],
      },
    )
    const elements = [
      appInstallationInstance,
      appInstallationInstanceInvalid,
      dynamicContentItemInstance,
      localeInstance,
      dynamicContentItemVariantsInstance,
      categoryInstance,
      categoryOrderInstance,
      categoryTranslationInstance,
      categoryTranslationInstanceInvalid,
      anotherTranslationInstance,
    ]
    addAliasToElements({
      elementsMap: groupByTypeName(elements),
      aliasMap,
    })
    expect(elements.map(e => e.annotations[CORE_ANNOTATIONS.ALIAS])).toEqual([
      'app installation name',
      undefined,
      'dynamic content name',
      'en-us',
      'dynamic content name - en-us',
      'category name',
      'category name Category Order',
      'en-us - category name',
      undefined,
      'en-au - category name',
    ])
  })
  it('should not crash when one of the values is undefined', async () => {
    const appInstallationInstanceInvalid = new InstanceElement('instance2', appInstallationType, {
      settings: { name: undefined },
    })
    const elements = [appInstallationInstanceInvalid]
    addAliasToElements({
      elementsMap: groupByTypeName(elements),
      aliasMap,
    })
    expect(elements.map(e => e.annotations[CORE_ANNOTATIONS.ALIAS])).toEqual([undefined])
  })
  it('should not crash when there is not parent', async () => {
    const categoryTranslationInstance = new InstanceElement(
      'instance8',
      categoryTranslationType,
      {
        locale: new ReferenceExpression(localeInstance.elemID, localeInstance),
      },
      undefined,
    )
    const elements = [categoryTranslationInstance]
    addAliasToElements({
      elementsMap: groupByTypeName(elements),
      aliasMap,
    })
    expect(elements.map(e => e.annotations[CORE_ANNOTATIONS.ALIAS])).toEqual([undefined])
  })
  it('should not crash when there is a value instead of a reference when useFieldValueAsFallback = false', async () => {
    const categoryTranslationInstance = new InstanceElement(
      'instance8',
      categoryTranslationType,
      {
        locale: 'en-US',
      },
      undefined,
      {
        _parent: [new ReferenceExpression(categoryInstance.elemID, categoryInstance)],
      },
    )
    const elements = [categoryTranslationInstance]
    addAliasToElements({
      elementsMap: groupByTypeName(elements),
      aliasMap,
    })
    expect(elements.map(e => e.annotations[CORE_ANNOTATIONS.ALIAS])).toEqual([undefined])
  })
  it('should not crash when there is a reference instead of a value', async () => {
    const dynamicContentItemInstance = new InstanceElement('instance3', dynamicContentItemType, {
      name: new ReferenceExpression(localeInstance.elemID, localeInstance),
    })
    const elements = [dynamicContentItemInstance]
    addAliasToElements({
      elementsMap: groupByTypeName(elements),
      aliasMap,
    })
    expect(elements.map(e => e.annotations[CORE_ANNOTATIONS.ALIAS])).toEqual([undefined])
  })
  it('should add alias to object type', () => {
    const customRecordType = new ObjectType({
      elemID: new ElemID('netsuite', 'customrecord_123'),
      annotations: {
        name: 'Custom Record 123',
      },
    })
    const elementsMap = {
      customRecordType: [customRecordType],
    }
    const aliasMapWithType = {
      customRecordType: {
        aliasComponents: [
          {
            fieldName: 'name',
          },
        ],
      },
    }
    addAliasToElements({
      elementsMap,
      aliasMap: aliasMapWithType,
    })
  })
})
