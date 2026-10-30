import { EmitHint, NewLineKind, ScriptKind, ScriptTarget, SyntaxKind, ts } from "@ts-morph/common";

/**
 * Options for printing a node.
 */
export interface PrintNodeOptions {
  /**
   * Whether to remove comments or not.
   */
  removeComments?: boolean;
  /**
   * New line kind.
   *
   * Defaults to line feed.
   */
  newLineKind?: NewLineKind;
  /**
   * From the compiler api: "A value indicating the purpose of a node. This is primarily used to
   * distinguish between an `Identifier` used in an expression position, versus an
   * `Identifier` used as an `IdentifierName` as part of a declaration. For most nodes you
   * should just pass `Unspecified`."
   *
   * Defaults to `Unspecified`.
   */
  emitHint?: EmitHint;
  /**
   * The script kind.
   *
   * @remarks This is only useful when passing in a compiler node that was constructed
   * with the compiler API factory methods.
   *
   * Defaults to TSX.
   */
  scriptKind?: ScriptKind;
}

/**
 * Prints the provided node using the compiler's printer.
 * @param node - Compiler node.
 * @param options - Options.
 * @remarks If the node was not constructed with the compiler API factory methods and the node
 * does not have parents set, then use the other overload that accepts a source file.
 */
export function printNode(node: ts.Node, options?: PrintNodeOptions): string;
/**
 * Prints the provided node using the compiler's printer.
 * @param node - Compiler node.
 * @param sourceFile - Compiler source file.
 * @param options - Options.
 */
export function printNode(node: ts.Node, sourceFile: ts.SourceFile, options?: PrintNodeOptions): string;
export function printNode(node: ts.Node, sourceFileOrOptions?: PrintNodeOptions | ts.SourceFile, secondOverloadOptions?: PrintNodeOptions) {
  const isFirstOverload = sourceFileOrOptions == null || (sourceFileOrOptions as ts.SourceFile).kind !== SyntaxKind.SourceFile;
  const options = getOptions();
  using api = new ts.API();
  let text = node.kind === SyntaxKind.SourceFile
    ? api.printer.printFile(node as ts.SourceFile)
    : ts.isStatement(node) && !isFirstOverload
    ? api.printer.printFile(ts.factory.updateSourceFile(sourceFileOrOptions as ts.SourceFile, [node], (sourceFileOrOptions as ts.SourceFile).endOfFileToken))
      .replace(/\r?\n$/, "")
    : api.printer.printNode(node);
  if (options.removeComments) {
    const scanner = ts.createScanner(false, undefined, text);
    const ranges: [number, number][] = [];
    for (let kind = scanner.scan(); kind !== SyntaxKind.EndOfFile; kind = scanner.scan()) {
      if (kind === SyntaxKind.SingleLineCommentTrivia || kind === SyntaxKind.MultiLineCommentTrivia)
        ranges.push([scanner.getTokenStart(), scanner.getTokenEnd()]);
    }
    for (const [start, end] of ranges.reverse())
      text = text.slice(0, start) + text.slice(end);
  }
  return text.replace(/\r?\n/g, options.newLineKind === NewLineKind.CRLF ? "\r\n" : "\n");

  function getOptions() {
    return (isFirstOverload ? sourceFileOrOptions as PrintNodeOptions : secondOverloadOptions) || {};
  }
}
