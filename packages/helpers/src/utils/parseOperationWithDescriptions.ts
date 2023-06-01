import {
  Kind,
  TokenKind,
  isTypeSystemDefinitionNode,
  parse,
  visit,
} from 'graphql'

import type {
  DocumentNode,
  ASTNode,
  StringValueNode,
  ParseOptions,
} from 'graphql'

function leadingWhitespace(str: string) {
  let i = 0
  while (i < str.length && (str[i] === ' ' || str[i] === '\t')) {
    i++
  }
  return i
}

function isBlank(str: string) {
  return leadingWhitespace(str) === str.length
}

function getBlockStringIndentation(lines: ReadonlyArray<string>): number {
  let commonIndent = null

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const indent = leadingWhitespace(line)
    if (indent === line.length) {
      continue // skip empty lines
    }

    if (commonIndent === null || indent < commonIndent) {
      commonIndent = indent
      if (commonIndent === 0) {
        break
      }
    }
  }

  return commonIndent === null ? 0 : commonIndent
}

function dedentBlockStringValue(rawString: string): string {
  // Expand a block string's raw value into independent lines.
  const lines = rawString.split(/\r\n|[\n\r]/g)

  // Remove common indentation from all lines but first.
  const commonIndent = getBlockStringIndentation(lines)

  if (commonIndent !== 0) {
    for (let i = 1; i < lines.length; i++) {
      lines[i] = lines[i].slice(commonIndent)
    }
  }

  // Remove leading and trailing blank lines.
  while (lines.length > 0 && isBlank(lines[0])) {
    lines.shift()
  }
  while (lines.length > 0 && isBlank(lines[lines.length - 1])) {
    lines.pop()
  }

  // Return a string of the lines joined with U+000A.
  return lines.join('\n')
}

export function getLeadingCommentBlock(node: {
  loc?: Location
}): void | string {
  const loc = node.loc

  if (!loc) {
    return
  }
  const comments = []
  let token = (loc as any).startToken.prev
  while (
    token != null &&
    token.kind === TokenKind.COMMENT &&
    token.next != null &&
    token.prev != null &&
    token.line + 1 === token.next.line &&
    token.line !== token.prev.line
  ) {
    const value = String(token.value)
    comments.push(value)
    token = token.prev
  }
  return comments.length > 0 ? comments.reverse().join('\n') : undefined
}

export function parseOperationWithDescriptions(
  sourceSdl: string,
  options: ParseOptions = {},
): DocumentNode {
  const parsedDoc = parse(sourceSdl, {
    ...options,
    noLocation: false,
  })
  const modifiedDoc = visit(parsedDoc, {
    leave: (node: ASTNode) => {
      if (isDescribable(node)) {
        const rawValue = getLeadingCommentBlock(
          node as {
            loc?: Location
          },
        )

        if (rawValue !== undefined) {
          const commentsBlock = dedentBlockStringValue('\n' + rawValue)
          const isBlock = commentsBlock.includes('\n')

          if (!node.description) {
            return {
              ...node,
              description: {
                kind: Kind.STRING,
                value: commentsBlock,
                block: isBlock,
              },
            }
          } else {
            return {
              ...node,
              description: {
                ...node.description,
                value: node.description.value + '\n' + commentsBlock,
                block: true,
              },
            }
          }
        }
      }

      return node
    },
  })

  return modifiedDoc
}

type DiscriminateUnion<T, U> = T extends U ? T : never
type DescribableASTNodes = DiscriminateUnion<
  ASTNode,
  {
    description?: StringValueNode
  }
>

export function isDescribable(node: ASTNode): node is DescribableASTNodes {
  return (
    isTypeSystemDefinitionNode(node) ||
    node.kind === Kind.FIELD_DEFINITION ||
    node.kind === Kind.FIELD ||
    node.kind === Kind.OPERATION_DEFINITION ||
    node.kind === Kind.INPUT_VALUE_DEFINITION ||
    node.kind === Kind.ENUM_VALUE_DEFINITION
  )
}
