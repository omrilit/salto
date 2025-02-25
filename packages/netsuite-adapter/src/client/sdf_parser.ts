/*
 * Copyright 2025 Salto Labs Ltd.
 * Licensed under the Salto Terms of Use (the "License");
 * You may not use this file except in compliance with the License.  You may obtain a copy of the License at https://www.salto.io/terms-of-use
 *
 * CERTAIN THIRD PARTY SOFTWARE MAY BE CONTAINED IN PORTIONS OF THE SOFTWARE. See NOTICE FILE AT https://github.com/salto-io/salto/blob/main/NOTICES
 */
import _ from 'lodash'
import os from 'os'
import osPath from 'path'
import he from 'he'
import { XMLBuilder, XMLParser } from 'fast-xml-parser'
import readdirp from 'readdirp'
import { logger } from '@salto-io/logging'
import { promises, collections } from '@salto-io/lowerdash'
import { exists, readFile } from '@salto-io/file'
import {
  CustomTypeInfo,
  CustomizationInfo,
  FileCabinetCustomizationInfo,
  FileCustomizationInfo,
  FolderCustomizationInfo,
  TemplateCustomTypeInfo,
} from './types'
import { CONFIG_FEATURES, FILE_CABINET_PATH_SEPARATOR } from '../constants'
import { CDATA_TAG_NAME } from './constants'
import { isFileCustomizationInfo, XML_BUILDER_DEFAULT_OPTIONS, XML_PARSER_DEFAULT_OPTIONS } from './utils'

const log = logger(module)
const { withLimitedConcurrency } = promises.array
const { makeArray } = collections.array

export const SRC_DIR = 'src'
export const FILE_CABINET_DIR = 'FileCabinet'
export const OBJECTS_DIR = 'Objects'
const ACCOUNT_CONFIGURATION_DIR = 'AccountConfiguration'

const MANIFEST_XML = 'manifest.xml'
const DEPLOY_XML = 'deploy.xml'
export const FEATURES_XML = 'features.xml'
const FEATURES_TAG = 'features'
export const FEATURES_LIST_TAG = 'feature'

export const READ_CONCURRENCY = 100
export const ADDITIONAL_FILE_PATTERN = '.template.'
const XML_FILE_SUFFIX = '.xml'
export const ATTRIBUTES_FOLDER_NAME = '.attributes'
export const FOLDER_ATTRIBUTES_FILE_SUFFIX = `.folder.attr${XML_FILE_SUFFIX}`
export const ATTRIBUTES_FILE_SUFFIX = `.attr${XML_FILE_SUFFIX}`
const FILE_SEPARATOR = '.'

const DEFAULT_FILE_ATTRIBUTES =
  `<file>${os.EOL}` +
  `  <availablewithoutlogin>F</availablewithoutlogin>${os.EOL}` +
  `  <bundleable>F</bundleable>${os.EOL}` +
  `  <description></description>${os.EOL}` +
  `  <generateurltimestamp>F</generateurltimestamp>${os.EOL}` +
  `  <hideinbundle>F</hideinbundle>${os.EOL}` +
  `  <isinactive>F</isinactive>${os.EOL}` +
  `</file>${os.EOL}`

const DEFAULT_FOLDER_ATTRIBUTES =
  `<folder>${os.EOL}` +
  `  <bundleable>F</bundleable>${os.EOL}` +
  `  <description></description>${os.EOL}` +
  `  <isinactive>F</isinactive>${os.EOL}` +
  `  <isprivate>F</isprivate>${os.EOL}` +
  `</folder>${os.EOL}`

const xmlParser = new XMLParser({
  ...XML_PARSER_DEFAULT_OPTIONS,
  // CDATA sometimes includes inner XML which we don't want to decode here.
  // Separating out CDATA content to its own tag causes the parser to not run
  // the tag value processor on it due to an implementation quirk.
  cdataPropName: CDATA_TAG_NAME,
  tagValueProcessor: (_name, val) => he.decode(val),
})

export const getSrcDirPath = (projectPath: string): string => osPath.resolve(projectPath, SRC_DIR)

