import { ts } from "../typescript";

/** Gets the effective module resolution mode without private compiler helpers. */
export function getEmitModuleResolutionKind(compilerOptions: ts.CompilerOptions) {
  if (compilerOptions.moduleResolution != null)
    return compilerOptions.moduleResolution;
  const module = compilerOptions.module;
  if (module === ts.ModuleKind.Node16)
    return ts.ModuleResolutionKind.Node16;
  if (module === ts.ModuleKind.Node18 || module === ts.ModuleKind.Node20 || module === ts.ModuleKind.NodeNext)
    return ts.ModuleResolutionKind.NodeNext;
  if (module == null || module === ts.ModuleKind.CommonJS || module >= ts.ModuleKind.ES2015)
    return ts.ModuleResolutionKind.Bundler;
  return ts.ModuleResolutionKind.Classic;
}
