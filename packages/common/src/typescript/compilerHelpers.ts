import * as path from "node:path";
import { ScriptTarget } from "typescript/ast";
import type { IScriptSnapshot, ModuleResolutionHost } from "./compatibility";
import type { CompilerOptions } from "./CompilerOptions";
import { NativeCompilerSession } from "./NativeCompilerSession";

/** A text snapshot used by ts-morph's document cache. */
export const ScriptSnapshot = {
  fromString(text: string): IScriptSnapshot {
    return { getText: (start, end) => text.slice(start, end), getLength: () => text.length, getChangeRange: () => undefined };
  },
};

export function getDefaultLibFileName(options: CompilerOptions) {
  const target = options.target ?? ScriptTarget.Latest;
  if (target === ScriptTarget.Latest)
    return "lib.esnext.full.d.ts";
  if (target === ScriptTarget.ES2015)
    return "lib.es6.d.ts";
  const name = ScriptTarget[target]?.toLowerCase();
  return name == null ? "lib.esnext.full.d.ts" : `lib.${name}.full.d.ts`;
}

export function resolveModuleName(moduleName: string, containingFile: string, options: CompilerOptions, host: ModuleResolutionHost) {
  using session = new NativeCompilerSession({
    getCurrentDirectory: () => host.getCurrentDirectory?.() ?? process.cwd(),
    readFile: file => host.readFile(file),
    fileExists: file => host.fileExists(file),
    directoryExists: directory => host.directoryExists?.(directory) ?? true,
    getAccessibleEntries: directory => ({
      files: [],
      directories: (host.getDirectories?.(directory) ?? []).map(dir => path.basename(dir)),
      symlinks: undefined,
    }),
    realpath: file => host.realpath?.(file) ?? file,
  });
  using resolver = session.api.createModuleResolver(options);
  return resolver.resolveModuleName(moduleName, path.dirname(containingFile));
}

/** Collects native diagnostics in the same order as the public project helper. */
export function getPreEmitDiagnostics(program: import("typescript/sync").Program, fileName?: string) {
  const diagnostics = [
    ...program.getConfigFileParsingDiagnostics(),
    ...program.getProgramDiagnostics(),
    ...program.getSyntacticDiagnostics(fileName),
    ...program.getGlobalDiagnostics(),
    ...program.getSemanticDiagnostics(fileName),
    ...program.getDeclarationDiagnostics(fileName),
  ];
  return [
    ...new Map(
      diagnostics.map(
        diagnostic => [
          JSON.stringify([diagnostic.fileName, diagnostic.pos, diagnostic.end, diagnostic.code, diagnostic.text, diagnostic.messageChain]),
          diagnostic,
        ],
      ),
    ).values(),
  ];
}
