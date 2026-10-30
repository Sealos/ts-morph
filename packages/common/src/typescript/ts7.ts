export { version, versionMajorMinor } from "typescript";
export * from "typescript/ast";
export { LanguageVariant, NodeFlags, ScriptKind, ScriptTarget, SyntaxKind } from "typescript/ast";
export * from "typescript/sync";
export { DiagnosticCategory, ModuleKind, ModuleResolutionKind, ObjectFlags, SymbolFlags, TypeFlags, TypeFormatFlags } from "typescript/sync";
import { NewLineKind as NativeNewLineKind } from "typescript/proto";
export type NewLineKind = NativeNewLineKind;
export const NewLineKind = { ...NativeNewLineKind, LineFeed: NativeNewLineKind.LF, CarriageReturnLineFeed: NativeNewLineKind.CRLF };
export type {
  EndOfFile as EndOfFileToken,
  MethodSignatureDeclaration as MethodSignature,
  NodeWithTypeArgumentsBase as NodeWithTypeArguments,
  PropertySignatureDeclaration as PropertySignature,
  RootedFilePath as Path,
  StringLiteralLikeNode as StringLiteralLike,
} from "typescript/ast";
export type { EditorSettings, FormatCodeSettings } from "typescript/proto";
export type { Checker as TypeChecker } from "typescript/sync";
export * from "./compatibility";
export type NodeFactory = typeof import("typescript/ast/factory");
export type { ArrayDestructuringAssignment, ObjectDestructuringAssignment, ReferencedSymbolEntry } from "./compatibility";
export * from "./compilerHelpers";
export type { CompilerOptions } from "./CompilerOptions";
export { createLanguageService, NativeLanguageService as LanguageService } from "./NativeLanguageService";
