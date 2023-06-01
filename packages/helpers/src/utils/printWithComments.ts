import { Kind, visit } from 'graphql'

import type {
  ASTNode,
  ASTVisitor,
  NameNode,
  NamedTypeNode,
  StringValueNode,
  TypeNode,
} from 'graphql'
import type { Maybe } from 'graphql/jsutils/Maybe'

const MAX_LINE_LENGTH = 80

const commentsRegistry: {
  [path: string]: string[]
} = {}

function join(maybeArray?: readonly any[], separator?: string) {
  return maybeArray ? maybeArray.filter(x => x).join(separator || '') : ''
}

function wrap(start: string, maybeString: any, end?: string) {
  return maybeString ? start + maybeString + (end || '') : ''
}

function indent(maybeString?: string) {
  return maybeString && `  ${maybeString.replace(/\n/g, '\n  ')}`
}

function block(array?: readonly any[]) {
  return array && array.length !== 0 ? `{\n${indent(join(array, '\n'))}\n}` : ''
}

function printBlockString(value: string, isDescription = false) {
  const escaped = value.replace(/"""/g, '\\"""')
  return (value[0] === ' ' || value[0] === '\t') && value.indexOf('\n') === -1
    ? `"""${escaped.replace(/"$/, '"\n')}"""`
    : `"""\n${isDescription ? escaped : indent(escaped)}\n"""`
}

function hasMultilineItems(maybeArray: Maybe<ReadonlyArray<string>>): boolean {
  return maybeArray?.some((str: any) => str.includes('\n')) ?? false
}

function addHashesToLines(str: string): string {
  // Split each line of text into an array of strings
  const lines = str.split(/\r?\n/)

  // Add "#" at the beginning of each line
  const hashedLines = lines.map(line => `# ${line}`)

  // Merge the processed array of strings back into a single string, with newlines between each line
  return hashedLines.join('\n')
}

function printComment(comment: string): string {
  return '\n# ' + comment.replace(/\n/g, '\n# ')
}

type VisitFn = (
  node: {
    description?: StringValueNode
    name?: NameNode
    type?: TypeNode
    kind: string
  },
  key: string,
  parent: NamedTypeNode,
  path: string[],
  ancestors: NamedTypeNode[],
) => any

function addDescription(
  cb: VisitFn,
  isAllFieldNodeAddComment = false,
): VisitFn {
  return (
    node: {
      description?: StringValueNode & { isNeedComment?: boolean }
      name?: NameNode
      type?: TypeNode
      kind: string
    },
    _key: string,
    _parent: NamedTypeNode,
    path: string[],
    ancestors: NamedTypeNode[],
  ) => {
    const keys: string[] = []
    const parent = path.reduce((prev, key) => {
      if (['fields', 'arguments', 'values'].includes(key as any) && prev.name) {
        keys.push(prev.name.value)
      }

      // @ts-ignore
      return prev?.[key]
    }, ancestors[0])

    const key = [...keys, parent?.name?.value].filter(Boolean).join('.')
    const items: string[] = []

    if (node.kind.includes('Definition') && commentsRegistry[key]) {
      items.push(...commentsRegistry[key])
    }

    return join(
      [
        ...items.map(printComment),
        // Determine whether the header or each field displays notes
        (isAllFieldNodeAddComment ||
          node.kind === Kind.OPERATION_DEFINITION ||
          node.description?.isNeedComment) &&
        node.description?.value
          ? addHashesToLines(node.description?.value)
          : '',
        cb(node, _key, _parent, path, ancestors),
      ],
      '\n',
    )
  }
}

const printDocASTReducer: ASTVisitor = {
  Name: { leave: node => node.value },
  Variable: { leave: node => '$' + node.name },

  // Document
  Document: {
    leave: node => {
      return join(node.definitions, '\n\n')
    },
  },

  OperationDefinition: {
    leave: node => {
      const varDefs = wrap('(', join(node.variableDefinitions, ', '), ')')
      const prefix = join(
        [
          node.operation,
          join([node.name, varDefs]),
          join(node.directives, ' '),
        ],
        ' ',
      )

      // the query short form.
      return prefix + ' ' + node.selectionSet
    },
  },

  VariableDefinition: {
    leave: ({ variable, type, defaultValue, directives }) =>
      variable +
      ': ' +
      type +
      wrap(' = ', defaultValue) +
      wrap(' ', join(directives, ' ')),
  },

  SelectionSet: {
    leave: ({ selections }) => {
      return block(selections)
    },
  },

  Field: {
    leave({ alias, name, arguments: args, directives, selectionSet }) {
      const prefix = wrap('', alias, ': ') + name
      let argsLine = prefix + wrap('(', join(args, ', '), ')')

      if (argsLine.length > MAX_LINE_LENGTH) {
        argsLine = prefix + wrap('(\n', indent(join(args, '\n')), '\n)')
      }

      return join([argsLine, join(directives, ' '), selectionSet], ' ')
    },
  },

  Argument: { leave: ({ name, value }) => name + ': ' + value },

  // Fragments
  FragmentSpread: {
    leave: ({ name, directives }) =>
      '...' + name + wrap(' ', join(directives, ' ')),
  },

  InlineFragment: {
    leave: ({ typeCondition, directives, selectionSet }) =>
      join(
        [
          '...',
          wrap('on ', typeCondition),
          join(directives, ' '),
          selectionSet,
        ],
        ' ',
      ),
  },

  FragmentDefinition: {
    leave: ({
      name,
      typeCondition,
      variableDefinitions,
      directives,
      selectionSet,
    }) =>
      // Note: fragment variable definitions are experimental and may be changed
      // or removed in the future.
      `fragment ${name}${wrap('(', join(variableDefinitions, ', '), ')')} ` +
      `on ${typeCondition} ${wrap('', join(directives, ' '), ' ')}` +
      selectionSet,
  },

  // Value
  IntValue: { leave: ({ value }) => value },
  FloatValue: { leave: ({ value }) => value },
  StringValue: {
    leave: ({ value, block: isBlockString }) => {
      if (isBlockString) {
        return printBlockString(value)
      }

      return JSON.stringify(value)
    },
  },
  BooleanValue: { leave: ({ value }) => (value ? 'true' : 'false') },
  NullValue: { leave: () => 'null' },
  EnumValue: { leave: ({ value }) => value },
  ListValue: { leave: ({ values }) => '[' + join(values, ', ') + ']' },
  ObjectValue: { leave: ({ fields }) => '{' + join(fields, ', ') + '}' },
  ObjectField: { leave: ({ name, value }) => name + ': ' + value },

  // Directive
  Directive: {
    leave: ({ name, arguments: args }) =>
      '@' + name + wrap('(', join(args, ', '), ')'),
  },

  // Type
  NamedType: { leave: ({ name }) => name },
  ListType: { leave: ({ type }) => '[' + type + ']' },
  NonNullType: { leave: ({ type }) => type + '!' },

  // Type System Definitions
  SchemaDefinition: {
    leave: ({ directives, operationTypes }: any) =>
      join(['schema', join(directives, ' '), block(operationTypes)], ' '),
  },

  OperationTypeDefinition: {
    leave: ({ operation, type }) => operation + ': ' + type,
  },

  ScalarTypeDefinition: {
    leave: ({ name, directives }) =>
      join(['scalar', name, join(directives, ' ')], ' '),
  },

  ObjectTypeDefinition: {
    leave: ({ name, interfaces, directives, fields }) =>
      join(
        [
          'type',
          name,
          wrap('implements ', join(interfaces, ' & ')),
          join(directives, ' '),
          block(fields),
        ],
        ' ',
      ),
  },

  FieldDefinition: {
    leave: ({ name, arguments: args, type, directives }) =>
      name +
      (hasMultilineItems(args as any as string[])
        ? wrap('(\n', indent(join(args, '\n')), '\n)')
        : wrap('(', join(args, ', '), ')')) +
      ': ' +
      type +
      wrap(' ', join(directives, ' ')),
  },

  InputValueDefinition: {
    leave: ({ name, type, defaultValue, directives }) =>
      join(
        [name + ': ' + type, wrap('= ', defaultValue), join(directives, ' ')],
        ' ',
      ),
  },

  InterfaceTypeDefinition: {
    leave: ({ name, interfaces, directives, fields }: any) =>
      join(
        [
          'interface',
          name,
          wrap('implements ', join(interfaces, ' & ')),
          join(directives, ' '),
          block(fields),
        ],
        ' ',
      ),
  },

  UnionTypeDefinition: {
    leave: ({ name, directives, types }) =>
      join(
        ['union', name, join(directives, ' '), wrap('= ', join(types, ' | '))],
        ' ',
      ),
  },

  EnumTypeDefinition: {
    leave: ({ name, directives, values }) =>
      join(['enum', name, join(directives, ' '), block(values)], ' '),
  },

  EnumValueDefinition: {
    leave: ({ name, directives }) => join([name, join(directives, ' ')], ' '),
  },

  InputObjectTypeDefinition: {
    leave: ({ name, directives, fields }) =>
      join(['input', name, join(directives, ' '), block(fields)], ' '),
  },

  DirectiveDefinition: {
    leave: ({ name, arguments: args, repeatable, locations }) =>
      'directive @' +
      name +
      (hasMultilineItems(args as any as string[])
        ? wrap('(\n', indent(join(args, '\n')), '\n)')
        : wrap('(', join(args, ', '), ')')) +
      (repeatable ? ' repeatable' : '') +
      ' on ' +
      join(locations, ' | '),
  },

  SchemaExtension: {
    leave: ({ directives, operationTypes }) =>
      join(
        ['extend schema', join(directives, ' '), block(operationTypes)],
        ' ',
      ),
  },

  ScalarTypeExtension: {
    leave: ({ name, directives }) =>
      join(['extend scalar', name, join(directives, ' ')], ' '),
  },

  ObjectTypeExtension: {
    leave: ({ name, interfaces, directives, fields }) =>
      join(
        [
          'extend type',
          name,
          wrap('implements ', join(interfaces, ' & ')),
          join(directives, ' '),
          block(fields),
        ],
        ' ',
      ),
  },

  InterfaceTypeExtension: {
    leave: ({ name, interfaces, directives, fields }: any) =>
      join(
        [
          'extend interface',
          name,
          wrap('implements ', join(interfaces, ' & ')),
          join(directives, ' '),
          block(fields),
        ],
        ' ',
      ),
  },

  UnionTypeExtension: {
    leave: ({ name, directives, types }) =>
      join(
        [
          'extend union',
          name,
          join(directives, ' '),
          wrap('= ', join(types, ' | ')),
        ],
        ' ',
      ),
  },

  EnumTypeExtension: {
    leave: ({ name, directives, values }) =>
      join(['extend enum', name, join(directives, ' '), block(values)], ' '),
  },

  InputObjectTypeExtension: {
    leave: ({ name, directives, fields }) =>
      join(['extend input', name, join(directives, ' '), block(fields)], ' '),
  },
}

const printDocASTReducerWithComments = (isAllFieldNodeAddComment = false) => {
  return Object.keys(printDocASTReducer).reduce(
    (prev, key) => ({
      ...prev,
      [key]: {
        leave: addDescription(
          // @ts-ignore
          printDocASTReducer[key].leave,
          isAllFieldNodeAddComment,
        ),
      },
    }),
    {} as typeof printDocASTReducer,
  )
}

export function printWithComments(
  ast: ASTNode,
  isAllFieldNodeAddComment = false,
): string {
  return visit(
    ast,
    printDocASTReducerWithComments(isAllFieldNodeAddComment),
  ) as unknown as string
}
