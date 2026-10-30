import type { ScriptKind, ScriptTarget } from "typescript/ast";
import { NativeCompilerSession } from "../common/src/typescript/NativeCompilerSession.js";

export function createCompilerSourceFile(fileName: string, text: string, _target?: ScriptTarget, _parents?: boolean, scriptKind?: ScriptKind) {
  return new NativeCompilerSession().parse(fileName, text, scriptKind);
}
