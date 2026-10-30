/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABILITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

import type {
  __String,
  all,
  AssignmentOperatorToken,
  BinaryExpression,
  Block,
  ClassDeclaration,
  ClassElement,
  ClassExpression,
  CompilerOptions,
  ConstructorTypeNode,
  CreateSourceFileOptions,
  Declaration,
  DeclarationName,
  Diagnostic,
  DiagnosticCategory,
  ElementAccessExpression,
  EntityName,
  Expression,
  FileReference,
  FunctionTypeNode,
  HeritageClause,
  Identifier,
  ImportAttributeName,
  JSDoc,
  JSDocTag,
  JSDocTypeExpression,
  JsxAttributeValue,
  JsxOpeningFragment,
  JsxOpeningLikeElement,
  LeftHandSideExpression,
  LineAndCharacter,
  Node,
  NodeArray,
  PackageId,
  ParameterDeclaration,
  ParsedCommandLine,
  Path,
  ProjectReference,
  PropertyAccessExpression,
  PropertyName,
  ResolutionMode,
  ResolvedModule,
  ResolvedTypeReferenceDirective,
  ScriptKind,
  ScriptTarget,
  SignatureDeclaration,
  SourceFile,
  Statement,
  StringLiteralLike,
  SuperExpression,
  Symbol,
  SyntaxKind,
  Token,
  TypeNode,
  TypeParameterDeclaration,
  version,
} from "./ts7";

export interface LanguageServiceHost extends GetEffectiveTypeRootsHost, MinimalResolutionCacheHost {
  getCompilationSettings(): CompilerOptions;
  getNewLine?(): string;
  getProjectVersion?(): string;
  getScriptFileNames(): string[];
  getScriptKind?(fileName: string): ScriptKind;
  getScriptVersion(fileName: string): string;
  getScriptSnapshot(fileName: string): IScriptSnapshot | undefined;
  getProjectReferences?(): readonly ProjectReference[] | undefined;
  getLocalizedDiagnosticMessages?(): any;
  getCancellationToken?(): HostCancellationToken;
  getCurrentDirectory(): string;
  getDefaultLibFileName(options: CompilerOptions): string;
  log?(s: string): void;
  trace?(s: string): void;
  error?(s: string): void;
  useCaseSensitiveFileNames?(): boolean;
  readDirectory?(path: string, extensions?: readonly string[], exclude?: readonly string[], include?: readonly string[], depth?: number): string[];
  realpath?(path: string): string;
  readFile(path: string, encoding?: string): string | undefined;
  fileExists(path: string): boolean;
  getTypeRootsVersion?(): number;
  /** @deprecated supply resolveModuleNameLiterals instead for resolution that can handle newer resolution modes like nodenext */
  resolveModuleNames?(
    moduleNames: string[],
    containingFile: string,
    reusedNames: string[] | undefined,
    redirectedReference: ResolvedProjectReference | undefined,
    options: CompilerOptions,
    containingSourceFile?: SourceFile,
  ): (ResolvedModule | undefined)[];
  getResolvedModuleWithFailedLookupLocationsFromCache?(
    modulename: string,
    containingFile: string,
    resolutionMode?: ResolutionMode,
  ): ResolvedModuleWithFailedLookupLocations | undefined;
  /** @deprecated supply resolveTypeReferenceDirectiveReferences instead for resolution that can handle newer resolution modes like nodenext */
  resolveTypeReferenceDirectives?(
    typeDirectiveNames: string[] | FileReference[],
    containingFile: string,
    redirectedReference: ResolvedProjectReference | undefined,
    options: CompilerOptions,
    containingFileMode?: ResolutionMode,
  ): (ResolvedTypeReferenceDirective | undefined)[];
  resolveModuleNameLiterals?(
    moduleLiterals: readonly StringLiteralLike[],
    containingFile: string,
    redirectedReference: ResolvedProjectReference | undefined,
    options: CompilerOptions,
    containingSourceFile: SourceFile,
    reusedNames: readonly StringLiteralLike[] | undefined,
  ): readonly ResolvedModuleWithFailedLookupLocations[];
  resolveTypeReferenceDirectiveReferences?<T extends FileReference | string>(
    typeDirectiveReferences: readonly T[],
    containingFile: string,
    redirectedReference: ResolvedProjectReference | undefined,
    options: CompilerOptions,
    containingSourceFile: SourceFile | undefined,
    reusedNames: readonly T[] | undefined,
  ): readonly ResolvedTypeReferenceDirectiveWithFailedLookupLocations[];
  getDirectories?(directoryName: string): string[];
  /**
   * Gets a set of custom transformers to use during emit.
   */
  isKnownTypesPackageName?(name: string): boolean;
  installPackage?(options: InstallPackageOptions): Promise<ApplyCodeActionCommandResult>;
  writeFile?(fileName: string, content: string): void;
  getParsedCommandLine?(fileName: string): ParsedCommandLine | undefined;
  jsDocParsingMode?: JSDocParsingMode | undefined;
}

