## Functions

#### fetchTypeDefs

```ts
fetchTypeDefs(url: string): Promise<string>
```

Given a url, return a Promise that resolves to a graphql sdl string when the retrieval is complete.

```ts
// demo
fetchTypeDefs('http://localhost:4001/graphql').then(str => {
  console.log(str)
})

str: /*
  type Book {
    title: String
    author: String
  }

  input TaskBoardQueryInput {
    date: Int!
  }

  type Query {
    books(contains: TaskBoardQueryInput): [Book]
  }
*/

```

#### fetchSchema

```ts
fetchSchema(url: string): Promise<GraphQLSchema>
```

Given a url, return a Promise that resolves to a GraphQLSchema when the retrieval is complete.

```ts
// demo
fetchSchema('http://localhost:4001/graphql').then(graphqlSchema => {
  console.log(graphqlSchema)
})

graphqlSchema: /*
 GraphQLSchema {__validationErrors: undefined, description: undefined,extensions: {…}, astNode: undefined, ...}
*/

```

#### parseOperationWithDescriptions

```ts
function parseOperationWithDescriptions(
  sourceSdl: string,
  options?: ParseOptions,
): DocumentNode
```

A string one set of reasonable formatting rules is parsed to ast with descriptions.

```ts
// demo
const gql = `
# -- test detail comment --
query abnormalOrder($abnormalOrderInput: AbnormalOrderInput) {
  abnormalOrder(abnormalOrderInput: $abnormalOrderInput) {
    # test comment0
    abnormalOrderId
    abnormalOrderStatus
    customer {
      # test comment1
      customerId
      customerName
      customerType
    }
  }
}
`

const documentNode = parseOperationWithDescriptions(gql)
console.log(documentNode)

documentNode: /*
{kind: 'Document', definitions: Array(1), loc: Location ...}
*/
```

#### printWithComments

```ts
function printWithComments(
  ast: ASTNode,
  isAllFieldNodeAddComment?: boolean,
): string
```

Converts an AST into a string, using one set of reasonable formatting rules.

```ts
// demo1
const ruleStrWithHeaderComment = printWithComments(documentNode) // The documentNode in the last example
console.log(ruleStrWithHeaderComment)

ruleStrWithHeaderComment: /*
# -- test detail comment --
query abnormalOrder($abnormalOrderInput: AbnormalOrderInput) {
  abnormalOrder(abnormalOrderInput: $abnormalOrderInput) {
    abnormalOrderId
    abnormalOrderStatus
    customer {
      customerId
      customerName
      customerType
    }
  }
}
*/

// demo2
const ruleStrWithAllFieldsComment = printWithComments(documentNode,true) // The documentNode in the last example
console.log(ruleStrWithAllFieldsComment)

ruleStrWithAllFieldsComment: /*
# -- test detail comment --
query abnormalOrder($abnormalOrderInput: AbnormalOrderInput) {
  abnormalOrder(abnormalOrderInput: $abnormalOrderInput) {
    # test comment0
    abnormalOrderId
    abnormalOrderStatus
    customer {
      # test comment1
      customerId
      customerName
      customerType
    }
  }
}
*/
```

#### buildOperationNodeForField

```ts
function buildOperationNodeForField({
  schema,
  kind,
  field,
  models,
  ignore,
  depthLimit,
  circularReferenceDepth,
  argNames,
  selectedFields,
}: {
  schema: GraphQLSchema
  kind: OperationTypeNode
  /** eg. search */
  field: string
  models?: string[]
  ignore?: Ignore
  depthLimit?: number
  circularReferenceDepth?: number
  argNames?: string[]
  selectedFields?: SelectedFields
}): OperationDefinitionNodeGroupType
```

Given a schema, return a type of "OperationDefinitionNodeGroupType" object.

```ts
// demo1
buildOperationNodeForField({
  schema: schema,
  kind: OperationTypeNode.QUERY,
  field: 'adjustBillDetailQuery',
})
```

![img-buildOperationNodeForField](https://github.com/never-w/picb/blob/main/qiufen-pro-images/buildOperationNodeForField.png)

#### getOperationNodesForFieldAstBySchema

```ts
getOperationNodesForFieldAstBySchema(schema: GraphQLSchema): OperationNodesForFieldAstBySchemaReturnType[];
```

Given a schema, return a type of "OperationNodesForFieldAstBySchemaReturnType []" array.

```ts
// demo1
getOperationNodesForFieldAstBySchema(schema)
```

![img-buildOperationNodeForField](https://github.com/never-w/picb/blob/main/qiufen-pro-images/getOperationNodesForFieldAstBySchema.png)
