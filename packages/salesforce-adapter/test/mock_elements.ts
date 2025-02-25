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
  Change,
  ElemID,
  InstanceElement,
  ListType,
  MapType,
  ObjectType,
  toChange,
  TypeElement,
} from '@salto-io/adapter-api'
import {
  API_NAME,
  ArtificialTypes,
  ASSIGNMENT_RULES_METADATA_TYPE,
  CHANGED_AT_SINGLETON,
  CPQ_CONDITIONS_MET,
  CPQ_ERROR_CONDITION,
  CPQ_ERROR_CONDITION_RULE_FIELD,
  CPQ_PRICE_CONDITION,
  CPQ_PRICE_CONDITION_RULE_FIELD,
  CPQ_PRICE_RULE,
  CPQ_PRODUCT_RULE,
  CPQ_QUOTE,
  CUSTOM_METADATA,
  CUSTOM_OBJECT,
  DUPLICATE_RULE_METADATA_TYPE,
  FIELD_ANNOTATIONS,
  INSTALLED_PACKAGE_METADATA,
  INSTANCE_FULL_NAME_FIELD,
  LABEL,
  LIGHTNING_COMPONENT_BUNDLE_METADATA_TYPE,
  METADATA_TYPE,
  ORGANIZATION_SETTINGS,
  OWNER_ID,
  PATH_ASSISTANT_METADATA_TYPE,
  SALESFORCE,
  SBAA_APPROVAL_CONDITION,
  SBAA_APPROVAL_RULE,
  SBAA_CONDITIONS_MET,
  SETTINGS_METADATA_TYPE,
  STATUS,
  WORKFLOW_FIELD_UPDATE_METADATA_TYPE,
  WORKFLOW_METADATA_TYPE,
  WORKFLOW_TASK_METADATA_TYPE,
  WORKFLOW_RULE_METADATA_TYPE,
  CPQ_QUOTE_TERM,
  CPQ_ADVANCED_CONDITION_FIELD,
  SETTINGS_DIR_NAME,
  CUSTOM_METADATA_TYPE_NAME,
  CPQ_TERM_CONDITION,
  CPQ_INDEX_FIELD,
  OPPORTUNITY_METADATA_TYPE,
  FLOW_FIELD_TYPE_NAMES,
  ASSIGN_TO_REFERENCE,
  LIVE_CHAT_BUTTON,
  APPROVAL_PROCESS_METADATA_TYPE,
  VALIDATION_RULES_METADATA_TYPE,
} from '../src/constants'
import { createInstanceElement, createMetadataObjectType, Types } from '../src/transformers/transformer'
import { allMissingSubTypes } from '../src/transformers/salesforce_types'
import { API_VERSION } from '../src/client/client'
import { WORKFLOW_FIELD_TO_TYPE } from '../src/filters/workflow'
import { createCustomObjectType } from './utils'
import { SORT_ORDER } from '../src/change_validators/duplicate_rules_sort_order'

const SBAA_APPROVAL_RULE_TYPE = createCustomObjectType(SBAA_APPROVAL_RULE, {
  fields: {
    [SBAA_CONDITIONS_MET]: {
      refType: BuiltinTypes.STRING,
      annotations: {
        [FIELD_ANNOTATIONS.QUERYABLE]: true,
        [FIELD_ANNOTATIONS.CREATABLE]: true,
        [FIELD_ANNOTATIONS.UPDATEABLE]: true,
      },
    },
  },
})

const CPQ_PRICE_RULE_TYPE = createCustomObjectType(CPQ_PRICE_RULE, {
  fields: {
    [CPQ_CONDITIONS_MET]: {
      refType: BuiltinTypes.STRING,
      annotations: {
        [FIELD_ANNOTATIONS.QUERYABLE]: true,
        [FIELD_ANNOTATIONS.CREATABLE]: true,
        [FIELD_ANNOTATIONS.UPDATEABLE]: true,
      },
    },
    [OWNER_ID]: {
      refType: BuiltinTypes.STRING,
      annotations: {
        [FIELD_ANNOTATIONS.CREATABLE]: true,
        [FIELD_ANNOTATIONS.UPDATEABLE]: true,
        [FIELD_ANNOTATIONS.QUERYABLE]: true,
        [API_NAME]: OWNER_ID,
      },
    },
  },
})

const CPQ_PRODUCT_RULE_TYPE = createCustomObjectType(CPQ_PRODUCT_RULE, {
  fields: {
    [CPQ_CONDITIONS_MET]: {
      refType: BuiltinTypes.STRING,
      annotations: {
        [FIELD_ANNOTATIONS.QUERYABLE]: true,
        [FIELD_ANNOTATIONS.CREATABLE]: true,
        [FIELD_ANNOTATIONS.UPDATEABLE]: true,
      },
    },
    [OWNER_ID]: {
      refType: BuiltinTypes.STRING,
      annotations: {
        [FIELD_ANNOTATIONS.CREATABLE]: true,
        [FIELD_ANNOTATIONS.UPDATEABLE]: true,
        [FIELD_ANNOTATIONS.QUERYABLE]: true,
        [API_NAME]: OWNER_ID,
      },
    },
  },
})

