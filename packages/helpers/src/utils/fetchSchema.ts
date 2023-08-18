import { buildClientSchema, getIntrospectionQuery } from 'graphql'

import type { GraphQLSchema } from 'graphql'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export async function fetchSchema(
  url: string,
  timeout = 15000,
): Promise<GraphQLSchema> {
  let response
  if (isBrowser()) {
    let timer
    response = await Promise.race([
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: getIntrospectionQuery().toString(),
        }),
      }),
      new Promise(function (_, reject) {
        timer = setTimeout(() => reject(new Error('request timeout')), timeout)
      }),
    ])
    clearTimeout(timer)
  } else {
    let timer
    // @ts-ignore
    const nodeFetch = await import('cross-fetch')
    response = await Promise.race([
      nodeFetch.default(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: getIntrospectionQuery().toString(),
        }),
      }),
      new Promise(function (_, reject) {
        timer = setTimeout(() => reject(new Error('request timeout')), timeout)
      }),
    ])
    clearTimeout(timer)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (response as any).json()
  // 这里判断一下走的什么模式拿到的远程的schema 定义
  const schema = buildClientSchema(data)
  return schema
}
