import fs from 'fs'
import path from 'path'

import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { fetchTypeDefs } from '@fruits-chain/qiufen-pro-helpers'
import { addMocksToSchema } from '@graphql-tools/mock'
import { makeExecutableSchema } from '@graphql-tools/schema'

import type { GraphqlKitConfig } from './interface'

export async function executeQiufenMockingServer() {
  const root = path.join(process.cwd())
  const qiufenConfigFilePath = path.join(root, 'qiufen.config.js')

  /** Delete require cache */
  delete require.cache[qiufenConfigFilePath]
  const qiufenConfigs: GraphqlKitConfig = require(qiufenConfigFilePath)
  startMockingServer(qiufenConfigs)
}

export async function startMockingServer(qiufenConfigs: GraphqlKitConfig) {
  const {
    endpoint,
    port,
    mock,
    schemaPolicy = 'remote',
    localSchemaFile = '',
  } = qiufenConfigs

  let typeDefsSDL = ''
  if (schemaPolicy === 'remote') {
    typeDefsSDL = await fetchTypeDefs(endpoint?.url)
  } else {
    typeDefsSDL = fs
      .readFileSync(path.join(process.cwd(), localSchemaFile))
      ?.toString()
  }

  const server = new ApolloServer({
    schema: addMocksToSchema({
      schema: makeExecutableSchema({
        typeDefs: typeDefsSDL,
        resolvers: mock?.resolvers,
      }),
      mocks: mock?.scalarMap,
      preserveResolvers: true,
    }),
  })

  const { url } = await startStandaloneServer(server, { listen: { port } })
  // eslint-disable-next-line no-console
  console.log(`🚀 Mocking server listening at: ${url}`)
}