const CPQ_QUOTE_TERM_TYPE = createCustomObjectType(CPQ_QUOTE_TERM, {
  fields: {
    [CPQ_ADVANCED_CONDITION_FIELD]: {
      refType: BuiltinTypes.STRING,
      annotations: {
        [FIELD_ANNOTATIONS.QUERYABLE]: true,
        [FIELD_ANNOTATIONS.CREATABLE]: true,
        [FIELD_ANNOTATIONS.UPDATEABLE]: true,
      },
    },
    [OWNER_ID]: {
      refType: BuiltinTypes.STRING,
      annotations: {
        [FIELD_ANNOTATIONS.CREATABLE]: true,
        [FIELD_ANNOTATIONS.UPDATEABLE]: true,
        [FIELD_ANNOTATIONS.QUERYABLE]: true,
        [API_NAME]: OWNER_ID,
      },
    },
  },
})

const listViewType = createMetadataObjectType({
  annotations: { metadataType: 'ListView' },
  fields: {
    columns: { refType: new ListType(BuiltinTypes.STRING) },
    filters: {
      refType: new ListType(
        createMetadataObjectType({
          annotations: { metadataType: 'ListViewFilters' },
        }),
      ),
    },
  },
})

const fieldSetItemType = createMetadataObjectType({
  annotations: { metadataType: 'FieldSetItem' },
})
const fieldSetType = createMetadataObjectType({
  annotations: { metadataType: 'FieldSet' },
  fields: {
    availableFields: { refType: new ListType(fieldSetItemType) },
    displayedFields: { refType: new ListType(fieldSetItemType) },
  },
})

const compactLayoutType = createMetadataObjectType({
  annotations: { metadataType: 'CompactLayout' },
  fields: {
    fields: { refType: new ListType(BuiltinTypes.STRING) },
  },
})

