import { ArrayUtils, errors, SymbolFlags, ts } from "@ts-morph/common";
import { ProjectContext } from "../../ProjectContext";
import { JSDocTagInfo, Node } from "../ast";
import { Type } from "../types";

export class Symbol {
  readonly #epoch: number;

  /** @internal */
  readonly #context: ProjectContext;
  /** @internal */
  readonly #compilerSymbol: ts.Symbol;

  /**
   * Gets the underlying compiler symbol.
   */
  get compilerSymbol(): ts.Symbol {
    this.#context.compilerFactory.documentRegistry.nativeSession.assertEpoch(this.#epoch);
    return this.#compilerSymbol;
  }

  /**
   * Initializes a new instance of Symbol.
   * @private
   * @param context - Project context.
   * @param symbol - Compiler symbol.
   */
  constructor(context: ProjectContext, symbol: ts.Symbol) {
    this.#context = context;
    this.#epoch = context.compilerFactory.documentRegistry.nativeSession.epoch;
    this.#compilerSymbol = symbol;

    // wrap these immediately, but do not memoize because the underlying symbol might be mutated
    this.getValueDeclaration();
    this.getDeclarations();
  }

  /**
   * Gets the symbol name.
   */
  getName() {
    return this.compilerSymbol.name;
  }

  /**
   * Gets the escaped name.
   */
  getEscapedName() {
    return this.compilerSymbol.escapedName as string;
  }

  /**
   * Gets the aliased symbol or throws if it doesn't exist.
   */
  getAliasedSymbolOrThrow(message?: string | (() => string)): Symbol {
    return errors.throwIfNullOrUndefined(this.getAliasedSymbol(), message ?? "Expected to find an aliased symbol.");
  }

  /**
   * Follows a single alias to get the immediately aliased symbol or returns undefined if it doesn't exist.
   */
  getImmediatelyAliasedSymbol(): Symbol | undefined {
    return this.#context.typeChecker.getImmediatelyAliasedSymbol(this);
  }

  /**
   * Follows a single alias to get the immediately aliased symbol or throws if it doesn't exist.
   */
  getImmediatelyAliasedSymbolOrThrow(message?: string | (() => string)): Symbol {
    return errors.throwIfNullOrUndefined(this.getImmediatelyAliasedSymbol(), message ?? "Expected to find an immediately aliased symbol.");
  }

  /**
   * Gets the aliased symbol or returns undefined if it doesn't exist.
   */
  getAliasedSymbol(): Symbol | undefined {
    return this.#context.typeChecker.getAliasedSymbol(this);
  }

  /**
   * Gets the export symbol of the symbol if its a local symbol with a corresponding export symbol. Otherwise returns the current symbol.
   *
   * The following is from the compiler API documentation:
   *
   * For example, at `export type T = number;`:
   *     - `getSymbolAtLocation` at the location `T` will return the exported symbol for `T`.
   *     - But the result of `getSymbolsInScope` will contain the *local* symbol for `T`, not the exported symbol.
   *     - Calling `getExportSymbol` on that local symbol will return the exported symbol.
   */
  getExportSymbol() {
    return this.#context.typeChecker.getExportSymbolOfSymbol(this);
  }

  /**
   * Gets if the symbol is an alias.
   */
  isAlias() {
    return (this.getFlags() & SymbolFlags.Alias) === SymbolFlags.Alias;
  }

  /**
   * Gets if the symbol is optional.
   */
  isOptional() {
    return (this.getFlags() & SymbolFlags.Optional) === SymbolFlags.Optional;
  }

  /**
   * Gets the symbol flags.
   */
  getFlags(): SymbolFlags {
    return this.compilerSymbol.flags;
  }

  /**
   * Gets if the symbol has the specified flags.
   * @param flags - Flags to check if the symbol has.
   */
  hasFlags(flags: SymbolFlags) {
    return (this.compilerSymbol.flags & flags) === flags;
  }

  /**
   * Gets the value declaration of a symbol or throws if it doesn't exist.
   */
  getValueDeclarationOrThrow(message?: string | (() => string)): Node {
    return errors.throwIfNullOrUndefined(
      this.getValueDeclaration(),
      message ?? (() => `Expected to find the value declaration of symbol '${this.getName()}'.`),
    );
  }

  /**
   * Gets the value declaration of the symbol or returns undefined if it doesn't exist.
   */
  getValueDeclaration(): Node | undefined {
    const declaration = this.compilerSymbol.valueDeclaration?.resolve();
    if (declaration == null)
      return undefined;
    return this.#context.compilerFactory.getNodeFromCompilerNode(declaration, this.#context.compilerFactory.getSourceFileForNode(declaration));
  }