export interface GetEffectiveTypeRootsHost {
  getCurrentDirectory?(): string;
}

export interface MinimalResolutionCacheHost extends ModuleResolutionHost {
  getCompilationSettings(): CompilerOptions;
  getCompilerHost?(): CompilerHost | undefined;
}

export interface ModuleResolutionHost {
  fileExists(fileName: string): boolean;
  readFile(fileName: string): string | undefined;
  trace?(s: string): void;
  directoryExists?(directoryName: string): boolean;
  /**
   * Resolve a symbolic link.
   * @see https://nodejs.org/api/fs.html#fs_fs_realpathsync_path_options
   */
  realpath?(path: string): string;
  getCurrentDirectory?(): string;
  getDirectories?(path: string): string[];
  useCaseSensitiveFileNames?: boolean | (() => boolean) | undefined;
}

export interface CompilerHost extends ModuleResolutionHost {
  getSourceFile(
    fileName: string,
    languageVersionOrOptions: ScriptTarget | CreateSourceFileOptions,
    onError?: (message: string) => void,
    shouldCreateNewSourceFile?: boolean,
  ): SourceFile | undefined;
  getSourceFileByPath?(
    fileName: string,
    path: Path,
    languageVersionOrOptions: ScriptTarget | CreateSourceFileOptions,
    onError?: (message: string) => void,
    shouldCreateNewSourceFile?: boolean,
  ): SourceFile | undefined;
  getCancellationToken?(): CancellationToken;
  getDefaultLibFileName(options: CompilerOptions): string;
  getDefaultLibLocation?(): string;
  writeFile: WriteFileCallback;
  getCurrentDirectory(): string;
  getCanonicalFileName(fileName: string): string;
  useCaseSensitiveFileNames(): boolean;
  getNewLine(): string;
  readDirectory?(
    rootDir: string,
    extensions: readonly string[],
    excludes: readonly string[] | undefined,
    includes: readonly string[],
    depth?: number,
  ): string[];
  /** @deprecated supply resolveModuleNameLiterals instead for resolution that can handle newer resolution modes like nodenext */
  resolveModuleNames?(
    moduleNames: string[],
    containingFile: string,
    reusedNames: string[] | undefined,
    redirectedReference: ResolvedProjectReference | undefined,
    options: CompilerOptions,
    containingSourceFile?: SourceFile,
  ): (ResolvedModule | undefined)[];
  /**
   * Returns the module resolution cache used by a provided `resolveModuleNames` implementation so that any non-name module resolution operations (eg, package.json lookup) can reuse it
   */
  getModuleResolutionCache?(): ModuleResolutionCache | undefined;
  /**
   * @deprecated supply resolveTypeReferenceDirectiveReferences instead for resolution that can handle newer resolution modes like nodenext
   *
   * This method is a companion for 'resolveModuleNames' and is used to resolve 'types' references to actual type declaration files
   */
  resolveTypeReferenceDirectives?(
    typeReferenceDirectiveNames: string[] | readonly FileReference[],
    containingFile: string,
    redirectedReference: ResolvedProjectReference | undefined,
    options: CompilerOptions,
    containingFileMode?: ResolutionMode,
  ): (ResolvedTypeReferenceDirective | undefined)[];
  resolveModuleNameLiterals?(
    moduleLiterals: readonly StringLiteralLike[],
    containingFile: string,
    redirectedReference: ResolvedProjectReference | undefined,
    options: CompilerOptions,
    containingSourceFile: SourceFile,
    reusedNames: readonly StringLiteralLike[] | undefined,
  ): readonly ResolvedModuleWithFailedLookupLocations[];
  resolveTypeReferenceDirectiveReferences?<T extends FileReference | string>(
    typeDirectiveReferences: readonly T[],
    containingFile: string,
    redirectedReference: ResolvedProjectReference | undefined,
    options: CompilerOptions,
    containingSourceFile: SourceFile | undefined,
    reusedNames: readonly T[] | undefined,
  ): readonly ResolvedTypeReferenceDirectiveWithFailedLookupLocations[];
  getEnvironmentVariable?(name: string): string | undefined;
  /** If provided along with custom resolveModuleNames or resolveTypeReferenceDirectives, used to determine if unchanged file path needs to re-resolve modules/type reference directives */
  hasInvalidatedResolutions?(filePath: Path): boolean;
  createHash?(data: string): string;
  getParsedCommandLine?(fileName: string): ParsedCommandLine | undefined;
  jsDocParsingMode?: JSDocParsingMode;
}