export const mockTypes = {
  ApexClass: createMetadataObjectType({
    annotations: {
      metadataType: 'ApexClass',
      dirName: 'classes',
      suffix: 'cls',
      hasMetaFile: true,
    },
    fields: {
      content: { refType: BuiltinTypes.STRING },
    },
  }),
  ApexPage: createMetadataObjectType({
    annotations: {
      metadataType: 'ApexPage',
      dirName: 'pages',
      suffix: 'page',
      hasMetaFile: true,
    },
    fields: {
      content: { refType: BuiltinTypes.STRING },
    },
  }),
  ApexTrigger: createMetadataObjectType({
    annotations: {
      metadataType: 'ApexTrigger',
      hasMetaFile: true,
      dirName: 'triggers',
      suffix: 'trigger',
    },
    fields: {
      content: { refType: BuiltinTypes.STRING },
      apiVersion: { refType: BuiltinTypes.NUMBER },
    },
  }),
  ApexComponent: createMetadataObjectType({
    annotations: {
      metadataType: 'ApexComponent',
      hasMetaFile: true,
      dirName: 'components',
      suffix: 'component',
    },
    fields: {
      content: { refType: BuiltinTypes.STRING },
    },
  }),
  AuraDefinitionBundle: createMetadataObjectType({
    annotations: {
      metadataType: 'AuraDefinitionBundle',
      dirName: 'aura',
    },
  }),
  CustomApplication: createMetadataObjectType({
    annotations: {
      metadataType: 'CustomApplication',
    },
  }),
  CustomObject: createMetadataObjectType({
    annotations: {
      metadataType: 'CustomObject',
    },
    fields: {
      listViews: { refType: listViewType },
      fieldSets: { refType: fieldSetType },
      compactLayouts: { refType: compactLayoutType },
    },
  }),
  StaticResource: createMetadataObjectType({
    annotations: {
      metadataType: 'StaticResource',
      dirName: 'staticresources',
      suffix: 'resource',
      hasMetaFile: true,
    },
    fields: {
      content: { refType: BuiltinTypes.STRING },
    },
  }),
  LightningComponentBundle: createMetadataObjectType({
    annotations: {
      metadataType: LIGHTNING_COMPONENT_BUNDLE_METADATA_TYPE,
      dirName: 'lwc',
    },
    fields: {
      targetConfigs: {
        refType: allMissingSubTypes.find(t => t.elemID.typeName === 'TargetConfigs') as TypeElement,
      },
      lwcResources: {
        refType: createMetadataObjectType({
          annotations: { metadataType: 'LwcResources' },
          fields: {
            lwcResource: { refType: new MapType(BuiltinTypes.STRING) },
          },
        }),
      },
    },
  }),
  Layout: createMetadataObjectType({
    annotations: {
      metadataType: 'Layout',
      dirName: 'layouts',
      suffix: 'layout',
    },
  }),
  Profile: createMetadataObjectType({
    annotations: {
      metadataType: 'Profile',
      dirName: 'profiles',
      suffix: 'profile',
    },
  }),
  PermissionSet: createMetadataObjectType({
    annotations: {
      metadataType: 'PermissionSet',
      dirName: 'PermissionSets',
      suffix: 'permissionSet',
    },
  }),
  CustomPermission: createMetadataObjectType({
    annotations: {
      metadataType: 'CustomPermission',
      dirName: 'customPermissions',
      suffix: 'customPermission',
    },
  }),
  EmailFolder: createMetadataObjectType({
    annotations: {
      metadataType: 'EmailFolder',
      dirName: 'email',
      hasMetaFile: true,
      folderContentType: 'EmailTemplate',
    },
  }),
  ReportFolder: createMetadataObjectType({
    annotations: {
      metadataType: 'ReportFolder',
      dirName: 'reports',
      hasMetaFile: true,
      folderContentType: 'Report',
    },
  }),
  DocumentFolder: createMetadataObjectType({
    annotations: {
      metadataType: 'DocumentFolder',
      dirName: 'documents',
      hasMetaFile: true,
      folderContentType: 'Document',
    },
  }),
  DashboardFolder: createMetadataObjectType({
    annotations: {
      metadataType: 'DashboardFolder',
      dirName: 'dashboards',
      hasMetaFile: true,
      folderContentType: 'Dashboard',
    },
  }),
  AssignmentRules: createMetadataObjectType({
    annotations: {
      metadataType: ASSIGNMENT_RULES_METADATA_TYPE,
      dirName: 'assignmentRules',
      suffix: 'assignmentRules',
    },
    fields: {
      assignmentRule: {
        refType: new ListType(
          createMetadataObjectType({
            annotations: { metadataType: 'AssignmentRule' },
          }),
        ),
      },
    },
  }),
  Workflow: createMetadataObjectType({
    annotations: {
      metadataType: WORKFLOW_METADATA_TYPE,
      dirName: 'workflows',
      suffix: 'workflow',
    },
    fields: _.mapValues(WORKFLOW_FIELD_TO_TYPE, typeName => ({
      refType: new ListType(createMetadataObjectType({ annotations: { metadataType: typeName } })),
    })),
  }),
  WorkflowTask: createMetadataObjectType({
    annotations: {
      metadataType: WORKFLOW_TASK_METADATA_TYPE,
      dirName: 'workflows',
      suffix: 'workflow',
    },
  }),
  WorkflowFieldUpdate: createMetadataObjectType({
    annotations: {
      metadataType: WORKFLOW_FIELD_UPDATE_METADATA_TYPE,
      dirName: 'workflows',
      suffix: 'workflow',
    },
  }),
  WorkflowRule: createMetadataObjectType({
    annotations: {
      metadataType: WORKFLOW_RULE_METADATA_TYPE,
      dirName: 'workflows',
      suffix: 'workflow',
    },
    fields: {
      active: {
        refType: BuiltinTypes.BOOLEAN,
      },
    },
  }),
  Settings: createMetadataObjectType({
    annotations: {
      metadataType: SETTINGS_METADATA_TYPE,
      dirName: SETTINGS_DIR_NAME,
      suffix: 'settings',
    },
  }),
  TestSettings: createMetadataObjectType({
    annotations: {
      metadataType: 'TestSettings',
      dirName: SETTINGS_METADATA_TYPE.toLowerCase(), // set to this value upon fetch
      suffix: SETTINGS_METADATA_TYPE.toLowerCase(), // set to this value upon fetch
    },
    isSettings: true,
  }),
  TerritoryModel: createMetadataObjectType({
    annotations: {
      metadataType: 'Territory2Model',
      suffix: 'territory2Model',
      dirName: 'territory2Models',
    },
  }),
  TerritoryRule: createMetadataObjectType({
    annotations: {
      metadataType: 'Territory2Rule',
      suffix: 'territory2Rule',
      dirName: 'territory2Models',
    },
  }),
  CustomMetadata: new ObjectType({
    elemID: new ElemID(SALESFORCE, CUSTOM_METADATA_TYPE_NAME),
    annotations: {
      metadataType: 'CustomMetadata',
      dirName: 'customMetadata',
      suffix: 'md',
    },
    fields: {
      [INSTANCE_FULL_NAME_FIELD]: {
        refType: BuiltinTypes.SERVICE_ID,
      },
    },
  }),
  EmailTemplate: createMetadataObjectType({
    annotations: {
      metadataType: 'EmailTemplate',
      suffix: 'email',
      dirName: 'emails',
      folderType: 'EmailFolder',
    },
    fields: {
      content: { refType: BuiltinTypes.STRING },
      attachments: { refType: new ListType(BuiltinTypes.STRING) },
    },
  }),
  Report: createMetadataObjectType({
    annotations: {
      folderType: 'ReportFolder',
      suffix: 'report',
      dirName: 'reports',
      metadataType: 'Report',
    },
  }),
  Document: createMetadataObjectType({
    annotations: {
      hasMetaFile: true,
      folderType: 'DocumentFolder',
      dirName: 'documents',
      metadataType: 'Document',
    },
  }),
  Dashboard: createMetadataObjectType({
    annotations: {
      folderType: 'DashboardFolder',
      suffix: 'dashboard',
      dirName: 'dashboards',
      metadataType: 'Dashboard',
    },
  }),
  RecordType: createMetadataObjectType({
    annotations: {
      metadataType: 'RecordType',
      dirName: 'RecordType',
      suffix: 'recordType',
    },
  }),
  Flow: createMetadataObjectType({
    annotations: {
      metadataType: 'Flow',
      suffix: 'flow',
      dirName: 'flow',
    },
    fields: {
      status: { refType: BuiltinTypes.STRING },
      actionType: { refType: BuiltinTypes.STRING },
      assignments: {
        refType: new ListType(
          createMetadataObjectType({
            annotations: { metadataType: FLOW_FIELD_TYPE_NAMES.FLOW_ASSIGNMENT_ITEM },
            fields: {
              [ASSIGN_TO_REFERENCE]: {
                refType: BuiltinTypes.STRING,
              },
            },
          }),
        ),
      },
    },
  }),
  FlowDefinition: createMetadataObjectType({
    annotations: {
      metadataType: 'FlowDefinition',
      suffix: 'flowDefinition',
      dirName: 'flowDefinition',
    },
    fields: {
      activeVersionNumber: { refType: BuiltinTypes.NUMBER },
    },
  }),
  QuickAction: createMetadataObjectType({
    annotations: {
      metadataType: 'QuickAction',
      dirName: 'quickActions',
      suffix: 'quickAction',
    },
    fields: {
      optionsCreateFeedItem: { refType: BuiltinTypes.BOOLEAN },
      standardLabel: { refType: BuiltinTypes.STRING },
      type: { refType: BuiltinTypes.STRING },
      targetObject: { refType: BuiltinTypes.STRING },
      quickActionLayout: {
        refType: createMetadataObjectType({
          annotations: {
            metadataType: 'QuickActionLayout',
          },
          fields: {
            layoutSectionStyle: { refType: BuiltinTypes.STRING },
            quickActionLayoutColumns: {
              refType: new ListType(
                createMetadataObjectType({
                  annotations: { metadataType: 'QuickActionLayoutColumn' },
                  fields: {
                    quickActionLayoutItems: {
                      refType: new ListType(BuiltinTypes.STRING),
                    },
                  },
                }),
              ),
            },
          },
        }),
      },
    },
  }),
  FlowSettings: createMetadataObjectType({
    annotations: {
      metadataType: 'FlowSettings',
    },
    fields: {
      enableFlowDeployAsActiveEnabled: { refType: BuiltinTypes.BOOLEAN },
    },
  }),
  [INSTALLED_PACKAGE_METADATA]: createMetadataObjectType({
    annotations: {
      metadataType: INSTALLED_PACKAGE_METADATA,
    },
  }),
  Opportunity: createMetadataObjectType({
    annotations: {
      metadataType: OPPORTUNITY_METADATA_TYPE,
    },
  }),
  Product2: new ObjectType({
    elemID: new ElemID(SALESFORCE, 'Product2'),
    fields: {
      ProductCode: {
        refType: BuiltinTypes.STRING,
        annotations: {
          [API_NAME]: 'Product2.ProductCode',
        },
      },
    },
    annotations: {
      [METADATA_TYPE]: CUSTOM_OBJECT,
      [API_NAME]: 'Product2',
    },
  }),
  [CPQ_QUOTE]: new ObjectType({
    elemID: new ElemID(SALESFORCE, CPQ_QUOTE),
    fields: {
      SBQQ__Primary__c: {
        refType: BuiltinTypes.STRING,
        annotations: {
          [API_NAME]: 'SBQQ__Primary__c',
        },
      },
    },
    annotations: {
      [METADATA_TYPE]: CUSTOM_OBJECT,
      [API_NAME]: CPQ_QUOTE,
    },
  }),
  ApprovalRule: SBAA_APPROVAL_RULE_TYPE,
  ApprovalCondition: createCustomObjectType(SBAA_APPROVAL_CONDITION, {
    fields: {
      [SBAA_APPROVAL_RULE]: {
        refType: Types.primitiveDataTypes.Lookup,
        annotations: {
          [FIELD_ANNOTATIONS.QUERYABLE]: true,
          [FIELD_ANNOTATIONS.CREATABLE]: true,
          [FIELD_ANNOTATIONS.UPDATEABLE]: true,
        },
      },
    },
  }),
  Account: new ObjectType({
    elemID: new ElemID(SALESFORCE, 'Account'),
    fields: {
      Name: {
        refType: BuiltinTypes.STRING,
        annotations: {
          [API_NAME]: 'Account.Name',
        },
      },
    },
    annotations: {
      [METADATA_TYPE]: CUSTOM_OBJECT,
      [API_NAME]: 'Account',
    },
  }),
  User: createCustomObjectType('User', {
    fields: {
      Manager__c: {
        refType: Types.primitiveDataTypes.Hierarchy,
        annotations: {
          [API_NAME]: 'User.Manager__c',
          [FIELD_ANNOTATIONS.QUERYABLE]: true,
          [FIELD_ANNOTATIONS.CREATABLE]: true,
          [FIELD_ANNOTATIONS.UPDATEABLE]: true,
          [FIELD_ANNOTATIONS.RELATIONSHIP_NAME]: 'Manager',
          [FIELD_ANNOTATIONS.REFERENCE_TO]: ['User'],
        },
      },
    },
  }),
  ListView: createMetadataObjectType({
    annotations: {
      metadataType: 'ListView',
      suffix: 'listview',
      dirName: 'listview',
    },
    fields: {
      filter: { refType: BuiltinTypes.STRING },
    },
  }),
  [DUPLICATE_RULE_METADATA_TYPE]: createMetadataObjectType({
    annotations: {
      metadataType: DUPLICATE_RULE_METADATA_TYPE,
      suffix: 'rule',
      dirName: 'rules',
    },
    fields: {
      [INSTANCE_FULL_NAME_FIELD]: { refType: BuiltinTypes.STRING },
      [SORT_ORDER]: { refType: BuiltinTypes.NUMBER },
    },
  }),
  // CustomMetadataRecordType with name MDType__mdt
  CustomMetadataRecordType: new ObjectType({
    elemID: new ElemID(SALESFORCE, 'MDType__mdt'),
    annotations: {
      [API_NAME]: 'MDType__mdt',
      [METADATA_TYPE]: CUSTOM_METADATA,
    },
  }),
  [CPQ_QUOTE]: new ObjectType({
    elemID: new ElemID(SALESFORCE, CPQ_QUOTE),
    fields: {
      Status: {
        refType: BuiltinTypes.STRING,
        annotations: {
          [API_NAME]: 'Quote.Status',
        },
      },
      ProductOption: {
        refType: BuiltinTypes.STRING,
        annotations: {
          [API_NAME]: 'Quote.ProductOption',
        },
      },
    },
    annotations: {
      [METADATA_TYPE]: CUSTOM_OBJECT,
      [API_NAME]: CPQ_QUOTE,
    },
  }),
  CustomLabel: createMetadataObjectType({
    annotations: {
      metadataType: 'CustomLabel',
    },
  }),
  CaseSettings: createCustomObjectType('CaseSettings', {
    fields: {
      defaultCaseOwner: {
        refType: BuiltinTypes.STRING,
      },
      defaultCaseUser: {
        refType: BuiltinTypes.STRING,
      },
      defaultCaseOwnerType: {
        refType: BuiltinTypes.STRING,
      },
    },
  }),
  FolderShare: createCustomObjectType('FolderShare', {
    fields: {
      sharedTo: {
        refType: BuiltinTypes.STRING,
      },
      sharedToType: {
        refType: BuiltinTypes.STRING,
      },
    },
  }),
  WorkflowAlert: createMetadataObjectType({
    annotations: {
      [METADATA_TYPE]: 'WorkflowAlert',
    },
    fields: {
      recipients: {
        refType: new ListType(
          createMetadataObjectType({
            annotations: {
              [METADATA_TYPE]: 'WorkflowEmailRecipient',
            },
            fields: {
              recipient: {
                refType: BuiltinTypes.STRING,
              },
              type: {
                refType: BuiltinTypes.STRING,
              },
            },
          }),
        ),
      },
    },
  }),
  AccountSettings: new ObjectType({
    elemID: new ElemID(SALESFORCE, 'AccountSettings'),
    fields: {
      enableAccountOwnerReport: {
        refType: BuiltinTypes.BOOLEAN,
      },
    },
    annotations: {
      metadataType: 'AccountSettings',
    },
    isSettings: true,
  }),
  PathAssistant: new ObjectType({
    elemID: new ElemID(SALESFORCE, PATH_ASSISTANT_METADATA_TYPE),
    annotations: {
      metadataType: 'PathAssistant',
    },
  }),
  GlobalValueSet: createMetadataObjectType({
    annotations: {
      [METADATA_TYPE]: 'GlobalValueSet',
    },
    fields: {
      customValue: {
        refType: new ListType(
          createMetadataObjectType({
            annotations: {
              [METADATA_TYPE]: 'CustomValue',
            },
          }),
        ),
      },
    },
  }),
  DataCategoryGroup: createMetadataObjectType({
    annotations: {
      [METADATA_TYPE]: 'DataCategoryGroup',
    },
  }),
  ExternalDataSource: createMetadataObjectType({
    annotations: {
      [METADATA_TYPE]: 'ExternalDataSource',
    },
  }),
  SBQQ__Template__c: createCustomObjectType('SBQQ__Template__c', {}),
  SBQQ__LineColumn__c: createCustomObjectType('SBQQ__LineColumn__c', {
    fields: {
      SBQQ__Template__c: {
        refType: Types.primitiveDataTypes.MasterDetail,
        annotations: {
          [API_NAME]: 'SBQQ__LineColumn__c.SBQQ__Template__c',
          [FIELD_ANNOTATIONS.REFERENCE_TO]: ['SBQQ__Template__c'],
          [FIELD_ANNOTATIONS.QUERYABLE]: true,
        },
      },
      SBQQ__FieldName__c: {
        refType: BuiltinTypes.STRING,
        annotations: {
          [FIELD_ANNOTATIONS.QUERYABLE]: true,
        },
      },
    },
  }),
  WebLink: createMetadataObjectType({
    annotations: {
      metadataType: 'WebLink',
      dirName: 'links',
      suffix: 'link',
      hasMetaFile: true,
    },
  }),
  [ORGANIZATION_SETTINGS]: new ObjectType({ elemID: new ElemID(SALESFORCE, ORGANIZATION_SETTINGS) }),
  TestCustomObject__c: createCustomObjectType('TestCustomObject__c', {}),
  TestCustomEvent__e: createCustomObjectType('TestCustomEvent__e', {}),
  BusinessProcess: createMetadataObjectType({
    annotations: {
      metadataType: 'BusinessProcess',
    },
  }),
  [CPQ_PRICE_RULE]: CPQ_PRICE_RULE_TYPE,
  [CPQ_PRICE_CONDITION]: createCustomObjectType(CPQ_PRICE_CONDITION, {
    fields: {
      [CPQ_PRICE_CONDITION_RULE_FIELD]: {
        refType: Types.primitiveDataTypes.Lookup,
        annotations: {
          [FIELD_ANNOTATIONS.QUERYABLE]: true,
          [FIELD_ANNOTATIONS.CREATABLE]: true,
          [FIELD_ANNOTATIONS.UPDATEABLE]: true,
        },
      },
    },
  }),
  [CPQ_PRODUCT_RULE]: CPQ_PRODUCT_RULE_TYPE,
  StandardValueSet: createMetadataObjectType({
    annotations: {
      metadataType: 'StandardValueSet',
      dirName: 'standardValueSets',
      suffix: 'svs',
      hasMetaFile: true,
    },
  }),
  [CPQ_ERROR_CONDITION]: createCustomObjectType(CPQ_ERROR_CONDITION, {
    fields: {
      [CPQ_ERROR_CONDITION_RULE_FIELD]: {
        refType: Types.primitiveDataTypes.Lookup,
        annotations: {
          [FIELD_ANNOTATIONS.QUERYABLE]: true,
          [FIELD_ANNOTATIONS.CREATABLE]: true,
          [FIELD_ANNOTATIONS.UPDATEABLE]: true,
        },
      },
    },
  }),
  [CPQ_QUOTE_TERM]: CPQ_QUOTE_TERM_TYPE,
  [CPQ_TERM_CONDITION]: createCustomObjectType(CPQ_TERM_CONDITION, {
    fields: {
      [CPQ_QUOTE_TERM]: {
        refType: Types.primitiveDataTypes.Lookup,
        annotations: {
          [FIELD_ANNOTATIONS.QUERYABLE]: true,
          [FIELD_ANNOTATIONS.CREATABLE]: true,
          [FIELD_ANNOTATIONS.UPDATEABLE]: true,
        },
      },
      [CPQ_INDEX_FIELD]: {
        refType: BuiltinTypes.NUMBER,
        annotations: {
          [FIELD_ANNOTATIONS.QUERYABLE]: true,
          [FIELD_ANNOTATIONS.CREATABLE]: true,
          [FIELD_ANNOTATIONS.UPDATEABLE]: true,
        },
      },
    },
  }),
  FieldInstance: createMetadataObjectType({
    annotations: {
      metadataType: 'FieldInstance',
    },
    fields: {
      fieldItem: { refType: BuiltinTypes.STRING },
    },
  }),
  [LIVE_CHAT_BUTTON]: createMetadataObjectType({
    annotations: {
      metadataType: LIVE_CHAT_BUTTON,
    },
    fields: {
      skills: {
        refType: BuiltinTypes.STRING,
      },
      routingType: {
        refType: BuiltinTypes.STRING,
      },
    },
  }),
  [APPROVAL_PROCESS_METADATA_TYPE]: createMetadataObjectType({
    annotations: {
      metadataType: APPROVAL_PROCESS_METADATA_TYPE,
    },
  }),
  [VALIDATION_RULES_METADATA_TYPE]: createMetadataObjectType({
    annotations: {
      metadataType: VALIDATION_RULES_METADATA_TYPE,
    },
    fields: {
      errorConditionFormula: {
        refType: BuiltinTypes.STRING,
      },
    },
  }),
}

