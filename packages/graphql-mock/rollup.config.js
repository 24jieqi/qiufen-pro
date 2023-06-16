import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'
import { cleandir } from 'rollup-plugin-cleandir'
import dts from 'rollup-plugin-dts'
import typescript from 'rollup-plugin-typescript2'

import pkg from './package.json'

const input = './src/index.ts'

export default [
  {
    input,
    output: [
      {
        file: pkg.main,
        format: 'cjs',
      },
      {
        file: pkg.module,
        format: 'es',
      },
    ],
    external: [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
    ],
    plugins: [
      /** 配置插件 - 每次打包清除目标文件 */
      cleandir('./dist'),
      /** 配置插件 - 将json转换为ES6模块 */
      json(),
      typescript({
        useTsconfigDeclarationDir: true,
      }),
      resolve({
        extensions: ['.js', '.ts', '.json'],
        modulesOnly: true,
        preferredBuiltins: false,
      }),
      commonjs({ extensions: ['.js', '.ts', '.json'] }),
    ],
  },
  {
    input,
    output: [{ file: pkg.types, format: 'es' }],
    plugins: [dts.default()],
  },
]