export interface CancellationToken {
  isCancellationRequested(): boolean;
  /** @throws OperationCanceledException if isCancellationRequested is true */
  throwIfCancellationRequested(): void;
}

export type WriteFileCallback = (
  fileName: string,
  text: string,
  writeByteOrderMark: boolean,
  onError?: (message: string) => void,
  sourceFiles?: readonly SourceFile[],
  data?: WriteFileCallbackData,
) => void;

export interface WriteFileCallbackData {
}

export interface ResolvedProjectReference {
  commandLine: ParsedCommandLine;
  sourceFile: SourceFile;
  references?: readonly (ResolvedProjectReference | undefined)[];
}

export interface ModuleResolutionCache
  extends PerDirectoryResolutionCache<ResolvedModuleWithFailedLookupLocations>, NonRelativeModuleNameResolutionCache, PackageJsonInfoCache
{
  getPackageJsonInfoCache(): PackageJsonInfoCache;
}

export interface PerDirectoryResolutionCache<T> {
  getFromDirectoryCache(name: string, mode: ResolutionMode, directoryName: string, redirectedReference: ResolvedProjectReference | undefined): T | undefined;
  getOrCreateCacheForDirectory(directoryName: string, redirectedReference?: ResolvedProjectReference): ModeAwareCache<T>;
  clear(): void;
  /**
   *  Updates with the current compilerOptions the cache will operate with.
   *  This updates the redirects map as well if needed so module resolutions are cached if they can across the projects
   */
  update(options: CompilerOptions): void;
}

export interface ModeAwareCache<T> {
  get(key: string, mode: ResolutionMode): T | undefined;
  set(key: string, mode: ResolutionMode, value: T): this;
  delete(key: string, mode: ResolutionMode): this;
  has(key: string, mode: ResolutionMode): boolean;
  forEach(cb: (elem: T, key: string, mode: ResolutionMode) => void): void;
  size(): number;
}

export interface ResolvedModuleWithFailedLookupLocations {
  readonly resolvedModule: ResolvedModuleFull | undefined;
}

export interface ResolvedModuleFull extends ResolvedModule {
  /**
   * Extension of resolvedFileName. This must match what's at the end of resolvedFileName.
   * This is optional for backwards-compatibility, but will be added if not provided.
   */
  extension: string;
  packageId?: PackageId;
}

export enum Extension {
  Ts = ".ts",
  Tsx = ".tsx",
  Dts = ".d.ts",
  Js = ".js",
  Jsx = ".jsx",
  Json = ".json",
  TsBuildInfo = ".tsbuildinfo",
  Mjs = ".mjs",
  Mts = ".mts",
  Dmts = ".d.mts",
  Cjs = ".cjs",
  Cts = ".cts",
  Dcts = ".d.cts",
}