export const lwcJsResourceContent = Buffer.from(
  "import { LightningElement } from 'lwc';\nexport default class BikeCard extends LightningElement {\n   name = 'Electra X4';\n   description = 'A sweet bike built for comfort.';\n   category = 'Mountain';\n   material = 'Steel';\n   price = '$2,700';\n   pictureUrl = 'https://s3-us-west-1.amazonaws.com/sfdc-demo/ebikes/electrax4.jpg';\n }",
)
export const lwcHtmlResourceContent = Buffer.from(
  '<template>\n    <div>\n        <div>Name: {name}</div>\n        <div>Description: {description}</div>\n        <lightning-badge label={material}></lightning-badge>\n        <lightning-badge label={category}></lightning-badge>\n        <div>Price: {price}</div>\n        <div><img src={pictureUrl}/></div>\n    </div>\n</template>',
)

export const mockDefaultValues = {
  ApexClass: {
    [INSTANCE_FULL_NAME_FIELD]: 'ApexClassForProfile',
    apiVersion: API_VERSION,
    content:
      "public class ApexClassForProfile {\n    public void printLog() {\n        System.debug('Created');\n    }\n}",
  },
  ApexPage: {
    [INSTANCE_FULL_NAME_FIELD]: 'ApexPageForProfile',
    apiVersion: API_VERSION,
    content: '<apex:page>Created by e2e test for profile test!</apex:page>',
    label: 'ApexPageForProfile',
    internalId: 'ApexPageId',
  },
  AuraDefinitionBundle: {
    [INSTANCE_FULL_NAME_FIELD]: 'TestAuraDefinitionBundle',
    SVGContent:
      '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<svg width="120px" height="120px" viewBox="0 0 120 120" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n\t<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">\n\t\t<path d="M120,108 C120,114.6 114.6,120 108,120 L12,120 C5.4,120 0,114.6 0,108 L0,12 C0,5.4 5.4,0 12,0 L108,0 C114.6,0 120,5.4 120,12 L120,108 L120,108 Z" id="Shape" fill="#2A739E"/>\n\t\t<path d="M77.7383308,20 L61.1640113,20 L44.7300055,63.2000173 L56.0543288,63.2000173 L40,99.623291 L72.7458388,54.5871812 L60.907727,54.5871812 L77.7383308,20 Z" id="Path-1" fill="#FFFFFF"/>\n\t</g>\n</svg>',
    apiVersion: 49,
    controllerContent: '({ myAction : function(component, event, helper) {} })',
    description: 'Test Lightning Component Bundle',
    designContent: '<design:component/>',
    documentationContent:
      '<aura:documentation>\n\t<aura:description>Documentation</aura:description>\n\t<aura:example name="ExampleName" ref="exampleComponentName" label="Label">\n\t\tEdited Example Description\n\t</aura:example>\n</aura:documentation>',
    helperContent: '({ helperMethod : function() {} })',
    markup: '<aura:component >\n\t<p>Hello Lightning!</p>\n</aura:component>',
    rendererContent: '({})',
    styleContent: '.THIS{\n}',
    type: 'Component',
  },
  LightningComponentBundle: {
    [INSTANCE_FULL_NAME_FIELD]: 'testLightningComponentBundle',
    apiVersion: 49,
    isExposed: true,
    lwcResources: {
      lwcResource: {
        'testLightningComponentBundle_js@v': {
          source: lwcJsResourceContent,
          filePath: 'lwc/testLightningComponentBundle/testLightningComponentBundle.js',
        },
        'testLightningComponentBundle_html@v': {
          source: lwcHtmlResourceContent,
          filePath: 'lwc/testLightningComponentBundle/testLightningComponentBundle.html',
        },
      },
    },
    targetConfigs: {
      targetConfig: [
        {
          objects: [
            {
              object: 'Contact',
            },
          ],
          targets: 'lightning__RecordPage',
        },
        {
          supportedFormFactors: {
            supportedFormFactor: [
              {
                type: 'Small',
              },
            ],
          },
          targets: 'lightning__AppPage,lightning__HomePage',
        },
      ],
    },
    targets: {
      target: ['lightning__AppPage', 'lightning__RecordPage', 'lightning__HomePage'],
    },
  },
  Profile: {
    fieldPermissions: {
      Lead: {
        Fax: {
          field: 'Lead.Fax',
          readable: true,
          editable: false,
        },
      },
      Account: {
        AccountNumber: {
          editable: false,
          field: 'Account.AccountNumber',
          readable: false,
        },
      },
    },
    objectPermissions: {
      Account: {
        allowCreate: true,
        allowDelete: true,
        allowEdit: true,
        allowRead: true,
        modifyAllRecords: false,
        viewAllRecords: false,
        object: 'Account',
      },
    },
    tabVisibilities: [
      {
        tab: 'standard-Account',
        visibility: 'DefaultOff',
      },
    ],
    userPermissions: {
      ConvertLeads: {
        enabled: false,
        name: 'ConvertLeads',
      },
    },
    applicationVisibilities: {
      standard__ServiceConsole: {
        application: 'standard__ServiceConsole',
        default: false,
        visible: true,
      },
    },
    pageAccesses: {
      ApexPageForProfile: {
        apexPage: 'ApexPageForProfile',
        enabled: false,
      },
    },
    classAccesses: {
      ApexClassForProfile: {
        apexClass: 'ApexClassForProfile',
        enabled: false,
      },
    },
    loginHours: {
      sundayStart: 480,
      sundayEnd: 1380,
    },
    description: 'new e2e profile',
    [INSTANCE_FULL_NAME_FIELD]: 'TestAddProfileInstance__c',
  },
  StaticResource: {
    [INSTANCE_FULL_NAME_FIELD]: 'TestStaticResource',
    cacheControl: 'Private',
    contentType: 'text/xml',
    description: 'Test Static Resource Description',
    content: Buffer.from('<xml/>'),
  },
  [INSTALLED_PACKAGE_METADATA]: {
    [INSTANCE_FULL_NAME_FIELD]: 'test_namespace',
  },
  DataCategoryGroup: {
    [INSTANCE_FULL_NAME_FIELD]: 'TestDataCategoryGroup',
  },
  BusinessProcess: {
    [INSTANCE_FULL_NAME_FIELD]: 'Opportunity.TestBusinessProposal',
    active: true,
    description: 'Test Business Proposal Description',
  },
  WorkflowFieldUpdate: {
    [INSTANCE_FULL_NAME_FIELD]: 'TestWorkflowFieldUpdate',
    actionName: 'TestWorkflowFieldUpdate',
    description: 'Test Workflow Field Update Description',
    assignedTo: 'TestUser',
    status: 'Completed',
  },
  StandardValueSet: {
    [INSTANCE_FULL_NAME_FIELD]: 'TestStandardValueSet',
    sorted: false,
    standardValue: [
      {
        fullName: 'TestStandardValue1',
        default: true,
        label: 'Test Standard Value 1',
      },
      {
        fullName: 'TestStandardValue2',
        default: false,
        label: 'Test Standard Value 2',
      },
    ],
  },
}

