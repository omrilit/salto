/*
 * Copyright 2025 Salto Labs Ltd.
 * Licensed under the Salto Terms of Use (the "License");
 * You may not use this file except in compliance with the License.  You may obtain a copy of the License at https://www.salto.io/terms-of-use
 *
 * CERTAIN THIRD PARTY SOFTWARE MAY BE CONTAINED IN PORTIONS OF THE SOFTWARE. See NOTICE FILE AT https://github.com/salto-io/salto/blob/main/NOTICES
 */
/* eslint-disable max-len */
/* eslint-disable camelcase */
import {
  BuiltinTypes,
  createRefToElmWithValue,
  CORE_ANNOTATIONS,
  ElemID,
  ObjectType,
  createRestriction,
  ListType,
} from '@salto-io/adapter-api'
import * as constants from '../../../constants'
import { TypeAndInnerTypes } from '../../../types/object_types'
import { enums } from '../enums'

export const clientscriptType = (): TypeAndInnerTypes => {
  const innerTypes: Record<string, ObjectType> = {}

  const clientscriptElemID = new ElemID(constants.NETSUITE, 'clientscript')
  const clientscript_buttons_buttonElemID = new ElemID(constants.NETSUITE, 'clientscript_buttons_button')

  const clientscript_buttons_button = new ObjectType({
    elemID: clientscript_buttons_buttonElemID,
    annotations: {},
    fields: {
      buttonlabel: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING /* Original type was single-select list */),
        annotations: {
          [CORE_ANNOTATIONS.REQUIRED]: true,
        },
      } /* Original description: This field accepts references to the string custom type. */,
      buttonfunction: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING),
        annotations: {},
      },
    },
    path: [constants.NETSUITE, constants.TYPES_PATH, clientscriptElemID.name],
  })

  innerTypes.clientscript_buttons_button = clientscript_buttons_button

  const clientscript_buttonsElemID = new ElemID(constants.NETSUITE, 'clientscript_buttons')

  const clientscript_buttons = new ObjectType({
    elemID: clientscript_buttonsElemID,
    annotations: {},
    fields: {
      button: {
        refType: createRefToElmWithValue(new ListType(clientscript_buttons_button)),
        annotations: {},
      },
    },
    path: [constants.NETSUITE, constants.TYPES_PATH, clientscriptElemID.name],
  })

  innerTypes.clientscript_buttons = clientscript_buttons

  const clientscript_libraries_libraryElemID = new ElemID(constants.NETSUITE, 'clientscript_libraries_library')

  const clientscript_libraries_library = new ObjectType({
    elemID: clientscript_libraries_libraryElemID,
    annotations: {},
    fields: {
      scriptfile: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING /* Original type was filereference */),
        annotations: {
          [CORE_ANNOTATIONS.REQUIRED]: true,
        },
      } /* Original description: This field must reference a .js file. */,
    },
    path: [constants.NETSUITE, constants.TYPES_PATH, clientscriptElemID.name],
  })

  innerTypes.clientscript_libraries_library = clientscript_libraries_library

  const clientscript_librariesElemID = new ElemID(constants.NETSUITE, 'clientscript_libraries')

  const clientscript_libraries = new ObjectType({
    elemID: clientscript_librariesElemID,
    annotations: {},
    fields: {
      library: {
        refType: createRefToElmWithValue(new ListType(clientscript_libraries_library)),
        annotations: {},
      },
    },
    path: [constants.NETSUITE, constants.TYPES_PATH, clientscriptElemID.name],
  })

  innerTypes.clientscript_libraries = clientscript_libraries

  const clientscript_scriptcustomfields_scriptcustomfield_customfieldfilters_customfieldfilterElemID = new ElemID(
    constants.NETSUITE,
    'clientscript_scriptcustomfields_scriptcustomfield_customfieldfilters_customfieldfilter',
  )

  const clientscript_scriptcustomfields_scriptcustomfield_customfieldfilters_customfieldfilter = new ObjectType({
    elemID: clientscript_scriptcustomfields_scriptcustomfield_customfieldfilters_customfieldfilterElemID,
    annotations: {},
    fields: {
      fldfilter: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING /* Original type was single-select list */),
        annotations: {
          [CORE_ANNOTATIONS.REQUIRED]: true,
        },
      } /* Original description: This field accepts references to the following custom types:   transactioncolumncustomfield   transactionbodycustomfield   othercustomfield   itemoptioncustomfield   itemnumbercustomfield   itemcustomfield   entitycustomfield   customrecordcustomfield   crmcustomfield   For information about other possible values, see generic_standard_field. */,
      fldfilterchecked: {
        refType: createRefToElmWithValue(BuiltinTypes.BOOLEAN),
        annotations: {},
      } /* Original description: The default value is F. */,
      fldfiltercomparetype: {
        refType: createRefToElmWithValue(enums.generic_customfield_fldfiltercomparetype),
        annotations: {},
      } /* Original description: For information about possible values, see generic_customfield_fldfiltercomparetype.   The default value is 'EQ'. */,
      fldfiltersel: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING /* Original type was multi-select list */),
        annotations: {},
      } /* Original description: You can specify multiple values by separating each value with a pipe (|) symbol.   This field accepts references to the following custom types:   scriptdeployment   workflowactionscript   workflowstatecustomfield   workflowcustomfield   workflow   scriptdeployment   usereventscript   transactioncolumncustomfield   transactionbodycustomfield   transactionForm   scriptdeployment   suitelet   scriptdeployment   scheduledscript   savedsearch   role   scriptdeployment   restlet   scriptdeployment   portlet   othercustomfield   scriptdeployment   massupdatescript   scriptdeployment   mapreducescript   itemoptioncustomfield   itemnumbercustomfield   itemcustomfield   entryForm   entitycustomfield   statuses   customtransactiontype   instance   customrecordcustomfield   customrecordtype   customvalue   crmcustomfield   scriptdeployment   clientscript   scriptdeployment   bundleinstallationscript   advancedpdftemplate   addressForm */,
      fldfilterval: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING),
        annotations: {},
      },
      fldfilternotnull: {
        refType: createRefToElmWithValue(BuiltinTypes.BOOLEAN),
        annotations: {},
      } /* Original description: The default value is F. */,
      fldfilternull: {
        refType: createRefToElmWithValue(BuiltinTypes.BOOLEAN),
        annotations: {},
      } /* Original description: The default value is F. */,
      fldcomparefield: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING /* Original type was single-select list */),
        annotations: {},
      } /* Original description: This field accepts references to the following custom types:   transactioncolumncustomfield   transactionbodycustomfield   othercustomfield   itemoptioncustomfield   itemnumbercustomfield   itemcustomfield   entitycustomfield   customrecordcustomfield   crmcustomfield   For information about other possible values, see generic_standard_field. */,
    },
    path: [constants.NETSUITE, constants.TYPES_PATH, clientscriptElemID.name],
  })

  innerTypes.clientscript_scriptcustomfields_scriptcustomfield_customfieldfilters_customfieldfilter =
    clientscript_scriptcustomfields_scriptcustomfield_customfieldfilters_customfieldfilter

  const clientscript_scriptcustomfields_scriptcustomfield_customfieldfiltersElemID = new ElemID(
    constants.NETSUITE,
    'clientscript_scriptcustomfields_scriptcustomfield_customfieldfilters',
  )

  const clientscript_scriptcustomfields_scriptcustomfield_customfieldfilters = new ObjectType({
    elemID: clientscript_scriptcustomfields_scriptcustomfield_customfieldfiltersElemID,
    annotations: {},
    fields: {
      customfieldfilter: {
        refType: createRefToElmWithValue(
          new ListType(clientscript_scriptcustomfields_scriptcustomfield_customfieldfilters_customfieldfilter),
        ),
        annotations: {},
      },
    },
    path: [constants.NETSUITE, constants.TYPES_PATH, clientscriptElemID.name],
  })

  innerTypes.clientscript_scriptcustomfields_scriptcustomfield_customfieldfilters =
    clientscript_scriptcustomfields_scriptcustomfield_customfieldfilters

  const clientscript_scriptcustomfields_scriptcustomfield_roleaccesses_roleaccessElemID = new ElemID(
    constants.NETSUITE,
    'clientscript_scriptcustomfields_scriptcustomfield_roleaccesses_roleaccess',
  )

  const clientscript_scriptcustomfields_scriptcustomfield_roleaccesses_roleaccess = new ObjectType({
    elemID: clientscript_scriptcustomfields_scriptcustomfield_roleaccesses_roleaccessElemID,
    annotations: {},
    fields: {
      role: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING /* Original type was single-select list */),
        annotations: {
          [CORE_ANNOTATIONS.REQUIRED]: true,
        },
      } /* Original description: This field accepts references to the role custom type.   For information about other possible values, see customrecordtype_permittedrole. */,
      accesslevel: {
        refType: createRefToElmWithValue(enums.generic_accesslevel_searchlevel),
        annotations: {
          [CORE_ANNOTATIONS.REQUIRED]: true,
        },
      } /* Original description: For information about possible values, see generic_accesslevel_searchlevel.   The default value is '0'. */,
      searchlevel: {
        refType: createRefToElmWithValue(enums.generic_accesslevel_searchlevel),
        annotations: {
          [CORE_ANNOTATIONS.REQUIRED]: true,
        },
      } /* Original description: For information about possible values, see generic_accesslevel_searchlevel.   The default value is '0'. */,
    },
    path: [constants.NETSUITE, constants.TYPES_PATH, clientscriptElemID.name],
  })

  innerTypes.clientscript_scriptcustomfields_scriptcustomfield_roleaccesses_roleaccess =
    clientscript_scriptcustomfields_scriptcustomfield_roleaccesses_roleaccess

  const clientscript_scriptcustomfields_scriptcustomfield_roleaccessesElemID = new ElemID(
    constants.NETSUITE,
    'clientscript_scriptcustomfields_scriptcustomfield_roleaccesses',
  )

  const clientscript_scriptcustomfields_scriptcustomfield_roleaccesses = new ObjectType({
    elemID: clientscript_scriptcustomfields_scriptcustomfield_roleaccessesElemID,
    annotations: {},
    fields: {
      roleaccess: {
        refType: createRefToElmWithValue(
          new ListType(clientscript_scriptcustomfields_scriptcustomfield_roleaccesses_roleaccess),
        ),
        annotations: {},
      },
    },
    path: [constants.NETSUITE, constants.TYPES_PATH, clientscriptElemID.name],
  })

  innerTypes.clientscript_scriptcustomfields_scriptcustomfield_roleaccesses =
    clientscript_scriptcustomfields_scriptcustomfield_roleaccesses

  const clientscript_scriptcustomfields_scriptcustomfieldElemID = new ElemID(
    constants.NETSUITE,
    'clientscript_scriptcustomfields_scriptcustomfield',
  )

  const clientscript_scriptcustomfields_scriptcustomfield = new ObjectType({
    elemID: clientscript_scriptcustomfields_scriptcustomfieldElemID,
    annotations: {},
    fields: {
      scriptid: {
        refType: createRefToElmWithValue(BuiltinTypes.SERVICE_ID),
        annotations: {
          [CORE_ANNOTATIONS.REQUIRED]: true,
          [constants.IS_ATTRIBUTE]: true,
        },
      } /* Original description: This attribute value can be up to 40 characters long.   The default value is ‘custscript’. */,
      fieldtype: {
        refType: createRefToElmWithValue(enums.generic_customfield_fieldtype),
        annotations: {
          [CORE_ANNOTATIONS.REQUIRED]: true,
        },
      } /* Original description: For information about possible values, see generic_customfield_fieldtype.   The default value is 'TEXT'. */,
      label: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING /* Original type was single-select list */),
        annotations: {
          [CORE_ANNOTATIONS.REQUIRED]: true,
          // [CORE_ANNOTATIONS.RESTRICTION]: createRestriction({ max_length: 200 }),
        },
      } /* Original description: This field value can be up to 200 characters long.   This field accepts references to the string custom type. */,
      selectrecordtype: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING /* Original type was single-select list */),
        annotations: {},
      } /* Original description: This field is mandatory when the fieldtype value is equal to any of the following lists or values: SELECT, MULTISELECT.   This field accepts references to the following custom types:   customrecordtype   customlist   For information about other possible values, see generic_customfield_selectrecordtype. */,
      applyformatting: {
        refType: createRefToElmWithValue(BuiltinTypes.BOOLEAN),
        annotations: {},
      } /* Original description: The default value is T. */,
      defaultchecked: {
        refType: createRefToElmWithValue(BuiltinTypes.BOOLEAN),
        annotations: {},
      } /* Original description: The default value is F. */,
      defaultselection: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING /* Original type was single-select list */),
        annotations: {},
      } /* Original description: This field accepts references to the following custom types:   scriptdeployment   workflowactionscript   workflowstatecustomfield   workflowcustomfield   workflow   scriptdeployment   usereventscript   transactioncolumncustomfield   transactionbodycustomfield   transactionForm   scriptdeployment   suitelet   scriptdeployment   scheduledscript   savedsearch   role   scriptdeployment   restlet   scriptdeployment   portlet   othercustomfield   scriptdeployment   massupdatescript   scriptdeployment   mapreducescript   itemoptioncustomfield   itemnumbercustomfield   itemcustomfield   entryForm   entitycustomfield   statuses   customtransactiontype   instance   customrecordcustomfield   customrecordtype   customvalue   crmcustomfield   scriptdeployment   clientscript   scriptdeployment   bundleinstallationscript   advancedpdftemplate   addressForm */,
      defaultvalue: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING),
        annotations: {},
      },
      description: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING),
        annotations: {},
      },
      displaytype: {
        refType: createRefToElmWithValue(enums.generic_customfield_displaytype),
        annotations: {},
      } /* Original description: For information about possible values, see generic_customfield_displaytype.   The default value is 'NORMAL'. */,
      dynamicdefault: {
        refType: createRefToElmWithValue(enums.generic_customfield_dynamicdefault),
        annotations: {},
      } /* Original description: For information about possible values, see generic_customfield_dynamicdefault. */,
      help: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING /* Original type was single-select list */),
        annotations: {},
      } /* Original description: This field accepts references to the string custom type. */,
      linktext: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING),
        annotations: {},
      },
      minvalue: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING),
        annotations: {},
      },
      maxvalue: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING),
        annotations: {},
      },
      storevalue: {
        refType: createRefToElmWithValue(BuiltinTypes.BOOLEAN),
        annotations: {},
      } /* Original description: The default value is T. */,
      accesslevel: {
        refType: createRefToElmWithValue(enums.generic_accesslevel_searchlevel),
        annotations: {},
      } /* Original description: For information about possible values, see generic_accesslevel_searchlevel.   The default value is '2'. */,
      checkspelling: {
        refType: createRefToElmWithValue(BuiltinTypes.BOOLEAN),
        annotations: {},
      } /* Original description: The default value is F. */,
      displayheight: {
        refType: createRefToElmWithValue(BuiltinTypes.NUMBER),
        annotations: {},
      } /* Original description: This field value must be greater than or equal to 0. */,
      displaywidth: {
        refType: createRefToElmWithValue(BuiltinTypes.NUMBER),
        annotations: {},
      } /* Original description: This field value must be greater than or equal to 0. */,
      isformula: {
        refType: createRefToElmWithValue(BuiltinTypes.BOOLEAN),
        annotations: {},
      } /* Original description: The default value is F. */,
      ismandatory: {
        refType: createRefToElmWithValue(BuiltinTypes.BOOLEAN),
        annotations: {},
      } /* Original description: The default value is F. */,
      maxlength: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING),
        annotations: {},
      },
      onparentdelete: {
        refType: createRefToElmWithValue(enums.generic_customfield_onparentdelete),
        annotations: {},
      } /* Original description: For information about possible values, see generic_customfield_onparentdelete. */,
      searchcomparefield: {
        refType: createRefToElmWithValue(enums.generic_standard_field),
        annotations: {},
      } /* Original description: For information about possible values, see generic_standard_field. */,
      searchdefault: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING /* Original type was single-select list */),
        annotations: {},
      } /* Original description: This field accepts references to the savedsearch custom type. */,
      searchlevel: {
        refType: createRefToElmWithValue(enums.generic_accesslevel_searchlevel),
        annotations: {},
      } /* Original description: For information about possible values, see generic_accesslevel_searchlevel.   The default value is '2'. */,
      setting: {
        refType: createRefToElmWithValue(enums.script_setting),
        annotations: {},
      } /* Original description: For information about possible values, see script_setting. */,
      customfieldfilters: {
        refType: createRefToElmWithValue(clientscript_scriptcustomfields_scriptcustomfield_customfieldfilters),
        annotations: {},
      },
      roleaccesses: {
        refType: createRefToElmWithValue(clientscript_scriptcustomfields_scriptcustomfield_roleaccesses),
        annotations: {},
      },
    },
    path: [constants.NETSUITE, constants.TYPES_PATH, clientscriptElemID.name],
  })

  innerTypes.clientscript_scriptcustomfields_scriptcustomfield = clientscript_scriptcustomfields_scriptcustomfield

  const clientscript_scriptcustomfieldsElemID = new ElemID(constants.NETSUITE, 'clientscript_scriptcustomfields')

  const clientscript_scriptcustomfields = new ObjectType({
    elemID: clientscript_scriptcustomfieldsElemID,
    annotations: {},
    fields: {
      scriptcustomfield: {
        refType: createRefToElmWithValue(new ListType(clientscript_scriptcustomfields_scriptcustomfield)),
        annotations: {},
      },
    },
    path: [constants.NETSUITE, constants.TYPES_PATH, clientscriptElemID.name],
  })

  innerTypes.clientscript_scriptcustomfields = clientscript_scriptcustomfields

  const clientscript_scriptdeployments_scriptdeploymentElemID = new ElemID(
    constants.NETSUITE,
    'clientscript_scriptdeployments_scriptdeployment',
  )

  const clientscript_scriptdeployments_scriptdeployment = new ObjectType({
    elemID: clientscript_scriptdeployments_scriptdeploymentElemID,
    annotations: {},
    fields: {
      scriptid: {
        refType: createRefToElmWithValue(BuiltinTypes.SERVICE_ID),
        annotations: {
          [CORE_ANNOTATIONS.REQUIRED]: true,
          [constants.IS_ATTRIBUTE]: true,
        },
      } /* Original description: This attribute value can be up to 40 characters long.   The default value is ‘customdeploy’. */,
      status: {
        refType: createRefToElmWithValue(enums.script_status),
        annotations: {
          [CORE_ANNOTATIONS.REQUIRED]: true,
        },
      } /* Original description: For information about possible values, see script_status.   The default value is 'TESTING'. */,
      recordtype: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING /* Original type was single-select list */),
        annotations: {
          [CORE_ANNOTATIONS.REQUIRED]: true,
        },
      } /* Original description: This field accepts references to the following custom types:   customtransactiontype   customrecordtype   For information about other possible values, see the following lists:   scriptdeployment_recordtype   allrecord_script_deployment_recordtype */,
      allemployees: {
        refType: createRefToElmWithValue(BuiltinTypes.BOOLEAN),
        annotations: {},
      } /* Original description: The default value is F. */,
      allpartners: {
        refType: createRefToElmWithValue(BuiltinTypes.BOOLEAN),
        annotations: {},
      } /* Original description: The default value is F.   If this field appears in the project, you must reference the CRM feature in the manifest file to avoid project warnings. In the manifest file, you can specify whether this feature is required in your account. CRM must be enabled for this field to appear in your account. */,
      allroles: {
        refType: createRefToElmWithValue(BuiltinTypes.BOOLEAN),
        annotations: {},
      } /* Original description: The default value is F. */,
      auddepartment: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING /* Original type was multi-select list */),
        annotations: {},
      } /* Original description: You can specify multiple values by separating each value with a pipe (|) symbol.   If this field appears in the project, you must reference the DEPARTMENTS feature in the manifest file to avoid project warnings. In the manifest file, you can specify whether this feature is required in your account. DEPARTMENTS must be enabled for this field to appear in your account.   Note Account-specific values are not supported by SDF. */,
      audemployee: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING /* Original type was multi-select list */),
        annotations: {},
      } /* Original description: You can specify multiple values by separating each value with a pipe (|) symbol.   Note Account-specific values are not supported by SDF. */,
      audgroup: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING /* Original type was multi-select list */),
        annotations: {},
      } /* Original description: You can specify multiple values by separating each value with a pipe (|) symbol.   Note Account-specific values are not supported by SDF. */,
      audpartner: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING /* Original type was multi-select list */),
        annotations: {},
      } /* Original description: You can specify multiple values by separating each value with a pipe (|) symbol.   If this field appears in the project, you must reference the CRM feature in the manifest file to avoid project warnings. In the manifest file, you can specify whether this feature is required in your account. CRM must be enabled for this field to appear in your account.   Note Account-specific values are not supported by SDF. */,
      audslctrole: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING /* Original type was multi-select list */),
        annotations: {},
      } /* Original description: You can specify multiple values by separating each value with a pipe (|) symbol.   This field accepts references to the role custom type.   For information about other possible values, see generic_role. */,
      audsubsidiary: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING /* Original type was multi-select list */),
        annotations: {},
      } /* Original description: You can specify multiple values by separating each value with a pipe (|) symbol.   If this field appears in the project, you must reference the SUBSIDIARIES feature in the manifest file to avoid project warnings. In the manifest file, you can specify whether this feature is required in your account. SUBSIDIARIES must be enabled for this field to appear in your account.   Note Account-specific values are not supported by SDF. */,
      eventtype: {
        refType: createRefToElmWithValue(enums.script_eventtype),
        annotations: {},
      } /* Original description: For information about possible values, see script_eventtype. */,
      isdeployed: {
        refType: createRefToElmWithValue(BuiltinTypes.BOOLEAN),
        annotations: {},
      } /* Original description: The default value is T. */,
      loglevel: {
        refType: createRefToElmWithValue(enums.script_loglevel),
        annotations: {},
      } /* Original description: For information about possible values, see script_loglevel.   The default value is 'DEBUG'. */,
      alllocalizationcontexts: {
        refType: createRefToElmWithValue(BuiltinTypes.BOOLEAN),
        annotations: {},
      } /* Original description: The default value is T. */,
      executioncontext: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING /* Original type was multi-select list */),
        annotations: {},
      } /* Original description: You can specify multiple values by separating each value with a pipe (|) symbol.   For information about possible values, see execution_context. */,
      localizationcontext: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING /* Original type was multi-select list */),
        annotations: {},
      } /* Original description: You can filter your script to run based on the localization context of your users. For information about using localization context in NetSuite, see Record Localization Context.   This field is available when the alllocalizationcontexts value is equal to F.   You can specify multiple values by separating each value with a pipe (|) symbol.   For information about possible values, see countries. */,
    },
    path: [constants.NETSUITE, constants.TYPES_PATH, clientscriptElemID.name],
  })

  innerTypes.clientscript_scriptdeployments_scriptdeployment = clientscript_scriptdeployments_scriptdeployment

  const clientscript_scriptdeploymentsElemID = new ElemID(constants.NETSUITE, 'clientscript_scriptdeployments')

  const clientscript_scriptdeployments = new ObjectType({
    elemID: clientscript_scriptdeploymentsElemID,
    annotations: {},
    fields: {
      scriptdeployment: {
        refType: createRefToElmWithValue(new ListType(clientscript_scriptdeployments_scriptdeployment)),
        annotations: {},
      },
    },
    path: [constants.NETSUITE, constants.TYPES_PATH, clientscriptElemID.name],
  })

  innerTypes.clientscript_scriptdeployments = clientscript_scriptdeployments

  const clientscript = new ObjectType({
    elemID: clientscriptElemID,
    annotations: {},
    fields: {
      scriptid: {
        refType: createRefToElmWithValue(BuiltinTypes.SERVICE_ID),
        annotations: {
          [CORE_ANNOTATIONS.REQUIRED]: true,
          [constants.IS_ATTRIBUTE]: true,
          [CORE_ANNOTATIONS.RESTRICTION]: createRestriction({ regex: '^customscript[0-9a-z_]+' }),
        },
      } /* Original description: This attribute value can be up to 40 characters long.   The default value is ‘customscript’. */,
      name: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING /* Original type was single-select list */),
        annotations: {
          [CORE_ANNOTATIONS.REQUIRED]: true,
          // [CORE_ANNOTATIONS.RESTRICTION]: createRestriction({ max_length: 40 }),
        },
      } /* Original description: This field value can be up to 40 characters long.   This field accepts references to the string custom type. */,
      scriptfile: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING /* Original type was filereference */),
        annotations: {
          [CORE_ANNOTATIONS.REQUIRED]: true,
        },
      } /* Original description: This field must reference a .js file. */,
      description: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING /* Original type was single-select list */),
        annotations: {
          // [CORE_ANNOTATIONS.RESTRICTION]: createRestriction({ max_length: 999 }),
        },
      } /* Original description: This field value can be up to 999 characters long.   This field accepts references to the string custom type. */,
      isinactive: {
        refType: createRefToElmWithValue(BuiltinTypes.BOOLEAN),
        annotations: {},
      } /* Original description: The default value is F. */,
      notifyadmins: {
        refType: createRefToElmWithValue(BuiltinTypes.BOOLEAN),
        annotations: {},
      } /* Original description: The default value is F. */,
      notifyemails: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING),
        annotations: {
          // [CORE_ANNOTATIONS.RESTRICTION]: createRestriction({ max_length: 999 }),
        },
      } /* Original description: This field value can be up to 999 characters long. */,
      notifygroup: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING),
        annotations: {},
      } /* Original description: Note Account-specific values are not supported by SDF. */,
      notifyowner: {
        refType: createRefToElmWithValue(BuiltinTypes.BOOLEAN),
        annotations: {},
      } /* Original description: The default value is T. */,
      notifyuser: {
        refType: createRefToElmWithValue(BuiltinTypes.BOOLEAN),
        annotations: {},
      } /* Original description: The default value is F. */,
      fieldchangedfunction: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING),
        annotations: {},
      },
      lineinitfunction: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING),
        annotations: {},
      },
      pageinitfunction: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING),
        annotations: {},
      },
      postsourcingfunction: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING),
        annotations: {},
      },
      recalcfunction: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING),
        annotations: {},
      },
      saverecordfunction: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING),
        annotations: {},
      },
      validatedeletefunction: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING),
        annotations: {},
      },
      validatefieldfunction: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING),
        annotations: {},
      },
      validateinsertfunction: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING),
        annotations: {},
      },
      validatelinefunction: {
        refType: createRefToElmWithValue(BuiltinTypes.STRING),
        annotations: {},
      },
      buttons: {
        refType: createRefToElmWithValue(clientscript_buttons),
        annotations: {},
      },
      libraries: {
        refType: createRefToElmWithValue(clientscript_libraries),
        annotations: {},
      },
      scriptcustomfields: {
        refType: createRefToElmWithValue(clientscript_scriptcustomfields),
        annotations: {},
      },
      scriptdeployments: {
        refType: createRefToElmWithValue(clientscript_scriptdeployments),
        annotations: {},
      },
    },
    path: [constants.NETSUITE, constants.TYPES_PATH, clientscriptElemID.name],
  })

  return { type: clientscript, innerTypes }
}