export interface NonRelativeModuleNameResolutionCache extends NonRelativeNameResolutionCache<ResolvedModuleWithFailedLookupLocations>, PackageJsonInfoCache {
  /** @deprecated Use getOrCreateCacheForNonRelativeName */
  getOrCreateCacheForModuleName(nonRelativeModuleName: string, mode: ResolutionMode, redirectedReference?: ResolvedProjectReference): PerModuleNameCache;
}

export interface NonRelativeNameResolutionCache<T> {
  getFromNonRelativeNameCache(
    nonRelativeName: string,
    mode: ResolutionMode,
    directoryName: string,
    redirectedReference: ResolvedProjectReference | undefined,
  ): T | undefined;
  getOrCreateCacheForNonRelativeName(nonRelativeName: string, mode: ResolutionMode, redirectedReference?: ResolvedProjectReference): PerNonRelativeNameCache<T>;
  clear(): void;
  /**
   *  Updates with the current compilerOptions the cache will operate with.
   *  This updates the redirects map as well if needed so module resolutions are cached if they can across the projects
   */
  update(options: CompilerOptions): void;
}

export interface PerNonRelativeNameCache<T> {
  get(directory: string): T | undefined;
  set(directory: string, result: T): void;
}

export interface PackageJsonInfoCache {
  clear(): void;
}

export type PerModuleNameCache = PerNonRelativeNameCache<ResolvedModuleWithFailedLookupLocations>;

export interface ResolvedTypeReferenceDirectiveWithFailedLookupLocations {
  readonly resolvedTypeReferenceDirective: ResolvedTypeReferenceDirective | undefined;
}

export enum JSDocParsingMode {
  /**
   * Always parse JSDoc comments and include them in the AST.
   *
   * This is the default if no mode is provided.
   */
  ParseAll = 0,
  /**
   * Never parse JSDoc comments, mo matter the file type.
   */
  ParseNone = 1,
  /**
   * Parse only JSDoc comments which are needed to provide correct type errors.
   *
   * This will always parse JSDoc in non-TS files, but only parse JSDoc comments
   * containing `@see` and `@link` in TS files.
   */
  ParseForTypeErrors = 2,
  /**
   * Parse only JSDoc comments which are needed to provide correct type info.
   *
   * This will always parse JSDoc in non-TS files, but never in TS files.
   *
   * Note: Do not use this mode if you require accurate type errors; use {@link ParseForTypeErrors} instead.
   */
  ParseForTypeInfo = 3,
}

export interface IScriptSnapshot {
  /** Gets a portion of the script snapshot specified by [start, end). */
  getText(start: number, end: number): string;
  /** Gets the length of this script snapshot. */
  getLength(): number;
  /**
   * Gets the TextChangeRange that describe how the text changed between this text and
   * an older version.  This information is used by the incremental parser to determine
   * what sections of the script need to be re-parsed.  'undefined' can be returned if the
   * change range cannot be determined.  However, in that case, incremental parsing will
   * not happen and the entire document will be re - parsed.
   */
  getChangeRange(oldSnapshot: IScriptSnapshot): TextChangeRange | undefined;
  /** Releases all resources held by this script snapshot */
  dispose?(): void;
}

export interface TextChangeRange {
  span: TextSpan;
  newLength: number;
}

export interface TextSpan {
  start: number;
  length: number;
}

export interface HostCancellationToken {
  isCancellationRequested(): boolean;
}

export interface InstallPackageOptions {
  fileName: Path;
  packageName: string;
}

export interface ApplyCodeActionCommandResult {
  successMessage: string;
}

