import { createRequire } from "node:module";
import * as path from "node:path";

/** @internal */
export function getNativeLibDirectory() {
  const compilerRequire = createRequire(require.resolve("typescript/package.json"));
  const nativePackage = `@typescript/typescript-${process.platform}-${process.arch}`;
  return path.join(path.dirname(compilerRequire.resolve(`${nativePackage}/package.json`)), "lib");
}