const getObjectsDirPath = (projectPath: string): string => osPath.resolve(projectPath, SRC_DIR, OBJECTS_DIR)

export const getFileCabinetDirPath = (projectPath: string): string =>
  osPath.resolve(projectPath, SRC_DIR, FILE_CABINET_DIR)

export const getManifestFilePath = (projectPath: string): string => osPath.resolve(projectPath, SRC_DIR, MANIFEST_XML)

export const getDeployFilePath = (projectPath: string): string => osPath.resolve(projectPath, SRC_DIR, DEPLOY_XML)

export const getFeaturesXmlPath = (projectPath: string): string =>
  osPath.resolve(projectPath, SRC_DIR, ACCOUNT_CONFIGURATION_DIR, FEATURES_XML)

type XMLNode = { [k: string]: XMLNode } | XMLNode[] | string

const isComplexXMLNode = (node: XMLNode): node is Record<string, XMLNode> => _.isPlainObject(node)
const hasCDATAOnly = (values: Record<string, XMLNode>): values is { [CDATA_TAG_NAME]: XMLNode } => {
  const keys = Object.keys(values)
  return keys.length === 1 && keys[0] === CDATA_TAG_NAME
}
const hasStringCDATAOnly = (values: Record<string, XMLNode>): values is { [CDATA_TAG_NAME]: string } =>
  hasCDATAOnly(values) && typeof values[CDATA_TAG_NAME] === 'string'

const flattenCDATA = (values: XMLNode): XMLNode => {
  if (_.isArray(values)) {
    return values.map(flattenCDATA)
  }

  if (isComplexXMLNode(values)) {
    if (hasStringCDATAOnly(values)) {
      return values[CDATA_TAG_NAME]
    }

    return _.mapValues(values, flattenCDATA)
  }

  return values
}

const convertToCustomizationInfo = (xmlContent: string): CustomizationInfo => {
  // We need to remove all CDATA tags we added to avoid decoding.
  const parsedXmlValues = flattenCDATA(xmlParser.parse(xmlContent)) as Record<string, Record<string, XMLNode>>
  const typeName = Object.keys(parsedXmlValues)[0]
  return { typeName, values: parsedXmlValues[typeName] }
}

const convertToCustomTypeInfo = (xmlContent: string, scriptId: string): CustomTypeInfo => ({
  ...convertToCustomizationInfo(xmlContent),
  scriptId,
})

const convertToTemplateCustomTypeInfo = (
  xmlContent: string,
  scriptId: string,
  fileExtension: string,
  fileContent: Buffer,
): TemplateCustomTypeInfo => ({
  ...convertToCustomizationInfo(xmlContent),
  scriptId,
  fileContent,
  fileExtension,
})

const convertToFileCustomizationInfo = ({
  xmlContent,
  path,
  fileContent,
}: {
  xmlContent: string
  path: string[]
  fileContent: Buffer
}): FileCustomizationInfo => ({
  ...convertToCustomizationInfo(xmlContent),
  typeName: 'file',
  path,
  fileContent,
})

const convertToFolderCustomizationInfo = ({
  xmlContent,
  path,
}: {
  xmlContent: string
  path: string[]
}): FolderCustomizationInfo => ({
  ...convertToCustomizationInfo(xmlContent),
  typeName: 'folder',
  path,
})

const xmlBuilder = new XMLBuilder({
  ...XML_BUILDER_DEFAULT_OPTIONS,
  // We convert to an unformatted xml since the CDATA transformation is wrong when formatting.
  format: false,
  cdataPropName: CDATA_TAG_NAME,
  tagValueProcessor: (_name, val) => he.encode(String(val)),
})

export const convertToXmlContent = (customizationInfo: CustomizationInfo): string =>
  xmlBuilder.build({ [customizationInfo.typeName]: customizationInfo.values })

