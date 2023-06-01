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
// documentNode in the last example
const ruleStrWithHeaderComment = printWithComments(documentNode)
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
// documentNode in the last example
const ruleStrWithAllFieldsComment = printWithComments(documentNode,true)
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