export interface DocumentRegistry {
  /**
   * Request a stored SourceFile with a given fileName and compilationSettings.
   * The first call to acquire will call createLanguageServiceSourceFile to generate
   * the SourceFile if was not found in the registry.
   *
   * @param fileName The name of the file requested
   * @param compilationSettingsOrHost Some compilation settings like target affects the
   * shape of a the resulting SourceFile. This allows the DocumentRegistry to store
   * multiple copies of the same file for different compilation settings. A minimal
   * resolution cache is needed to fully define a source file's shape when
   * the compilation settings include `module: node16`+, so providing a cache host
   * object should be preferred. A common host is a language service `ConfiguredProject`.
   * @param scriptSnapshot Text of the file. Only used if the file was not found
   * in the registry and a new one was created.
   * @param version Current version of the file. Only used if the file was not found
   * in the registry and a new one was created.
   */
  acquireDocument(
    fileName: string,
    compilationSettingsOrHost: CompilerOptions | MinimalResolutionCacheHost,
    scriptSnapshot: IScriptSnapshot,
    version: string,
    scriptKind?: ScriptKind,
    sourceFileOptions?: CreateSourceFileOptions | ScriptTarget,
  ): SourceFile;
  acquireDocumentWithKey(
    fileName: string,
    path: Path,
    compilationSettingsOrHost: CompilerOptions | MinimalResolutionCacheHost,
    key: DocumentRegistryBucketKey,
    scriptSnapshot: IScriptSnapshot,
    version: string,
    scriptKind?: ScriptKind,
    sourceFileOptions?: CreateSourceFileOptions | ScriptTarget,
  ): SourceFile;
  /**
   * Request an updated version of an already existing SourceFile with a given fileName
   * and compilationSettings. The update will in-turn call updateLanguageServiceSourceFile
   * to get an updated SourceFile.
   *
   * @param fileName The name of the file requested
   * @param compilationSettingsOrHost Some compilation settings like target affects the
   * shape of a the resulting SourceFile. This allows the DocumentRegistry to store
   * multiple copies of the same file for different compilation settings. A minimal
   * resolution cache is needed to fully define a source file's shape when
   * the compilation settings include `module: node16`+, so providing a cache host
   * object should be preferred. A common host is a language service `ConfiguredProject`.
   * @param scriptSnapshot Text of the file.
   * @param version Current version of the file.
   */
  updateDocument(
    fileName: string,
    compilationSettingsOrHost: CompilerOptions | MinimalResolutionCacheHost,
    scriptSnapshot: IScriptSnapshot,
    version: string,
    scriptKind?: ScriptKind,
    sourceFileOptions?: CreateSourceFileOptions | ScriptTarget,
  ): SourceFile;
  updateDocumentWithKey(
    fileName: string,
    path: Path,
    compilationSettingsOrHost: CompilerOptions | MinimalResolutionCacheHost,
    key: DocumentRegistryBucketKey,
    scriptSnapshot: IScriptSnapshot,
    version: string,
    scriptKind?: ScriptKind,
    sourceFileOptions?: CreateSourceFileOptions | ScriptTarget,
  ): SourceFile;
  getKeyForCompilationSettings(settings: CompilerOptions): DocumentRegistryBucketKey;
  /**
   * Informs the DocumentRegistry that a file is not needed any longer.
   *
   * Note: It is not allowed to call release on a SourceFile that was not acquired from
   * this registry originally.
   *
   * @param fileName The name of the file to be released
   * @param compilationSettings The compilation settings used to acquire the file
   * @param scriptKind The script kind of the file to be released
   *
   * @deprecated pass scriptKind and impliedNodeFormat for correctness
   */
  releaseDocument(fileName: string, compilationSettings: CompilerOptions, scriptKind?: ScriptKind): void;
  /**
   * Informs the DocumentRegistry that a file is not needed any longer.
   *
   * Note: It is not allowed to call release on a SourceFile that was not acquired from
   * this registry originally.
   *
   * @param fileName The name of the file to be released
   * @param compilationSettings The compilation settings used to acquire the file
   * @param scriptKind The script kind of the file to be released
   * @param impliedNodeFormat The implied source file format of the file to be released
   */
  releaseDocument(fileName: string, compilationSettings: CompilerOptions, scriptKind: ScriptKind, impliedNodeFormat: ResolutionMode): void;
  /**
   * @deprecated pass scriptKind for and impliedNodeFormat correctness */
  releaseDocumentWithKey(path: Path, key: DocumentRegistryBucketKey, scriptKind?: ScriptKind): void;
  releaseDocumentWithKey(path: Path, key: DocumentRegistryBucketKey, scriptKind: ScriptKind, impliedNodeFormat: ResolutionMode): void;
  reportStats(): string;
}

