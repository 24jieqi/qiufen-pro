import { buildClientSchema, getIntrospectionQuery, printSchema } from 'graphql'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export async function fetchTypeDefs(url: string) {
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
        timer = setTimeout(() => reject(new Error('request timeout')), 15000)
      }),
    ])
    clearTimeout(timer)
  } else {
    let timer
    // @ts-ignore
    const nodeFetch = require('node-fetch')
    response = await Promise.race([
      nodeFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: getIntrospectionQuery().toString(),
        }),
      }),
      new Promise(function (_, reject) {
        timer = setTimeout(() => reject(new Error('request timeout')), 15000)
      }),
    ])
    clearTimeout(timer)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (response as any).json()
  // 这里判断一下走的什么模式拿到的远程的schema 定义
  const backendTypeDefs = printSchema(buildClientSchema(data))
  return backendTypeDefs
}