const transformCustomObject = async (
  scriptId: string,
  objectFileNames: string[],
  objectsDirPath: string,
): Promise<CustomTypeInfo> => {
  const [[additionalFilename], [contentFilename]] = _.partition(objectFileNames, filename =>
    filename.includes(ADDITIONAL_FILE_PATTERN),
  )
  const xmlContent = await readFile(osPath.resolve(objectsDirPath, contentFilename))
  if (additionalFilename === undefined) {
    return convertToCustomTypeInfo(xmlContent.toString(), scriptId)
  }
  const additionalFileContent = await readFile(osPath.resolve(objectsDirPath, additionalFilename))
  return convertToTemplateCustomTypeInfo(
    xmlContent.toString(),
    scriptId,
    additionalFilename.split(FILE_SEPARATOR)[2],
    additionalFileContent,
  )
}

const listFilesRecursive = async (dirPath: string): Promise<string[]> =>
  // TODO: SALTO-4200 support also windows path style
  (await readdirp.promise(dirPath, { type: 'files' })).map(file => file.path)

export const parseObjectsDir = async (projectPath: string): Promise<CustomTypeInfo[]> => {
  const objectsDirPath = getObjectsDirPath(projectPath)
  const filenames = await listFilesRecursive(objectsDirPath)
  const scriptIdToFiles = _.groupBy(filenames, filename => filename.split(FILE_SEPARATOR)[0])

  return withLimitedConcurrency(
    Object.entries(scriptIdToFiles).map(
      ([scriptId, objectFileNames]) =>
        () =>
          transformCustomObject(scriptId, objectFileNames, objectsDirPath),
    ),
    READ_CONCURRENCY,
  )
}

const transformFiles = (
  filePaths: string[],
  fileAttrsPaths: string[],
  fileCabinetDirPath: string,
): Promise<FileCustomizationInfo[]> => {
  const filePathToAttrsPath = Object.fromEntries(
    fileAttrsPaths.map(fileAttrsPath => {
      const fileName = fileAttrsPath
        .split(FILE_CABINET_PATH_SEPARATOR)
        .slice(-1)[0]
        .slice(0, -ATTRIBUTES_FILE_SUFFIX.length)

      const folderName = fileAttrsPath.split(ATTRIBUTES_FOLDER_NAME)[0]
      return [`${folderName}${fileName}`, fileAttrsPath]
    }),
  )

  const transformFile = async (filePath: string): Promise<FileCustomizationInfo> => {
    const attrsPathParts = filePathToAttrsPath[filePath]
    const fileAttributesContextPromise =
      attrsPathParts !== undefined
        ? readFile(osPath.resolve(fileCabinetDirPath, ...attrsPathParts.split(FILE_CABINET_PATH_SEPARATOR)))
        : undefined

    const filePathParts = filePath.split(FILE_CABINET_PATH_SEPARATOR)
    const fileContentPromise = readFile(osPath.resolve(fileCabinetDirPath, ...filePathParts))

    const [xmlContent, fileContent] = await Promise.all([fileAttributesContextPromise, fileContentPromise])
    return convertToFileCustomizationInfo({
      xmlContent: xmlContent?.toString() ?? DEFAULT_FILE_ATTRIBUTES,
      path: filePathParts.slice(1),
      fileContent,
    })
  }

  return withLimitedConcurrency(
    filePaths.map(filePath => () => transformFile(filePath)),
    READ_CONCURRENCY,
  )
}

const transformFolders = (
  folderAttrsPaths: string[],
  fileCabinetDirPath: string,
): Promise<FolderCustomizationInfo[]> => {
  const transformFolder = async (folderAttrsPath: string): Promise<FolderCustomizationInfo> => {
    const folderPathParts = folderAttrsPath.split(FILE_CABINET_PATH_SEPARATOR)
    const xmlContent = await readFile(osPath.resolve(fileCabinetDirPath, ...folderPathParts))
    return convertToFolderCustomizationInfo({
      xmlContent: xmlContent.toString(),
      path: folderPathParts.slice(1, -2),
    })
  }

  return withLimitedConcurrency(
    folderAttrsPaths.map(folderAttrsPath => () => transformFolder(folderAttrsPath)),
    READ_CONCURRENCY,
  )
}

