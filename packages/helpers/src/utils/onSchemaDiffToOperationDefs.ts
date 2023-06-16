import _ from 'lodash'

import {
  getOperationNodesForFieldAstBySchema,
  type OperationNodesForFieldAstBySchemaReturnType,
} from './getOperationNodesForFieldAstBySchema'
import {
  BreakingChangeType,
  findBreakingChanges,
  OperationStatusTypeEnum,
} from './schemaDiff'

import type { ChangeListType } from './schemaDiff'
import type { GraphQLSchema } from 'graphql'

export type OnSchemaDiffToOperationDefsItem = {
  type: OperationStatusTypeEnum
  operationComment?: string
  operationType?: string
  operationName?: string
  routePath: string
  descriptionList: string[]
}

export function onSchemaDiffToOperationDefs(
  leftSchema: GraphQLSchema,
  rightSchema: GraphQLSchema,
): OnSchemaDiffToOperationDefsItem[] {
  const result = []

  const operationChangeList = findBreakingChanges(leftSchema, rightSchema)

  const operationFields: OperationNodesForFieldAstBySchemaReturnType[] =
    getOperationNodesForFieldAstBySchema(rightSchema)

  const operationNamedTypeListInfo = operationFields.map(item => ({
    // @ts-ignore
    operationComment: item?.operationDefNodeAst?.descriptionText,
    operationType: item?.operationDefNodeAst?.operation,
    operationName: item?.operationDefNodeAst?.name?.value,
    namedTypeList: item?.operationDefNodeAst?.namedTypeList,
    variableTypeList: item?.operationDefNodeAst?.variableTypeList,
  }))

  const routeTypes = operationNamedTypeListInfo.map(item => {
    return {
      operationComment: item?.operationComment,
      operationType: item?.operationType,
      operationName: item?.operationName,
      routePath: item?.operationType + item?.operationName,
      nameTypes: [
        ...(item.namedTypeList || []),
        ...(item.variableTypeList || []),
      ],
    }
  })

  const changeList: ChangeListType[] = []
  operationChangeList.forEach(item => {
    if (item?.routePath) {
      const res = routeTypes.find(val => {
        return val?.routePath === item?.routePath
      })

      const typeNameAndType = formatRoutePath(item?.routePath)

      changeList.push({
        operationComment: res?.operationComment,
        operationType: typeNameAndType?.operationType,
        operationName: typeNameAndType?.operationName,
        type:
          // 这里其实还要算上 "!!item?.routePath" 条件
          item.type === BreakingChangeType.FIELD_REMOVED ||
          item.type === BreakingChangeType.FIELD_ADDED
            ? item.type
            : undefined,
        description: item.description,
        routePath: item?.routePath,
      })
    }

    const existRoute = routeTypes.filter(itm =>
      itm.nameTypes.includes(item?.typeName as string),
    )

    if (existRoute.length === 1) {
      changeList.push({
        operationComment: existRoute[0]?.operationComment,
        operationType: existRoute[0]?.operationType,
        operationName: existRoute[0]?.operationName,
        description: item.description,
        routePath: existRoute[0]?.routePath,
      })
    } else if (existRoute.length > 1) {
      const existRouteResult = existRoute.map(routeItem => ({
        operationComment: routeItem?.operationComment,
        operationType: routeItem?.operationType,
        operationName: routeItem?.operationName,
        description: item.description,
        routePath: routeItem?.routePath,
      }))

      changeList.push(...existRouteResult)
    }
  })

  const tmpChanges = _.groupBy(changeList, 'routePath') || {}

  for (const key in tmpChanges) {
    const element = tmpChanges[key]
    result.push({
      operationComment: element[0]?.operationComment,
      operationType: element[0]?.operationType,
      operationName: element[0]?.operationName,
      routePath: key,
      type: element.find(ele => ele?.type)?.type,
      descriptionList: element?.map(val => val?.description) || [],
    })
  }

  const tmpResult = result.map(operation => {
    if (operation.type === BreakingChangeType.FIELD_REMOVED) {
      return {
        ...operation,
        type: OperationStatusTypeEnum.DELETED,
      }
    }

    if (operation.type === BreakingChangeType.FIELD_ADDED) {
      return {
        ...operation,
        type: OperationStatusTypeEnum.ADDED,
      }
    }

    return {
      ...operation,
      type: OperationStatusTypeEnum.EDITED,
    }
  })

  return tmpResult
}

function formatRoutePath(str: string) {
  const mutationArr = str.split('mutation')
  const queryArr = str.split('query')

  if (queryArr[1]) {
    return {
      operationType: 'query',
      operationName: queryArr[1],
    }
  } else if (!queryArr[1]) {
    return {
      operationType: 'mutation',
      operationName: mutationArr[1],
    }
  }

  if (mutationArr[1]) {
    return {
      operationType: 'mutation',
      operationName: mutationArr[1],
    }
  } else if (!mutationArr[1]) {
    return {
      operationType: 'query',
      operationName: mutationArr[0],
    }
  }

  return {}
}
