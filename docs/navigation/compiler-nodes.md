---
title: Underlying Compiler Nodes
---

## Underlying Compiler Nodes

Sometimes it might be useful to get the node from the TypeScript compiler.

They're accessible via the `.compilerNode` property that's found on all node objects:

```ts
const compilerNode = interfaceDeclaration.compilerNode;
```

**Warning:** When manipulating the AST via this library, the underlying TypeScript AST tree is regenerated each time. For this reason, it's important not
to hold on to TypeScript compiler nodes between manipulations or you could end up working with out of date information.

### Compiler node properties

Sometimes there isn't a helper function in this library for accessing certain properties on the underlying compiler node.

In these situations, you can access any underlying compiler node property by using the `.getNodeProperty(propName)` method:

```ts
const nameNode = propertyAccessExpression.getNodeProperty("name"); // returns: PropertyName
// also works with arrays and possibly undefined properties
const typeParameters = classDeclaration.getNodeProperty("typeParameters"); // returns: TypeParameterDeclaration[] | undefined
```

...and then please open an issue so that I can implement something I forgot to implement.

## Navigating Existing Compiler Nodes

Sometimes you might want to easily navigate an existing compiler node.

Do that by using the `createWrappedNode` function:

```ts ignore-error: 1109
import { createWrappedNode, ClassDeclaration, ts, SyntaxKind } from "ts-morph";

// some code that creates a class declaration using the ts object
const classNode: ts.ClassDeclaration = ...;

// create and use a wrapped node
const classDec = createWrappedNode(classNode).asKindOrThrow(SyntaxKind.ClassDeclaration);
const firstProperty = classDec.getProperties()[0];

// ... do more stuff here ...
```

**Note:** This is a lightweight way to navigate a node, but there are certian functionalities which will throw an error since there is no
language service, type checker, or program. Finding references requires a language service. Parsing and transforming source requires an owning `Project`. Keep the native source-file lease alive while navigating a borrowed AST.

### Providing Type Checker

If you would like to easily get the type information of the types in the provided source file, then provide a type checker:

```ts ignore-error: 1109
// given an existing node and type checker
const classNode: ts.ClassDeclaration = ...;
const compilerTypeChecker: ts.TypeChecker = ...;

// create and use a wrapped node
const classDec = createWrappedNode(classNode, { typeChecker: compilerTypeChecker }).asKindOrThrow(SyntaxKind.ClassDeclaration);
console.log(classDec.getPropertyOrThrow("propName").getType().getText()); // ok, because a type checker was provided
```

### Important: Using both the TypeScript API and ts-morph

It is highly recommended to always use the `ts` named export from ts-morph when
needing to use the TypeScript Compiler API and ts-morph at the same time:

```ts
// do this
import { ts } from "ts-morph";
// not this
import * as ts from "typescript";
```

The `ts` export exposes the native AST and synchronous API entry points. The root `typescript` package exports version metadata; its programmatic APIs live in separate entry points such as `typescript/sync` and `typescript/ast`.

There's lots of reasons why this is done and it's outlined in [#333](https://github.com/dsherret/ts-morph/issues/333#issuecomment-391182952).
