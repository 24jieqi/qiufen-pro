# @fruits-chain/qiufen-pro-graphql-mock

- Mock your GraphQL data based on a schema.

### Install

```cmd
yarn add @fruits-chain/qiufen-pro-graphql-mock -D
```

### Usage

- step1：Create the "qiufen.config.js" configuration file in the project root directory.
- step2：Configure the type of the object

```ts
interface GraphqlKitConfig {
  /** your qiufen service port */
  port: number
  /** backend service config */
  endpoint: ServiceConfig
  /** local graphql schema file path */
  localSchemaFile?: string
  /** use either local schema or remote schema, if unset, remote will be used */
  schemaPolicy?: SchemaPolicy
  /** mock config */
  mock?: MockConfig
}

interface ServiceConfig {
  /** backend service url */
  url: string
}

interface MockConfig {
  /** value map rules, you should add all your scalar type mappers here or you'll get an error */
  scalarMap: any
  /** graphql resolvers for operations, you can custom operation response here */
  resolvers?: any
}

type SchemaPolicy = 'local' | 'remote'

interface PlaygroundConfig {
  /** request headers */
  headers?: Record<string, string>
}
```

- step3：Go to configure "qiufen.config.js".

```ts
// demo of configure
const Mock = require('mockjs')
const { GraphqlKitConfig } = require('@fruits-chain/qiufen-pro-graphql-mock')
const { Random } = Mock

//@ts-check
/** @typedef {GraphqlKitConfig} Config **/

/** @type Config */
const config = {
  port: 4200,
  // 本地schema文件路径
  localSchemaFile: './src/graphql/generated/schema.graphql',
  // "remote" | "local" 两种模式，当远程网关失败时建议设置为 'local'，并指定本地schema文件路径.
  schemaPolicy: 'remote',
  endpoint: {
    // remote schema address
    url: 'http://localhost:4000/graphql',
  },
  mock: {
    scalarMap: {
      Int: () => Random.integer(0, 100),
      String: () => Random.ctitle(2, 4),
      ID: () => Random.id(),
      Boolean: () => Random.boolean(),
      BigDecimal: () => Random.integer(0, 1000000),
      Float: () => Random.float(0, 100),
      Date: () => Random.date(),
      DateTime: () => Random.datetime(),
      Long: () => Random.integer(0, 10000),
      NumberOrBoolOrStringOrNull: () => null,
      NumberOrString: () => null,
      Object: () => ({}),
    },
    resolvers: {
      Query: {
        // 自定义接口返回
        // ListTaskBoard: () => {
        //   return [
        //     {
        //       commodityName: "111111111",
        //       commoditySpecOptionName: "争11232131231212果",
        //       commodityTypeName: "样情",
        //       completedQuantity: "府委产",
        //       createBy: "火传离那",
        //       customerName: "布红系",
        //       customerTypeName: "报件指加",
        //       expectSaleQuantity: "容规数",
        //       index: 47,
        //       leaderName: "车做",
        //       line: "质身管手",
        //       planId: "320000201903036414",
        //       planProductionQuantity: "年着",
        //       productionType: "专本学",
        //       schedule: "再严今花",
        //     },
        //   ]
        // },
      },
    },
  },
}

module.exports = config
```
