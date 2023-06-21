import { OperationTypeNode, type GraphQLSchema } from 'graphql'

import { buildOperationNodeForField } from './buildOperationNodeForField'

import type { OperationNodesForFieldAstBySchemaReturnType } from './interface'

export function getOperationNodesForFieldAstBySchema(
  schema: GraphQLSchema,
): OperationNodesForFieldAstBySchemaReturnType[] {
  return [
    ...Object.values(schema.getQueryType()?.getFields() || {}).map(
      operationField => {
        return {
          operationDefNodeAst:
            buildOperationNodeForField({
              schema,
              kind: OperationTypeNode.QUERY,
              field: operationField.name,
            }) || {},
        }
      },
    ),
    ...Object.values(schema.getMutationType()?.getFields() || {}).map(
      operationField => {
        return {
          operationDefNodeAst:
            buildOperationNodeForField({
              schema,
              kind: OperationTypeNode.MUTATION,
              field: operationField.name,
            }) || {},
        }
      },
    ),
    ...Object.values(schema.getSubscriptionType()?.getFields() || {}).map(
      operationField => {
        return {
          operationDefNodeAst:
            buildOperationNodeForField({
              schema,
              kind: OperationTypeNode.SUBSCRIPTION,
              field: operationField.name,
            }) || {},
        }
      },
    ),
  ]
}