const transformFoldersWithoutAttributes = (
  foldersFromAttributes: FolderCustomizationInfo[],
  filePaths: string[],
): FolderCustomizationInfo[] => {
  const foldersFromAttributesPaths = new Set(
    foldersFromAttributes.map(folder => folder.path.join(FILE_CABINET_PATH_SEPARATOR)),
  )
  return (
    _(filePaths)
      .map(path => path.split(FILE_CABINET_PATH_SEPARATOR))
      .map(path => path.slice(1, -1))
      // adding all parent folders
      .flatMap(path => path.map((_p, i) => path.slice(0, i + 1)))
      .map(path => path.join(FILE_CABINET_PATH_SEPARATOR))
      .uniq()
      .filter(path => !foldersFromAttributesPaths.has(path))
      .map(path => path.split(FILE_CABINET_PATH_SEPARATOR))
      .map(path =>
        convertToFolderCustomizationInfo({
          xmlContent: DEFAULT_FOLDER_ATTRIBUTES,
          path,
        }),
      )
      .value()
  )
}

export const parseFileCabinetDir = async (
  projectPath: string,
  pathsToImport?: string[],
): Promise<FileCabinetCustomizationInfo[]> => {
  const fileCabinetDirPath = getFileCabinetDirPath(projectPath)
  const [attributesPaths, filePaths] = _.partition(
    pathsToImport ??
      (await listFilesRecursive(fileCabinetDirPath)).map(path => `${FILE_CABINET_PATH_SEPARATOR}${path}`),
    p => p.endsWith(ATTRIBUTES_FILE_SUFFIX),
  )
  const [folderAttrsPaths, fileAttrsPaths] = _.partition(attributesPaths, p =>
    p.endsWith(FOLDER_ATTRIBUTES_FILE_SUFFIX),
  )

  const [filesRes, foldersRes] = await Promise.all([
    transformFiles(filePaths, fileAttrsPaths, fileCabinetDirPath),
    transformFolders(folderAttrsPaths, fileCabinetDirPath),
  ])
  return [...filesRes, ...foldersRes, ...transformFoldersWithoutAttributes(foldersRes, filePaths)]
}

export const parseFeaturesXml = async (projectPath: string): Promise<CustomizationInfo | undefined> => {
  const filePath = getFeaturesXmlPath(projectPath)
  if (!(await exists(filePath))) {
    log.debug('features xml does not exists')
    return undefined
  }
  const xmlContent = await readFile(filePath)
  const featuresXml = xmlParser.parse(xmlContent.toString())

  const featuresList = makeArray(featuresXml[FEATURES_TAG]?.[FEATURES_LIST_TAG])
  return {
    typeName: CONFIG_FEATURES,
    values: {
      [FEATURES_LIST_TAG]: featuresList,
    },
  }
}

export const parseSdfProjectDir = async (projectPath: string): Promise<CustomizationInfo[]> => {
  const customObjects = await parseObjectsDir(projectPath)
  const fileCabinetObjects = await parseFileCabinetDir(projectPath)
  const featuresObject = await parseFeaturesXml(projectPath)
  return [...customObjects, ...fileCabinetObjects, ...(featuresObject !== undefined ? [featuresObject] : [])]
}

export const convertToFeaturesXmlContent = (customizationInfo: CustomizationInfo): string => {
  const featuresList = customizationInfo.values[FEATURES_LIST_TAG]
  return convertToXmlContent({
    typeName: FEATURES_TAG,
    values: {
      [FEATURES_LIST_TAG]: featuresList,
    },
  })
}

export const getFileCabinetCustomInfoPath = (
  dirPath: string,
  fileCabinetCustTypeInfo: FileCabinetCustomizationInfo,
): string => {
  if (isFileCustomizationInfo(fileCabinetCustTypeInfo)) {
    return osPath.resolve(dirPath, FILE_CABINET_DIR, ...fileCabinetCustTypeInfo.path.slice(0, -1))
  }
  return osPath.resolve(dirPath, FILE_CABINET_DIR, ...fileCabinetCustTypeInfo.path)
}

export const getCustomTypeInfoPath = (
  dirPath: string,
  customTypeInfo: CustomTypeInfo,
  fileExtension = XML_FILE_SUFFIX,
): string => osPath.resolve(dirPath, OBJECTS_DIR, `${customTypeInfo.scriptId}${fileExtension}`)
