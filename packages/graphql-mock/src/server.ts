import path from 'path'

import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { fetchTypeDefs } from '@fruits-chain/qiufen-pro-helpers'
import { addMocksToSchema } from '@graphql-tools/mock'
import { makeExecutableSchema } from '@graphql-tools/schema'

import type { GraphqlKitConfig } from './interface'

export async function startMockingServer() {
  const root = path.join(process.cwd())
  const qiufenConfigFilePath = path.join(root, 'qiufen.config.js')

  /** 去除require缓存 */
  delete eval('require.cache')[qiufenConfigFilePath]
  const qiufenConfigs: GraphqlKitConfig = eval('require')(qiufenConfigFilePath)

  const { endpoint, port, mock } = qiufenConfigs

  const backendSDL = await fetchTypeDefs(endpoint?.url)

  const server = new ApolloServer({
    schema: addMocksToSchema({
      schema: makeExecutableSchema({
        typeDefs: backendSDL,
        resolvers: mock?.resolvers,
      }),
      mocks: mock?.scalarMap,
    }),
  })

  const { url } = await startStandaloneServer(server, { listen: { port } })
  console.log(`🚀 Mocking server listening at: ${url}`)
}