export type DocumentRegistryBucketKey = string & {
  __bucketKey: any;
};

export interface ParseConfigHost extends ModuleResolutionHost {
  useCaseSensitiveFileNames: boolean;
  readDirectory(
    rootDir: string,
    extensions: readonly string[],
    excludes: readonly string[] | undefined,
    includes: readonly string[],
    depth?: number,
  ): readonly string[];
  /**
   * Gets a value indicating whether the specified path exists and is a file.
   * @param path The path to test.
   */
  fileExists(path: string): boolean;
  readFile(path: string): string | undefined;
  trace?(s: string): void;
}

export interface SuperElementAccessExpression extends ElementAccessExpression {
  readonly expression: SuperExpression;
}

export interface SuperPropertyAccessExpression extends PropertyAccessExpression {
  readonly expression: SuperExpression;
}

export interface AssignmentExpression<TOperator extends AssignmentOperatorToken> extends BinaryExpression {
  readonly left: LeftHandSideExpression;
  readonly operatorToken: TOperator;
}

export interface JSDocType extends TypeNode {
  _jsDocTypeBrand: any;
}

export interface PrimaryExpression extends MemberExpression {
  _primaryExpressionBrand: any;
}

export interface MemberExpression extends LeftHandSideExpression {
  _memberExpressionBrand: any;
}

export interface UpdateExpression extends UnaryExpression {
  _updateExpressionBrand: any;
}

export interface UnaryExpression extends Expression {
  _unaryExpressionBrand: any;
}

export interface IterationStatement extends Statement {
  readonly statement: Statement;
}

export type AssertionKey = ImportAttributeName;

export type JsxCallLike = JsxOpeningLikeElement | JsxOpeningFragment;

export interface ClassLikeDeclarationBase extends NamedDeclaration, JSDocContainer {
  readonly kind: SyntaxKind.ClassDeclaration | SyntaxKind.ClassExpression;
  readonly name?: Identifier;
  readonly typeParameters?: NodeArray<TypeParameterDeclaration>;
  readonly heritageClauses?: NodeArray<HeritageClause>;
  readonly members: NodeArray<ClassElement>;
}

export interface NamedDeclaration extends Declaration {
  readonly name?: DeclarationName;
}

export interface JSDocContainer extends Node {
  _jsdocContainerBrand: any;
}

export interface SourceFileLike {
  getLineAndCharacterOfPosition(pos: number): LineAndCharacter;
}

export type SymbolTable = Map<__String, Symbol>;

export enum EmitHint {
  SourceFile = 0,
  Expression = 1,
  IdentifierName = 2,
  MappedTypeParameter = 3,
  Unspecified = 4,
  EmbeddedStatement = 5,
  JsxAttributeValue = 6,
  ImportTypeNodeAttributes = 7,
}

export interface JSDocAuthorTag extends JSDocTag {
  readonly kind: never;
}

export interface JSDocClassTag extends JSDocTag {
  readonly kind: never;
}

export interface JSDocEnumTag extends JSDocTag, Declaration, LocalsContainer {
  readonly kind: never;
  readonly parent: JSDoc;
  readonly typeExpression: JSDocTypeExpression;
}

export interface LocalsContainer extends Node {
  _localsContainerBrand: any;
}

export interface JSDocFunctionType extends JSDocType, SignatureDeclarationBase, LocalsContainer {
  readonly kind: never;
}

export interface SignatureDeclarationBase extends NamedDeclaration, JSDocContainer {
  readonly kind: SignatureDeclaration["kind"];
  readonly name?: PropertyName;
  readonly typeParameters?: NodeArray<TypeParameterDeclaration> | undefined;
  readonly parameters: NodeArray<ParameterDeclaration>;
  readonly type?: TypeNode | undefined;
}