// Intentionally let typescript infer the return type here to avoid repeating
// the definitions from the constants above
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const mockInstances = () => ({
  ..._.mapValues(mockDefaultValues, (values, typeName) =>
    createInstanceElement(values, mockTypes[typeName as keyof typeof mockDefaultValues]),
  ),
  [CHANGED_AT_SINGLETON]: new InstanceElement(ElemID.CONFIG_NAME, ArtificialTypes.ChangedAtSingleton),
})

export const createFlowChange = ({
  flowApiName,
  beforeStatus,
  afterStatus,
  additionalModifications = false,
}: {
  flowApiName: string
  beforeStatus?: string
  afterStatus?: string
  additionalModifications?: boolean
}): Change<InstanceElement> => {
  let beforeInstance: InstanceElement | undefined
  let afterInstance: InstanceElement | undefined
  if (beforeStatus) {
    beforeInstance = createInstanceElement(
      {
        [INSTANCE_FULL_NAME_FIELD]: flowApiName,
        [STATUS]: beforeStatus,
        [LABEL]: flowApiName,
      },
      mockTypes.Flow,
    )
  }
  if (afterStatus) {
    afterInstance = createInstanceElement(
      {
        [INSTANCE_FULL_NAME_FIELD]: flowApiName,
        [STATUS]: afterStatus,
        [LABEL]: `${flowApiName}${additionalModifications ? 'Modified' : ''}`,
      },
      mockTypes.Flow,
    )
  }
  return toChange({ before: beforeInstance, after: afterInstance })
}
