import { buildClientSchema, getIntrospectionQuery } from 'graphql'

import type { GraphQLSchema } from 'graphql'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export async function fetchSchema(
  url: string,
  timeout = 15000,
  authorization = '',
): Promise<GraphQLSchema> {
  const headers = {
    'Content-Type': 'application/json',
    // 只有在存在 authorization 时才添加 Authorization 头部
    ...(authorization && { authorization }),
  }

  let response
  if (isBrowser()) {
    let timer
    response = await Promise.race([
      fetch(url, {
        method: 'POST',
        headers,
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
        headers,
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
