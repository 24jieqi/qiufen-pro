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
