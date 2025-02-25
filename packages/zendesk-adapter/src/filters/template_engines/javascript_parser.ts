/*
 * Copyright 2025 Salto Labs Ltd.
 * Licensed under the Salto Terms of Use (the "License");
 * You may not use this file except in compliance with the License.  You may obtain a copy of the License at https://www.salto.io/terms-of-use
 *
 * CERTAIN THIRD PARTY SOFTWARE MAY BE CONTAINED IN PORTIONS OF THE SOFTWARE. See NOTICE FILE AT https://github.com/salto-io/salto/blob/main/NOTICES
 */
import { InstanceElement, TemplateExpression, TemplatePart } from '@salto-io/adapter-api'
import { PotentialReference, createTemplateExpression } from '@salto-io/adapter-utils'
import { logger } from '@salto-io/logging'
import { CallExpression, parse, SourceLocation, VariableDeclaration } from 'acorn'
import { simple as walkSimple } from 'acorn-walk'
import { extractIdIfElementExists, findLineStartIndexes, sourceLocationToIndexRange } from './utils'

const log = logger(module)

const matchVariableDeclarationWithPrefix = (
  node: VariableDeclaration,
  prefix: string,
  matches: { value: string; loc: SourceLocation }[],
): void => {
  node.declarations.forEach(declarationNode => {
    if (
      declarationNode.id.type === 'Identifier' &&
      declarationNode.id.name.startsWith(prefix) &&
      declarationNode.init &&
      ['Literal', 'ArrayExpression'].includes(declarationNode.init.type)
    ) {
      if (declarationNode.init.loc === undefined || declarationNode.init.loc === null) {
        log.warn('Could not find location for variable declaration')
      } else if (declarationNode.init.type === 'Literal' && declarationNode.init.value) {
        matches.push({
          value: (declarationNode.init.raw ?? declarationNode.init.value).toString(),
          loc: declarationNode.init.loc,
        })
      } else if (declarationNode.init.type === 'ArrayExpression') {
        declarationNode.init.elements.forEach(element => {
          if (element != null && element.type === 'Literal' && element.value && element.loc) {
            matches.push({
              value: (element.raw ?? element.value).toString(),
              loc: element.loc,
            })
          }
        })
      }
    }
  })
}
const matchJQuerySelector = (node: CallExpression, matches: { value: string; loc: SourceLocation }[]): void => {
  const { callee } = node
  if (callee.type === 'Identifier' && callee.name === '$' && node.arguments.length === 1) {
    const selectorArg = node.arguments[0]
    if (selectorArg && selectorArg.type === 'Literal' && typeof selectorArg.value === 'string') {
      if (selectorArg.loc === undefined || selectorArg.loc === null) {
        log.warn('Could not find location for jQuery selector')
      } else {
        matches.push({ value: selectorArg.raw ?? selectorArg.value, loc: selectorArg.loc })
      }
    }
  }
}

const parsePotentialExpressions = (content: string, prefix: string): { value: string; loc: SourceLocation }[] => {
  const matches: { value: string; loc: SourceLocation }[] = []
  const ast = parse(content, { ecmaVersion: 2020, locations: true })

  walkSimple(ast, {
    VariableDeclaration(node) {
      matchVariableDeclarationWithPrefix(node, prefix, matches)
    },
    CallExpression(node) {
      matchJQuerySelector(node, matches)
    },
  })

  return matches
}

export const parsePotentialReferencesByPrefix = (
  content: string,
  idsToElements: Record<string, InstanceElement>,
  prefix: string,
): PotentialReference<TemplateExpression>[] => {
  const expressionToTemplateParts = (expression: string): TemplatePart[] =>
    expression.split(/(\d+)/).map(id => extractIdIfElementExists(idsToElements, id))
  try {
    const expressionMatches = parsePotentialExpressions(content, prefix)

    const newlineIndexes = findLineStartIndexes(content)
    return expressionMatches.map(expression => ({
      value: createTemplateExpression({
        parts: expressionToTemplateParts(expression.value),
      }),
      loc: sourceLocationToIndexRange(newlineIndexes, expression.loc),
    }))
  } catch (e) {
    log.warn('Failed to parse potential references by prefix with %o', e)
    return []
  }
}
