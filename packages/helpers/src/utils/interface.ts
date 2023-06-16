import type {
  GraphQLArgument,
  GraphQLEnumValue,
  GraphQLField,
  OperationTypeNode,
  ConstDirectiveNode,
  FieldNode,
  OperationDefinitionNode,
} from 'graphql'
import type { Maybe } from 'graphql/jsutils/Maybe'

export interface BaseTypeDef {
  name: string
  ofName: string
}

export interface ScalarTypeDef extends BaseTypeDef {
  kind: 'Scalar'
}

export type EnumValueTypeDef = Pick<
  GraphQLEnumValue,
  'name' | 'description' | 'value' | 'deprecationReason'
>

export interface EnumTypeDef extends BaseTypeDef {
  kind: 'Enum'
  values: EnumValueTypeDef[]
}

export interface ObjectTypeDef extends BaseTypeDef {
  kind: 'Object'
  fields: ObjectFieldTypeDef[]
}

export interface UnionTypeDef extends BaseTypeDef {
  kind: 'Union'
  types: ObjectTypeDef[]
}

export interface InputObjectTypeDef extends BaseTypeDef {
  kind: 'InputObject'
  fields: ArgTypeDef[]
}

export type OutputType =
  | ScalarTypeDef
  | EnumTypeDef
  | ObjectTypeDef
  | UnionTypeDef

export type InputType = ScalarTypeDef | EnumTypeDef | InputObjectTypeDef

export interface ArgTypeDef
  extends Pick<
    GraphQLArgument,
    'name' | 'description' | 'defaultValue' | 'deprecationReason'
  > {
  type: InputType
}

export interface ObjectFieldTypeDef
  extends Pick<
    GraphQLField<unknown, unknown>,
    'name' | 'description' | 'deprecationReason'
  > {
  directives?: ReadonlyArray<ConstDirectiveNode>
  args: ArgTypeDef[]
  output: OutputType
}

export interface Operation extends ObjectFieldTypeDef {
  argsExample: Record<string, unknown>
  outputExample: Record<string, unknown>
}

export interface TypedOperation extends Operation {
  operationType: OperationTypeNode
}

export type ScalarMap = Record<string, unknown>

export enum FetchDirectiveArg {
  LOADER = 'loader',
  FETCH = 'fetch',
}

export type NewFieldNodeType = FieldNode & {
  fieldKey: string
  checked: boolean
  nameValue: string
  description: string
  type: string
  depth: number
  children?: NewFieldNodeType[]
}

export type ArgColumnRecord = {
  key: string
  name: ArgTypeDef['name']
  type: ArgTypeDef['type']['name']
  defaultValue: ArgTypeDef['defaultValue']
  description: ArgTypeDef['description']
  deprecationReason?: ArgTypeDef['deprecationReason']
  children: ArgColumnRecord[] | null
  directives?: ConstDirectiveNode[]
}

export type OperationDefsAstArgsType = {
  name: string
  description: Maybe<string>
  defaultValue: unknown
  deprecationReason: Maybe<string>
  directives: readonly ConstDirectiveNode[] | undefined
  type: InputType
}
export type OperationDefinitionNodeGroupType = OperationDefinitionNode & {
  operationDefinitionDescription: string
  namedTypeList?: string[]
  variableTypeList?: string[]
  args: OperationDefsAstArgsType[]
}