export interface JSDocMemberName extends Node {
  readonly kind: never;
  readonly left: EntityName | JSDocMemberName;
  readonly right: Identifier;
}

export interface JSDocNamepathType extends JSDocType {
  readonly kind: never;
  readonly type: TypeNode;
}

export interface JSDocUnknownType extends JSDocType {
  readonly kind: never;
}

export interface JSDocPropertyLikeTag extends JSDocTag, Declaration {
  readonly parent: JSDoc;
  readonly name: EntityName;
  readonly typeExpression?: JSDocTypeExpression;
  /** Whether the property name came before the type -- non-standard for JSDoc, but Typescript-like */
  readonly isNameFirst: boolean;
  readonly isBracketed: boolean;
}

export interface InstanceofExpression extends BinaryExpression {
  readonly operatorToken: Token<SyntaxKind.InstanceOfKeyword>;
}

export interface CommaListExpression extends Expression {
  readonly kind: never;
  readonly elements: NodeArray<Expression>;
}

export interface TextChange {
  span: TextSpan;
  newText: string;
}

export type FunctionOrConstructorTypeNode = FunctionTypeNode | ConstructorTypeNode;

export enum ScriptElementKind {
  unknown = "",
  warning = "warning",
  /** predefined type (void) or keyword (class) */
  keyword = "keyword",
  /** top level script node */
  scriptElement = "script",
  /** module foo {} */
  moduleElement = "module",
  /** class X {} */
  classElement = "class",
  /** var x = class X {} */
  localClassElement = "local class",
  /** interface Y {} */
  interfaceElement = "interface",
  /** type T = ... */
  typeElement = "type",
  /** enum E */
  enumElement = "enum",
  enumMemberElement = "enum member",
  /**
   * Inside module and script only
   * const v = ..
   */
  variableElement = "var",
  /** Inside function */
  localVariableElement = "local var",
  /** using foo = ... */
  variableUsingElement = "using",
  /** await using foo = ... */
  variableAwaitUsingElement = "await using",
  /**
   * Inside module and script only
   * function f() { }
   */
  functionElement = "function",
  /** Inside function */
  localFunctionElement = "local function",
  /** class X { [public|private]* foo() {} } */
  memberFunctionElement = "method",
  /** class X { [public|private]* [get|set] foo:number; } */
  memberGetAccessorElement = "getter",
  memberSetAccessorElement = "setter",
  /**
   * class X { [public|private]* foo:number; }
   * interface Y { foo:number; }
   */
  memberVariableElement = "property",
  /** class X { [public|private]* accessor foo: number; } */
  memberAccessorVariableElement = "accessor",
  /**
   * class X { constructor() { } }
   * class X { static { } }
   */
  constructorImplementationElement = "constructor",
  /** interface Y { ():number; } */
  callSignatureElement = "call",
  /** interface Y { []:number; } */
  indexSignatureElement = "index",
  /** interface Y { new():Y; } */
  constructSignatureElement = "construct",
  /** function foo(*Y*: string) */
  parameterElement = "parameter",
  typeParameterElement = "type parameter",
  primitiveType = "primitive type",
  label = "label",
  alias = "alias",
  constElement = "const",
  letElement = "let",
  directory = "directory",
  externalModuleName = "external module name",
  /**
   * <JsxTagName attribute1 attribute2={0} />
   * @deprecated
   */
  jsxAttribute = "JSX attribute",
  /** String literal */
  string = "string",
  /** Jsdoc @link: in `{@link C link text}`, the before and after text "{@link " and "}" */
  link = "link",
  /** Jsdoc @link: in `{@link C link text}`, the entity name "C" */
  linkName = "link name",
  /** Jsdoc @link: in `{@link C link text}`, the link text "link text" */
  linkText = "link text",
}

export interface OrganizeImportsArgs extends CombinedCodeFixScope {
  /** @deprecated Use `mode` instead */
  skipDestructiveCodeActions?: boolean;
  mode?: OrganizeImportsMode;
}

