/*
 * Copyright 2025 Salto Labs Ltd.
 * Licensed under the Salto Terms of Use (the "License");
 * You may not use this file except in compliance with the License.  You may obtain a copy of the License at https://www.salto.io/terms-of-use
 *
 * CERTAIN THIRD PARTY SOFTWARE MAY BE CONTAINED IN PORTIONS OF THE SOFTWARE. See NOTICE FILE AT https://github.com/salto-io/salto/blob/main/NOTICES
 */

import { CORE_ANNOTATIONS, isInstanceElement } from '@salto-io/adapter-api'
import { collections } from '@salto-io/lowerdash'
import { isDataObjectType } from '../types'
import { ServiceUrlSetter } from './types'
import { ITEM_TYPE_TO_SEARCH_STRING } from '../data_elements/types'

const { awu } = collections.asynciterable

const TYPE_TO_URL: Record<string, (id: string) => string> = {
  account: id => `app/accounting/account/account.nl?id=${id}`,
  subsidiary: id => `app/common/otherlists/subsidiarytype.nl?id=${id}`,
  department: id => `app/common/otherlists/departmenttype.nl?id=${id}`,
  classification: id => `app/common/otherlists/classtype.nl?id=${id}`,
  location: id => `app/common/otherlists/locationtype.nl?id=${id}`,
  currency: id => `app/common/multicurrency/currency.nl?e=T&id=${id}`,
  customer: id => `app/common/entity/custjob.nl?id=${id}`,
  accountingPeriod: id => `app/setup/period/fiscalperiod.nl?e=T&id=${id}`,
  employee: id => `app/common/entity/employee.nl?id=${id}`,
  job: id => `app/accounting/project/project.nl?id=${id}`,
  manufacturingCostTemplate: id => `app/accounting/manufacturing/mfgcosttemplate.nl?id=${id}`,
  partner: id => `app/common/entity/partner.nl?id=${id}`,
  solution: id => `app/crm/support/kb/solution.nl?id=${id}`,
  item: id => `app/common/item/item.nl?id=${id}`,
}

const setServiceUrl: ServiceUrlSetter = async (elements, client) => {
  await awu(elements)
    .filter(isInstanceElement)
    .filter(async element => isDataObjectType(await element.getType()))
    .forEach(element => {
      const typeName = element.elemID.typeName in ITEM_TYPE_TO_SEARCH_STRING ? 'item' : element.elemID.typeName
      const url = element.value.internalId !== undefined ? TYPE_TO_URL[typeName]?.(element.value.internalId) : undefined
      if (url !== undefined) {
        element.annotations[CORE_ANNOTATIONS.SERVICE_URL] = new URL(url, client.url).href
      }
    })
}

export default setServiceUrl
