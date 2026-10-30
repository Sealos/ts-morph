# TypeScript 7.1 migration

This branch uses the native compiler's programmatic API from **`typescript@7.1.0-beta`**. TypeScript 6 and the JavaScript compiler bundle are no longer supported. Install normally with npm; keep optional dependencies enabled so TypeScript can install its platform binary.

Node.js **22.12 or newer** is required. The packages keep their CommonJS entry points and synchronous project and manipulation methods. Browser, Deno, and JSR distributions are no longer built.

## Project ownership

Every project owns native compiler resources. Close it when finished, including on failure:

```ts
import { Project } from "ts-morph";

const project = new Project({ useInMemoryFileSystem: true });
try {
  const file = project.createSourceFile("example.ts", "const value = 1;");
  console.log(file.getVariableDeclarationOrThrow("value").getType().getText());
} finally {
  project.dispose();
}
```

`using project = new Project(...)` is also supported. Disposal is idempotent. It closes the native API session, snapshots, programs, parsed-file leases, and any language-server worker started by editor operations. Subsequent compiler operations throw.

A `Type`, `Symbol`, or `Signature` belongs to the project state in which it was obtained. Reacquire these objects after editing files, adding or removing files, or changing compiler options. Using an older object throws a stale-object error. Syntax wrappers retain ts-morph's existing manipulation and forgetting behavior.

The bootstrap package also exposes `dispose()` and `[Symbol.dispose]()`. Its `createProgram()` now returns a native program: use `program.getProject().checker`, `program.getSourceFileNames()`, and `program.getSourceFile(name)`. Do not retain programs after project edits.

## Compiler-facing changes

The `ts` namespace exposes native AST and synchronous API exports plus selected compatibility helpers. Raw compiler objects follow TypeScript 7.1's API, including symbol declaration handles that require `resolve()`. `createWrappedNode()` borrows its AST and checker from the caller, who must keep their native leases alive; operations that parse or transform source require an owning `Project`. They do not emulate TypeScript 6's mutable compiler internals. Default library file names now identify the installed native compiler's library directory, including when a custom filesystem supplies library contents.

`Node.transform()` still visits synchronously and supplies `currentNode`, `visitChildren()`, and `factory`. The factory uses native signatures (for example, literal token flags and identifier nodes for declaration names). There is no legacy `TransformationContext`. Printer output may differ from TypeScript 6.

Emit-time `customTransformers` have been removed. Passing them from JavaScript throws. Apply `Node.transform()` to the source before emitting instead.

Some native AST kinds replace older compiler kinds. Interface heritage types remain available through ts-morph's `ExpressionWithTypeArguments` wrapper. Native JSDoc parsing no longer produces the old specialized JSDoc function, namepath, member-name, unknown-type, author/class/enum-tag, or comma-list node kinds. The retained legacy wrapper classes and guards cannot manufacture these missing compiler nodes. Use the native parsed kinds and ordinary function/type nodes where applicable.

`NewLineKind.LineFeed` and `NewLineKind.CarriageReturnLineFeed` remain aliases for native `LF` and `CRLF`. Editor settings use native string indentation styles (`"none"`, `"block"`, `"smart"`). Removed compiler targets and module-resolution modes should be migrated to supported TypeScript 7.1 settings; this branch does not restore their old compiler behavior.

## Editor operations

Rename, references, definitions, formatting, organize imports, and missing-import fixes retain synchronous ts-morph interfaces. Standard language-server requests run in a project-owned worker. Requests are bounded and failures throw rather than hanging indefinitely.

The beta does not provide every legacy editor feature. Refactoring actions, arbitrary combined code-fix IDs, and removal of all unused identifiers throw explicit unsupported-operation errors. Import-only cleanup remains available through organize imports and the supported import code fix. Individual code-fix and suggestion results depend on the providers shipped in this exact beta.

Custom `resolveModuleNames` hooks are adapted to native module resolution. The native callback identifies the containing directory; the adapter recovers parsed importing files and rejects conflicting resolutions of the same module within one directory. For imports whose containing file has not been parsed, the callback receives a synthetic filename in that directory. Native resolution cannot preserve legacy extension and external-library flag overrides. The editor bridge mirrors unique nonrelative aliases through `paths`; conflicting aliases across directories are rejected, and arbitrary remapping of relative import paths is not available to editor requests.

Custom `resolveTypeReferenceDirectives`, failed-lookup-cache hooks, and bootstrap's unstable `isKnownTypesPackageName` hook are unavailable and rejected at project construction. Use normal `types`, `typeRoots`, `paths`, and filesystem-backed declaration packages instead.

## Development

```sh
npm ci
npm run build
npm run type-check
npm test
npm run code-generate -w ts-morph
npm run code-verification -w ts-morph
```

Builds use the native compiler followed by Rollup. Declarations are emitted to each package's `dist-declarations` directory and shipped with the runtime bundle. The old library/compiler embedding and compiler-version swapping scripts have been removed. CI exercises Node 22.12 and 24 on Linux, macOS, and Windows.