export interface CombinedCodeFixScope {
  type: "file";
  fileName: string;
}

export enum OrganizeImportsMode {
  All = "All",
  SortAndCombine = "SortAndCombine",
  RemoveUnused = "RemoveUnused",
}

export interface CodeAction {
  /** Description of the code action to display in the UI of the editor */
  description: string;
  /** Text changes to apply to each file as part of the code action */
  changes: FileTextChanges[];
  /**
   * If the user accepts the code fix, the editor should send the action back in a `applyAction` request.
   * This allows the language service to have side effects (e.g. installing dependencies) upon a code fix.
   */
  commands?: CodeActionCommand[];
}

export interface FileTextChanges {
  fileName: string;
  textChanges: readonly TextChange[];
  isNewFile?: boolean;
}

export type CodeActionCommand = InstallPackageAction;

export interface InstallPackageAction {
}

export interface CodeFixAction extends CodeAction {
  /** Short name to identify the fix, for use by telemetry. */
  fixName: string;
  /**
   * If present, one may call 'getCombinedCodeFix' with this fixId.
   * This may be omitted to indicate that the code fix can't be applied in a group.
   */
  fixId?: {};
  fixAllDescription?: string;
}

export interface CombinedCodeActions {
  changes: readonly FileTextChanges[];
  commands?: readonly CodeActionCommand[];
}

export interface DefinitionInfo extends DocumentSpan {
  kind: ScriptElementKind;
  name: string;
  containerKind: ScriptElementKind;
  containerName: string;
  unverified?: boolean;
}

export interface DocumentSpan {
  textSpan: TextSpan;
  fileName: string;
  /**
   * If the span represents a location that was remapped (e.g. via a .d.ts.map file),
   * then the original filename and span will be specified here
   */
  originalTextSpan?: TextSpan;
  originalFileName?: string;
  /**
   * If DocumentSpan.textSpan is the span for name of the declaration,
   * then this is the span for relevant declaration
   */
  contextSpan?: TextSpan;
  originalContextSpan?: TextSpan;
}

export interface DiagnosticMessageChain {
  messageText: string;
  category: DiagnosticCategory;
  code: number;
  next?: DiagnosticMessageChain[];
}

export type DiagnosticWithLocation = Diagnostic;

export interface ImplementationLocation extends DocumentSpan {
  kind: ScriptElementKind;
  displayParts: SymbolDisplayPart[];
}

export interface SymbolDisplayPart {
  /**
   * Text of an item describing the symbol.
   */
  text: string;
  /**
   * The symbol's kind (such as 'className' or 'parameterName' or plain 'text').
   */
  kind: string;
}

export interface OutputFile {
  name: string;
  writeByteOrderMark: boolean;
  text: string;
}

export interface RefactorEditInfo {
  edits: FileTextChanges[];
  renameFilename?: string;
  renameLocation?: number;
  commands?: CodeActionCommand[];
  notApplicableReason?: string;
}

export interface ReferenceEntry extends DocumentSpan {
  isWriteAccess: boolean;
  isInString?: true;
}

export interface ReferencedSymbol {
  definition: ReferencedSymbolDefinitionInfo;
  references: ReferencedSymbolEntry[];
}

export interface ReferencedSymbolDefinitionInfo extends DefinitionInfo {
  displayParts: SymbolDisplayPart[];
}

export interface RenameLocation extends DocumentSpan {
  readonly prefixText?: string;
  readonly suffixText?: string;
}

export enum IndentStyle {
  None = 0,
  Block = 1,
  Smart = 2,
}

export interface ReferencedSymbolEntry extends ReferenceEntry {
  isDefinition?: boolean;
}

export type ArrayDestructuringAssignment = AssignmentExpression<Token<SyntaxKind.EqualsToken>> & {
  readonly left: import("typescript/ast").ArrayLiteralExpression;
};
export type ObjectDestructuringAssignment = AssignmentExpression<Token<SyntaxKind.EqualsToken>> & {
  readonly left: import("typescript/ast").ObjectLiteralExpression;
};