  /**
   * Gets the symbol declarations.
   */
  getDeclarations(): Node[] {
    return (this.compilerSymbol.declarations ?? [])
      .map(handle => {
        const d = errors.throwIfNullOrUndefined(handle.resolve(), "Native declaration could not be resolved.");
        return this.#context.compilerFactory.getNodeFromCompilerNode(d, this.#context.compilerFactory.getSourceFileForNode(d));
      });
  }

  /**
   * Gets the export of the symbol by the specified name or throws if not exists.
   * @param name - Name of the export.
   */
  getExportOrThrow(name: string, message?: string | (() => string)): Symbol {
    return errors.throwIfNullOrUndefined(this.getExport(name), message ?? (() => `Expected to find export with name: ${name}`));
  }

  /**
   * Gets the export of the symbol by the specified name or returns undefined if not exists.
   * @param name - Name of the export.
   */
  getExport(name: string): Symbol | undefined {
    const symbol = this.compilerSymbol.getExports().get(ts.escapeLeadingUnderscores(name));
    return symbol == null ? undefined : this.#context.compilerFactory.getSymbol(symbol);
  }

  /**
   * Gets the exports from the symbol.
   */
  getExports(): Symbol[] {
    return Array.from(this.compilerSymbol.getExports().values()).map(symbol => this.#context.compilerFactory.getSymbol(symbol));
  }

  /**
   * Gets the global export of the symbol by the specified name or throws if not exists.
   * @param name - Name of the global export.
   */
  getGlobalExportOrThrow(name: string, message?: string | (() => string)): Symbol {
    return errors.throwIfNullOrUndefined(this.getGlobalExport(name), message ?? (() => `Expected to find global export with name: ${name}`));
  }

  /**
   * Gets the global export of the symbol by the specified name or returns undefined if not exists.
   * @param name - Name of the global export.
   */
  getGlobalExport(name: string): Symbol | undefined {
    return this.getGlobalExports().find(symbol => symbol.getName() === name);
  }

  /**
   * Gets the global exports from the symbol.
   */
  getGlobalExports(): Symbol[] {
    const result: Symbol[] = [];
    for (const declaration of this.getDeclarations()) {
      if (!Node.isSourceFile(declaration))
        continue;
      for (const statement of declaration.getStatements()) {
        if (ts.isNamespaceExportDeclaration(statement.compilerNode)) {
          const symbol = this.#context.typeChecker.compilerObject.getSymbolAtLocation((statement.compilerNode as ts.NamespaceExportDeclaration).name);
          if (symbol != null)
            result.push(this.#context.compilerFactory.getSymbol(symbol));
        }
      }
    }
    return result;
  }

  /**
   * Gets the member of the symbol by the specified name or throws if not exists.
   * @param name - Name of the export.
   */
  getMemberOrThrow(name: string, message?: string | (() => string)): Symbol {
    return errors.throwIfNullOrUndefined(this.getMember(name), message ?? `Expected to find member with name: ${name}`);
  }

  /**
   * Gets the member of the symbol by the specified name or returns undefined if not exists.
   * @param name - Name of the member.
   */
  getMember(name: string): Symbol | undefined {
    const symbol = this.compilerSymbol.getMembers().get(ts.escapeLeadingUnderscores(name));
    return symbol == null ? undefined : this.#context.compilerFactory.getSymbol(symbol);
  }

  /**
   * Gets the members of the symbol
   */
  getMembers(): Symbol[] {
    return Array.from(this.compilerSymbol.getMembers().values()).map(symbol => this.#context.compilerFactory.getSymbol(symbol));
  }

  /**
   * Gets the declared type of the symbol.
   */
  getDeclaredType(): Type {
    return this.#context.typeChecker.getDeclaredTypeOfSymbol(this);
  }

  /**
   * Gets the type of the symbol at a location.
   * @param node - Location to get the type at for this symbol.
   */
  getTypeAtLocation(node: Node) {
    return this.#context.typeChecker.getTypeOfSymbolAtLocation(this, node);
  }

  /**
   * Gets the fully qualified name.
   */
  getFullyQualifiedName() {
    return this.#context.typeChecker.getFullyQualifiedName(this);
  }

  /** Gets the JS doc tag infos of the symbol. */
  getJsDocTags() {
    return this.compilerSymbol.getJsDocTags(this.#context.typeChecker.compilerObject)
      .map(info => new JSDocTagInfo(info));
  }
}
