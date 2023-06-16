import { Kind } from 'graphql'

import type {
  FieldNode,
  OperationDefinitionNode,
  VariableDefinitionNode,
  VariableNode,
  InlineFragmentNode,
  ArgumentNode,
  DefinitionNode,
  ExecutableDefinitionNode,
  SelectionNode,
} from 'graphql'

type CanWrite<T> = {
  -readonly [K in keyof T]: T[K]
}

type ConflictingVariablesNames = {
  variableName: string
  newVariableName: string
}

/**
 * Capitalize the first letters of words
 */
function capitalizeFirstLetter(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

/**
 * Recursively iterate to get all "arguments" on the operation field
 */
function getArguments(
  astNode: OperationDefinitionNode | FieldNode | InlineFragmentNode,
  args: (ArgumentNode | null)[] = [],
) {
  if (astNode?.kind === Kind.FIELD) {
    args.push((astNode?.arguments || null) as unknown as ArgumentNode)
  }

  if (astNode.selectionSet) {
    astNode.selectionSet!.selections.forEach(item => {
      getArguments(item as FieldNode, args)
    })
  }

  return args
    .filter(Boolean)
    .flat(Infinity)
    .map(itm => (itm?.value as VariableNode)?.name?.value) as string[]
}

/**
 * Checks for parameter name conflicts
 */
function hasConflictingVariableDefinitions(
  filteredVars: ReadonlyArray<VariableDefinitionNode>,
  remoteVar: VariableDefinitionNode,
): boolean {
  const filteredNames = filteredVars.map(v => v.variable.name.value)
  const remoteName = remoteVar.variable.name.value

  return filteredNames.some(name => remoteName === name)
}

export function updateOperationDefAst(
  leftDefNode: DefinitionNode | FieldNode | InlineFragmentNode,
  rightDefNode: DefinitionNode | FieldNode | InlineFragmentNode,
  remoteConflictingVariablesNames: ConflictingVariablesNames[] = [],
): DefinitionNode | null {
  const localNode = leftDefNode as unknown as
    | CanWrite<FieldNode>
    | ExecutableDefinitionNode
  const remoteNode = rightDefNode as unknown as
    | FieldNode
    | ExecutableDefinitionNode

  let filteredNotUpdateField: FieldNode[] = []

  if (
    localNode?.kind === 'OperationDefinition' &&
    remoteNode?.kind === 'OperationDefinition'
  ) {
    const localOperationNode = localNode as CanWrite<OperationDefinitionNode>
    const remoteOperationNode = remoteNode as OperationDefinitionNode

    if (localOperationNode.selectionSet?.selections.length > 1) {
      // Aggregate interface
      const args = getArguments({
        ...localOperationNode,
        selectionSet: {
          ...localOperationNode.selectionSet,
          selections: localOperationNode.selectionSet!.selections.filter(
            selection =>
              (selection as FieldNode).name.value !==
              (remoteOperationNode.selectionSet!.selections[0] as FieldNode)
                .name.value,
          ),
        },
      })

      // Here are the parameters that do not need to be updated to get the aggregate interface, which are the parameters at the OperationDefinition level
      const filterLocalOperationNodeVariables =
        localOperationNode.variableDefinitions?.filter(varItm =>
          args.includes(varItm.variable.name.value),
        ) || []
      const filteredLocalOperationNodeVariablesNames =
        filterLocalOperationNodeVariables.map(v => v.variable.name.value)
      // Get parameters on the remote OperationDefinition level and resolve name conflicts
      const remoteOperationNodeVariables =
        remoteOperationNode.variableDefinitions?.map(varItm => {
          if (
            hasConflictingVariableDefinitions(
              filterLocalOperationNodeVariables,
              varItm,
            )
          ) {
            const newNameValue = `${
              remoteOperationNode.name?.value
            }${capitalizeFirstLetter(varItm.variable.name.value)}`
            const isStillConflicting =
              filteredLocalOperationNodeVariablesNames.includes(newNameValue)
            // If it still conflicts, add a timestamp suffix
            const nameDate = +new Date()
            const value = isStillConflicting
              ? `${newNameValue}${nameDate}`
              : newNameValue

            remoteConflictingVariablesNames.push({
              variableName: varItm.variable.name.value,
              newVariableName: value,
            })

            return {
              ...varItm,
              variable: {
                ...varItm.variable,
                name: {
                  ...varItm.variable.name,
                  value,
                },
              },
            }
          }

          return varItm
        }) || []

      localOperationNode.variableDefinitions = [
        ...remoteOperationNodeVariables,
        ...filterLocalOperationNodeVariables,
      ]
    } else {
      localOperationNode.variableDefinitions =
        remoteOperationNode.variableDefinitions
    }

    // Aggregated interfaces filter out fields that do not need to be updated
    filteredNotUpdateField =
      (localNode.selectionSet!.selections.filter(
        itm =>
          (itm as FieldNode).name.value !==
          (remoteNode.selectionSet!.selections[0] as FieldNode).name.value,
      ) as unknown as FieldNode[]) || []
  }

  // Field type update
  if (localNode?.kind === 'Field' && remoteNode?.kind === 'Field') {
    if (localNode.name.value !== remoteNode.name.value) {
      return null
    }

    // In order to resolve parameter conflicts, change the parameter corresponding to the location on the FieldNode
    localNode.arguments = remoteNode.arguments?.map(arg => {
      const conflictingArg = remoteConflictingVariablesNames.find(
        itm => itm.variableName === (arg.value as VariableNode).name.value,
      )

      if (conflictingArg) {
        return {
          ...arg,
          value: {
            ...arg.value,
            name: {
              ...(arg.value as VariableNode).name,
              value: conflictingArg.newVariableName,
            },
          },
        }
      }

      return arg
    })

    localNode.alias = localNode.alias || remoteNode.alias
  }

  if (localNode?.selectionSet && remoteNode?.selectionSet) {
    localNode.selectionSet.selections = localNode.selectionSet.selections
      .map(localSelection => {
        if (localSelection?.kind === Kind.INLINE_FRAGMENT) {
          const remoteSelection = remoteNode.selectionSet!.selections.find(
            // eslint-disable-next-line @typescript-eslint/no-shadow
            remoteSelection =>
              (remoteSelection as InlineFragmentNode).typeCondition?.name
                .value === localSelection.typeCondition?.name.value,
          )
          if (!remoteSelection) {
            return null
          }
          return updateOperationDefAst(
            localSelection,
            remoteSelection as FieldNode,
            remoteConflictingVariablesNames,
          )
        } else if (localSelection?.kind === Kind.FRAGMENT_SPREAD) {
          // TODO 这种类型暂时没有涉及到
          return null
        } else {
          const remoteSelection = remoteNode.selectionSet!.selections.find(
            // eslint-disable-next-line @typescript-eslint/no-shadow
            remoteSelection =>
              (remoteSelection as FieldNode).name?.value ===
              localSelection.name.value,
          )
          if (!remoteSelection) {
            return null
          }
          return updateOperationDefAst(
            localSelection,
            remoteSelection as FieldNode,
            remoteConflictingVariablesNames,
          )
        }
      })
      .filter(Boolean) as unknown as SelectionNode[]

    // added new fields
    remoteNode.selectionSet.selections.forEach(remoteSelection => {
      if (remoteSelection?.kind === Kind.INLINE_FRAGMENT) {
        if (
          !localNode.selectionSet!.selections.some(
            localSelection =>
              (localSelection as InlineFragmentNode).typeCondition?.name
                .value === remoteSelection.typeCondition?.name.value,
          )
        ) {
          ;(localNode.selectionSet!.selections as SelectionNode[]).push(
            remoteSelection,
          )
        }
      } else if (remoteSelection?.kind === Kind.FRAGMENT_SPREAD) {
        // TODO 这种类型暂时没有涉及到
      } else {
        if (
          !localNode.selectionSet!.selections.some(
            localSelection =>
              (localSelection as FieldNode).name?.value ===
              remoteSelection.name.value,
          )
        ) {
          ;(localNode.selectionSet!.selections as SelectionNode[]).push(
            remoteSelection,
          )
        }
      }
    })
  }

  if (
    localNode?.kind === 'OperationDefinition' &&
    remoteNode?.kind === 'OperationDefinition' &&
    filteredNotUpdateField.length
  ) {
    return {
      ...localNode,
      selectionSet: {
        ...localNode.selectionSet,
        selections: [
          ...localNode.selectionSet.selections,
          ...makeFieldNodeDescriptionComment(filteredNotUpdateField),
        ],
      },
    } as DefinitionNode
  } else {
    return {
      ...localNode,
      // @ts-ignore
      description: localNode?.description?.value
        ? {
            // @ts-ignore
            ...localNode?.description,
            isNeedComment: true,
          }
        : {
            // @ts-ignore
            ...remoteNode?.description,
          },
    } as unknown as DefinitionNode
  }
}

function traverseField(filed: FieldNode) {
  // @ts-ignore
  if (filed?.description?.value) {
    // @ts-ignore
    filed.description.isNeedComment = true
  }

  if (filed?.selectionSet?.selections) {
    filed.selectionSet.selections = filed.selectionSet.selections.map(node =>
      traverseField(node as FieldNode),
    ) as unknown as SelectionNode[]
  }

  return filed
}

function makeFieldNodeDescriptionComment(Fields: FieldNode[]) {
  return (
    Fields.map(field => {
      return traverseField(field)
    }) || []
  )
}
