import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'
import { cleandir } from 'rollup-plugin-cleandir'
import typescript from 'rollup-plugin-typescript2'

import pkg from './package.json'

export default {
  input: './src/index.ts',
  output: {
    name: 'helpers',
    file: pkg.main,
    format: 'umd',
  },
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
    // commonjs({ extensions: [".js", ".ts", ".json"] })
  ],
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ],
}
