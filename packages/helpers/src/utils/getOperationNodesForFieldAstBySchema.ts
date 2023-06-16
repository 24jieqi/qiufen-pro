import { OperationTypeNode, type GraphQLSchema } from 'graphql'

import { buildOperationNodeForField } from './buildOperationNodeForField'

export type OperationNodesForFieldAstBySchemaReturnType = ReturnType<
  typeof getOperationNodesForFieldAstBySchema
>

export function getOperationNodesForFieldAstBySchema(schema: GraphQLSchema) {
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
