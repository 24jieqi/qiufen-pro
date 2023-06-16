# @fruits-chain/qiufen-pro-helpers

- Collection of helper functions for qiufen-pro
- Suggestion: Use with [graphql.js](https://graphql-js.org/).
- Fast and efficient processing of graphql ast
- You can also use some of the utility functions in "graphql.js"

## Functions

## fetchTypeDefs

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

## fetchSchema

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

## parseOperationWithDescriptions

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

## printWithComments

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

## buildOperationNodeForField

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

## getOperationNodesForFieldAstBySchema

```ts
getOperationNodesForFieldAstBySchema(schema: GraphQLSchema): OperationNodesForFieldAstBySchemaReturnType[];
```

Given a schema, return a type of "OperationNodesForFieldAstBySchemaReturnType[]" array.

```ts
// demo1
getOperationNodesForFieldAstBySchema(schema)
```

![img-getOperationNodesForFieldAstBySchema](https://github.com/never-w/picb/blob/main/qiufen-pro-images/getOperationNodesForFieldAstBySchema.png)

## onSchemaDiffToOperationDefs

```ts
function onSchemaDiffToOperationDefs(
  leftSchema: GraphQLSchema,
  rightSchema: GraphQLSchema,
): OnSchemaDiffToOperationDefsItem[]
```

Given two schemas, return a type of "OnSchemaDiffToOperationDefsItem[]" array.

```ts
// demo1
import { buildSchema } from 'graphql'

const typeDefs0 = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.
  enum AllowedColor {
    RED
    GREEN
    BLUE
  }

  # This "Book" type defines the queryable fields for every book in our data source.
  type Book {
    """
     备注title
    """
    title: String
    wyq: Int
    author: String
    favoriteColor: [AllowedColor]
  }

  input C {
   age:Int 
   hight:String
  }

  input B {
     name: String
     obj: C
  }

input A {
  date: Int!
  remark: B
}

input TaskBoardQueryInput {
  date: Int!
  remark: String
  favoriteColor: [AllowedColor]
  var: A!
}

  type Query {
  """
  分类: s书籍信息
  """
    books(contains: TaskBoardQueryInput): [Book]
  """
  信息: text
  """
    text:Book
    removeName:Int
  }
`
const typeDefs1 = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.
  enum AllowedColor {
    RED
    GREEN
    BLUE
  }

  # This "Book" type defines the queryable fields for every book in our data source.
  type Book {
    """
     备注title
    """
    title: String
    wyq: Int
    author: String
    favoriteColor: [AllowedColor]
  }

  input C {
   age:Int 
   hight:String
  }

  input B {
     name: String
     obj: C
  }

input A {
  date: Int!
  remark: B
}

input TaskBoardQueryInput {
  date: Int!
  remark: String
  favoriteColor: [AllowedColor]
  var: A!
}

  type Query {
  """
  分类: s书籍信息
  """
    books(contains: TaskBoardQueryInput): [Book]
  """
  信息: text
  """
    text:Int
    addName:Int
  }
`
const leftSchema = buildSchema(typeDefs0)
const rightSchema = buildSchema(typeDefs1)
onSchemaDiffToOperationDefs(leftSchema, rightSchema)
```

![img-onSchemaDiffToOperationDefs](https://github.com/never-w/picb/blob/main/qiufen-pro-images/onSchemaDiffToOperationDefs.png)

## updateOperationDefAst

```ts
function updateOperationDefAst(
  leftDefNode: DefinitionNode | FieldNode | InlineFragmentNode,
  rightDefNode: DefinitionNode | FieldNode | InlineFragmentNode,
  remoteConflictingVariablesNames?: ConflictingVariablesNames[],
): DefinitionNode | null
```

Pass in leftDefNode and rightDefNode, and update leftDefNode to rightDefNode.

```ts
// demo1
import {
  parseOperationWithDescriptions,
  printWithComments,
} from '@fruits-chain/qiufen-pro-helpers'

const gql0 = `
# 异常订单: 详情
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
`

const gql1 = `
# 异常订单: 详情
query abnormalOrder($abnormalOrderInput: AbnormalOrderInput) {
  abnormalOrder(abnormalOrderInput: $abnormalOrderInput) {
    abnormalOrderId
    abnormalOrderStatus
  }
}
`

const gqlAts0 = parseOperationWithDescriptions(gql0)
const gqlAts1 = parseOperationWithDescriptions(gql1)

const operationDefAst = updateOperationDefAst(
  gqlAts0.definitions[0],
  gqlAts1.definitions[0],
)

const newGql = printWithComments(operationDefAst)
console.log(newGql)

newGql:/*
# 异常订单: 详情
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
```

```ts
// demo2
import {
  parseOperationWithDescriptions,
  printWithComments,
} from '@fruits-chain/qiufen-pro-helpers'

const gql0 = `
# 异常订单: 详情
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
  name11 {
    id
    key
    customer {
      customerId
      customerName
    }
  }
}
`

const gql1 = `
# 异常订单: 详情
query abnormalOrder($abnormalOrderInput: AbnormalOrderInput) {
  abnormalOrder(abnormalOrderInput: $abnormalOrderInput) {
    abnormalOrderId
    abnormalOrderStatus
    title
  }
}
`

const gqlAts0 = parseOperationWithDescriptions(gql0)
const gqlAts1 = parseOperationWithDescriptions(gql1)

const operationDefAst = updateOperationDefAst(
  gqlAts0.definitions[0],
  gqlAts1.definitions[0],
)

const newGql = printWithComments(operationDefAst)
console.log(newGql)

newGql:/*
# 异常订单: 详情
query abnormalOrder($abnormalOrderInput: AbnormalOrderInput) {
  abnormalOrder(abnormalOrderInput: $abnormalOrderInput) {
    abnormalOrderId
    abnormalOrderStatus
    title
  }
  name11 {
    id
    key
    customer {
      customerId
      customerName
    }
  }
}
*/
```
