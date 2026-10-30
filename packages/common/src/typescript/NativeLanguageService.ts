import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  createScanner,
  getLeadingCommentRanges,
  getTrailingCommentRanges,
  isBinaryExpression,
  isPostfixUnaryExpression,
  isPrefixUnaryExpression,
  type Node,
  ScriptTarget,
  type SourceFile,
  SyntaxKind,
} from "typescript/ast";
import type { EditorSettings, FormatCodeSettings } from "typescript/proto";
import { EmitOnly, ModuleKind, ModuleResolutionKind, type Program, type UserPreferences } from "typescript/sync";
import type { DocumentRegistry } from "../compiler/DocumentRegistry";
import {
  type CodeFixAction,
  type CombinedCodeActions,
  type CombinedCodeFixScope,
  type DefinitionInfo,
  type FileTextChanges,
  type ImplementationLocation,
  type LanguageServiceHost,
  type OrganizeImportsArgs,
  type RefactorEditInfo,
  type ReferencedSymbol,
  type RenameLocation,
  ScriptElementKind,
  type TextChange,
} from "./compatibility";
import { type LanguageServerNotification, NativeLanguageServiceBridge } from "./NativeLanguageServiceBridge";

interface Position {
  line: number;
  character: number;
}
interface Range {
  start: Position;
  end: Position;
}
interface Edit {
  range: Range;
  newText: string;
}
interface WorkspaceEdit {
  changes?: Record<string, Edit[]>;
  documentChanges?: ({ textDocument: { uri: string }; edits: Edit[] } | { kind: string })[];
}
interface CodeAction {
  title: string;
  kind?: string;
  edit?: WorkspaceEdit;
}
interface Location {
  uri: string;
  range: Range;
}
interface LocationLink {
  targetUri: string;
  targetRange: Range;
  targetSelectionRange: Range;
}

/** Adapts native semantic queries and standard LSP edits to ts-morph's synchronous tools. @internal */
export class NativeLanguageService {
  readonly #host: LanguageServiceHost;
  readonly #registry: DocumentRegistry;
  readonly #bridge = new NativeLanguageServiceBridge();
  readonly #documents = new Map<string, { text: string; version: number }>();
  #version: string | undefined;
  #configuration = "";

  constructor(host: LanguageServiceHost, registry: DocumentRegistry) {
    this.#host = host;
    this.#registry = registry;
    registry.nativeSession.own(this.#bridge);
  }

  getProgram(): Program {
    return this.#registry.nativeSession.getProgram(this.#host.getScriptFileNames(), this.#host.getCompilationSettings());
  }

  #file(fileName: string): SourceFile {
    const file = this.getProgram().getSourceFile(fileName);
    if (file == null)
      throw new Error(`Source file not found in the project: ${fileName}`);
    return file;
  }

  #notifications(settings: UserPreferences = {}): LanguageServerNotification[] {
    const notifications: LanguageServerNotification[] = [];
    const program = this.getProgram();
    const files = new Map<string, string>();
    for (const fileName of program.getSourceFileNames()) {
      const file = program.getSourceFile(fileName)!;
      files.set(fileName, file.text);
      // Package metadata is needed for exports/imports resolution even when
      // all source documents are virtual and have never been saved to disk.
      for (let dir = path.dirname(fileName);; dir = path.dirname(dir)) {
        const packageJson = path.join(dir, "package.json");
        if (!files.has(packageJson) && this.#host.fileExists(packageJson)) {
          const text = this.#host.readFile(packageJson);
          if (text != null)
            files.set(packageJson, text);
        }
        if (dir === path.dirname(dir))
          break;
      }
    }
    const options = { ...this.#host.getCompilationSettings() } as Record<string, unknown>;
    for (const [key, values] of [["target", ScriptTarget], ["module", ModuleKind], ["moduleResolution", ModuleResolutionKind]] as const) {
      if (typeof options[key] === "number")
        options[key] = values[options[key] as number];
    }
    if (this.#host.getCompilationSettings().target === ScriptTarget.Latest)
      options.target = "ESNext";
    if (typeof options.newLine === "number")
      options.newLine = options.newLine === 1 ? "crlf" : "lf";
    if (typeof options.jsx === "number") {
      const jsx = [undefined, "preserve", "react", "react-native", "react-jsx", "react-jsxdev"][options.jsx];
      if (jsx == null)
        delete options.jsx;
      else
        options.jsx = jsx;
    }
    if (Array.isArray(options.lib))
      options.lib = options.lib.map(name => name.replace(/^lib\./, "").replace(/\.d\.ts$/, ""));
    if (this.#host.resolveModuleNames != null) {
      const paths = { ...(options.paths as Record<string, string[]> | undefined) };
      const overrides = new Map<string, string>();
      const targets = new Map<string, Set<string>>();
      this.#registry.nativeSession.withDefaultModuleResolver(this.#host.getCompilationSettings(), resolve => {
        for (const fileName of program.getSourceFileNames()) {
          for (const node of program.getSourceFile(fileName)!.imports) {
            if (!("text" in node) || typeof node.text !== "string")
              continue;
            const specifier = node as import("typescript/ast").StringLiteralLikeNode;
            const resolved = program.getResolvedModuleFromModuleSpecifier(specifier, fileName);
            const usageMode = program.getModeForUsageLocation(fileName, specifier);
            const mode = usageMode === ModuleKind.None || usageMode === ModuleKind.CommonJS || usageMode === ModuleKind.ESNext ? usageMode : undefined;
            const builtin = resolve(node.text, path.dirname(fileName), mode);
            const names = targets.get(node.text) ?? new Set<string>();
            if (resolved != null)
              names.add(resolved.resolvedFileName);
            targets.set(node.text, names);
            if (resolved?.resolvedFileName === builtin?.resolvedFileName)
              continue;
            if (resolved == null || node.text.startsWith("."))
              throw new Error("The native editor bridge cannot represent custom unresolved modules or remapped relative imports.");
            overrides.set(node.text, resolved.resolvedFileName);
          }
        }
      });
      for (const [name, target] of overrides) {
        if (targets.get(name)!.size > 1)
          throw new Error("The native editor bridge cannot represent conflicting custom aliases across directories.");
        paths[name] = [target];
      }
      options.paths = paths;
    }
    const configFile = typeof options.configFilePath === "string" ? options.configFilePath : path.join(this.#host.getCurrentDirectory(), "tsconfig.json");
    delete options.configFilePath;
    const config = JSON.stringify({ compilerOptions: options, files: this.#host.getScriptFileNames() });
    // Open the configuration before its documents, so the server discovers a
    // configured project even when the entire directory exists only in memory.
    const orderedFiles = new Map([[configFile, config], ...files]);
    orderedFiles.set(configFile, config);
    for (const [fileName, text] of orderedFiles) {
      const previous = this.#documents.get(fileName);
      if (previous?.text === text)
        continue;
      const uri = pathToFileURL(fileName).href;
      const version = (previous?.version ?? 0) + 1;
      notifications.push(
        previous == null
          ? {
            method: "textDocument/didOpen",
            params: {
              textDocument: {
                uri,
                version,
                languageId: /\.json$/.test(fileName)
                  ? "json"
                  : /\.[cm]?jsx$/.test(fileName)
                  ? "javascriptreact"
                  : /\.tsx$/.test(fileName)
                  ? "typescriptreact"
                  : "typescript",
                text,
              },
            },
          }
          : { method: "textDocument/didChange", params: { textDocument: { uri, version }, contentChanges: [{ text }] } },
      );
      this.#documents.set(fileName, { text, version });
    }
    for (const fileName of this.#documents.keys()) {
      if (!orderedFiles.has(fileName)) {
        notifications.push({ method: "textDocument/didClose", params: { textDocument: { uri: pathToFileURL(fileName).href } } });
        this.#documents.delete(fileName);
      }
    }
    const configuration = JSON.stringify(settings);
    if (configuration !== this.#configuration) {
      this.#configuration = configuration;
      notifications.push({ method: "workspace/didChangeConfiguration", params: { settings: { "js/ts": settings } } });
    }
    return notifications;
  }

  #request<T>(method: string, params: unknown, settings?: UserPreferences): T {
    return this.#bridge.request<T>(method, params, this.#notifications(settings));
  }

  #position(fileName: string, position: number): Position {
    return this.#file(fileName).getLineAndCharacterOfPosition(position);
  }

  #documentPosition(fileName: string, position: number) {
    return { textDocument: { uri: pathToFileURL(fileName).href }, position: this.#position(fileName, position) };
  }

  #textChange(fileName: string, edit: Edit): TextChange {
    const file = this.#file(fileName);
    const start = file.getPositionOfLineAndCharacter(edit.range.start.line, edit.range.start.character);
    const end = file.getPositionOfLineAndCharacter(edit.range.end.line, edit.range.end.character);
    return { span: { start, length: end - start }, newText: edit.newText };
  }

  #changes(edit: WorkspaceEdit | undefined): FileTextChanges[] {
    const files = new Map<string, TextChange[]>();
    const add = (uri: string, edits: Edit[]) => {
      const fileName = fileURLToPath(uri);
      const changes = files.get(fileName) ?? [];
      changes.push(...edits.map(change => this.#textChange(fileName, change)));
      files.set(fileName, changes);
    };
    for (const [uri, changes] of Object.entries(edit?.changes ?? {}))
      add(uri, changes);
    for (const change of edit?.documentChanges ?? []) {
      if (!("textDocument" in change))
        throw new Error("This language-server action requires file operations, which cannot be represented as text changes.");
      add(change.textDocument.uri, change.edits);
    }
    return [...files].map(([fileName, textChanges]) => ({ fileName, textChanges }));
  }

  #definition(fileName: string, start: number, length: number): DefinitionInfo {
    const file = this.#file(fileName);
    const node = nodeAtPosition(file, start);
    const parent = node.parent ?? node;
    if (start === 0 && length === file.text.length) {
      return {
        fileName,
        textSpan: { start, length },
        name: fileName,
        kind: ScriptElementKind.moduleElement,
        containerKind: ScriptElementKind.unknown,
        containerName: "",
      };
    }
    const kinds: Partial<Record<SyntaxKind, ScriptElementKind>> = {
      [SyntaxKind.FunctionDeclaration]: ScriptElementKind.functionElement,
      [SyntaxKind.ClassDeclaration]: ScriptElementKind.classElement,
      [SyntaxKind.InterfaceDeclaration]: ScriptElementKind.interfaceElement,
      [SyntaxKind.TypeAliasDeclaration]: ScriptElementKind.typeElement,
      [SyntaxKind.Parameter]: ScriptElementKind.parameterElement,
      [SyntaxKind.ImportSpecifier]: ScriptElementKind.alias,
      [SyntaxKind.ImportClause]: ScriptElementKind.alias,
      [SyntaxKind.NamespaceImport]: ScriptElementKind.alias,
      [SyntaxKind.MethodDeclaration]: ScriptElementKind.memberFunctionElement,
    };
    return {
      fileName,
      textSpan: { start, length },
      name: node.getText(),
      kind: kinds[parent.kind] ?? ScriptElementKind.variableElement,
      containerKind: ScriptElementKind.unknown,
      containerName: "",
    };
  }

  getDefinitionAtPosition(fileName: string, position: number): DefinitionInfo[] {
    const result = this.#request<(Location | LocationLink)[] | Location | null>("textDocument/definition", this.#documentPosition(fileName, position));
    return (result == null ? [] : Array.isArray(result) ? result : [result]).map(location => {
      const file = fileURLToPath("targetUri" in location ? location.targetUri : location.uri);
      const range = "targetSelectionRange" in location ? location.targetSelectionRange : location.range;
      const span = this.#textChange(file, { range, newText: "" }).span;
      return this.#definition(file, span.start, span.length);
    });
  }

  getImplementationAtPosition(fileName: string, position: number): ImplementationLocation[] {
    const result = this.#request<(Location | LocationLink)[] | null>("textDocument/implementation", this.#documentPosition(fileName, position));
    return (result ?? []).map(location => {
      const file = fileURLToPath("targetUri" in location ? location.targetUri : location.uri);
      const range = "targetSelectionRange" in location ? location.targetSelectionRange : location.range;
      const definition = this.#definition(
        file,
        this.#textChange(file, { range, newText: "" }).span.start,
        this.#textChange(file, { range, newText: "" }).span.length,
      );
      return { ...definition, displayParts: [{ text: definition.name, kind: "text" }] };
    });
  }

  findReferences(fileName: string, position: number): ReferencedSymbol[] {
    const project = this.getProgram().getProject();
    const node = nodeAtPosition(this.#file(fileName), position);
    return project.languageService.getReferencedSymbolsForNode(node, position).map(entry => {
      const declaration = entry.definition.resolve();
      if (declaration == null)
        throw new Error("Native reference definition could not be resolved.");
      const name = "name" in declaration && declaration.name != null ? declaration.name as Node : declaration;
      const definition = this.#definition(name.getSourceFile().fileName, name.getStart(), name.getWidth());
      let displayParts = [{ text: definition.name, kind: "text" }];
      if (declaration.kind === SyntaxKind.FunctionDeclaration) {
        const signature = project.checker.getSignatureFromDeclaration(declaration as import("typescript/ast").FunctionDeclaration);
        if (signature != null) {
          const parameters = signature.getParameters().map(parameter =>
            `${parameter.name}: ${project.checker.typeToString(project.checker.getTypeOfSymbolAtLocation(parameter, declaration))}`
          ).join(", ");
          displayParts = [{ text: "function", kind: "keyword" }, {
            text: ` ${definition.name}(${parameters}): ${project.checker.typeToString(signature.getReturnType())}`,
            kind: "text",
          }];
        }
      }
      return {
        definition: { ...definition, name: displayParts.map(part => part.text).join(""), displayParts },
        references: entry.references.map(handle => {
          const reference = handle.resolve();
          if (reference == null)
            throw new Error("Native reference node could not be resolved.");
          const file = reference.getSourceFile().fileName;
          const start = reference.getStart();
          const isDefinition = file === definition.fileName
            && (start === definition.textSpan.start || (name === declaration && reference.parent === declaration));
          return { fileName: file, textSpan: { start, length: reference.getWidth() }, isDefinition, isWriteAccess: isDefinition || isWrite(reference) };
        }),
      };
    });
  }

  findRenameLocations(fileName: string, position: number, strings: boolean, comments: boolean, prefixAndSuffix: boolean): RenameLocation[] {
    let marker = "__ts_morph_rename_target__";
    while (this.getProgram().getSourceFileNames().some(file => this.#file(file).text.includes(marker)))
      marker += "_";
    const edit = this.#request<WorkspaceEdit | null>("textDocument/rename", { ...this.#documentPosition(fileName, position), newName: marker }, {
      providePrefixAndSuffixTextForRename: prefixAndSuffix,
    });
    if (edit == null)
      return [];
    const locations: RenameLocation[] = this.#changes(edit).flatMap(file =>
      file.textChanges.map(change => {
        const index = change.newText.indexOf(marker);
        if (index < 0)
          throw new Error("Native rename returned an edit without the requested identifier.");
        return {
          fileName: file.fileName,
          textSpan: change.span,
          prefixText: change.newText.slice(0, index) || undefined,
          suffixText: change.newText.slice(index + marker.length) || undefined,
        };
      })
    );
    if (strings || comments) {
      const node = nodeAtPosition(this.#file(fileName), position);
      const oldName = node.kind === SyntaxKind.Identifier && "text" in node ? String(node.text) : node.getText();
      if (!/^[\p{ID_Start}$_][\p{ID_Continue}$\u200c\u200d]*$/u.test(oldName))
        return locations;
      for (const file of this.getProgram().getSourceFileNames()) {
        if (!/[/\\]typescript[^/\\]*[/\\]lib[/\\]lib\..*\.d\.ts$/.test(file))
          addTextRenameLocations(this.#file(file), oldName, strings, comments, locations);
      }
    }
    return locations;
  }

  getSuggestionDiagnostics(fileName: string) {
    return this.getProgram().getSuggestionDiagnostics(fileName);
  }

  getFormattingEditsForDocument(fileName: string, settings: FormatCodeSettings): TextChange[] {
    const edits = this.#request<Edit[] | null>("textDocument/formatting", {
      textDocument: { uri: pathToFileURL(fileName).href },
      options: formattingOptions(settings),
    }, settings);
    return (edits ?? []).map(edit => this.#textChange(fileName, edit));
  }

  getFormattingEditsForRange(fileName: string, start: number, end: number, settings: FormatCodeSettings): TextChange[] {
    const edits = this.#request<Edit[] | null>("textDocument/rangeFormatting", {
      textDocument: { uri: pathToFileURL(fileName).href },
      range: { start: this.#position(fileName, start), end: this.#position(fileName, end) },
      options: formattingOptions(settings),
    }, settings);
    return (edits ?? []).map(edit => this.#textChange(fileName, edit));
  }

  getIndentationAtPosition(fileName: string, position: number, settings: EditorSettings): number {
    const source = this.#file(fileName);
    let text = source.text;
    const lineStart = text.lastIndexOf("\n", Math.max(0, position - 1)) + 1;
    const indentationOfLine = (offset: number) => {
      const start = source.text.lastIndexOf("\n", Math.max(0, offset - 1)) + 1;
      const whitespace = /^[ \t]*/.exec(source.text.slice(start))![0];
      return [...whitespace].reduce((count, ch) => ch === "\t" ? count + (settings.tabSize ?? 4) - count % (settings.tabSize ?? 4) : count + 1, 0);
    };
    const scanner = createScanner(false, undefined, text);
    for (let kind = scanner.scan(); kind !== SyntaxKind.EndOfFile && scanner.getTokenStart() <= position; kind = scanner.scan()) {
      if (kind === SyntaxKind.MultiLineCommentTrivia && scanner.getTokenEnd() >= position)
        return indentationOfLine(scanner.getTokenStart());
    }
    if (text.slice(lineStart, position).trim().length > 0)
      return indentationOfLine(position);
    const statement = source.statements.find(statement => statement.pos <= position && statement.end >= position);
    const baseIndentation = statement == null ? 0 : indentationOfLine(statement.getStart());
    let mapped = position;
    const changes = this.getFormattingEditsForDocument(fileName, settings).sort((a, b) => b.span.start - a.span.start);
    for (const change of changes) {
      if (change.span.start <= mapped)
        mapped += change.newText.length - Math.min(change.span.length, mapped - change.span.start);
      text = text.slice(0, change.span.start) + change.newText + text.slice(change.span.start + change.span.length);
    }
    const line = text.slice(text.lastIndexOf("\n", Math.max(0, mapped - 1)) + 1);
    let indentation = 0;
    for (const character of /^\s*/.exec(line)![0]) {
      if (character === "\t")
        indentation += (settings.tabSize ?? 4) - indentation % (settings.tabSize ?? 4);
      else if (character === " ")
        indentation++;
      else
        break;
    }
    return indentation + baseIndentation;
  }

  organizeImports(scope: OrganizeImportsArgs, settings: FormatCodeSettings, preferences: UserPreferences): FileTextChanges[] {
    const actions = this.#request<CodeAction[] | null>("textDocument/codeAction", {
      textDocument: { uri: pathToFileURL(scope.fileName).href },
      range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
      context: { diagnostics: [], only: ["source.organizeImports.ts"] },
    }, { ...settings, ...preferences });
    return (actions ?? []).flatMap(action => this.#changes(action.edit));
  }

  getCodeFixesAtPosition(
    fileName: string,
    start: number,
    end: number,
    errorCodes: readonly number[],
    settings: FormatCodeSettings,
    preferences: UserPreferences,
  ): CodeFixAction[] {
    const range = { start: this.#position(fileName, start), end: this.#position(fileName, end) };
    const actions = this.#request<CodeAction[] | null>("textDocument/codeAction", {
      textDocument: { uri: pathToFileURL(fileName).href },
      range,
      context: { diagnostics: errorCodes.map(code => ({ range, code, source: "ts", message: "" })), only: ["quickfix"] },
    }, { ...settings, ...preferences });
    return (actions ?? []).filter(action => action.edit != null).map(action => ({
      fixName: action.kind ?? "quickfix",
      description: action.title,
      changes: this.#changes(action.edit),
    }));
  }

  getCombinedCodeFix(scope: CombinedCodeFixScope, fixId: {}, settings: FormatCodeSettings, preferences: UserPreferences): CombinedCodeActions {
    const fileName = scope.fileName;
    if (fixId !== "fixMissingImport" && fixId !== "unusedIdentifier_deleteImports")
      throw new Error("TypeScript 7.1 beta does not expose this combined code fix, including removal of unused identifiers.");
    const range = { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } };
    if (fixId === "unusedIdentifier_deleteImports") {
      const actions = this.#request<CodeAction[] | null>("textDocument/codeAction", {
        textDocument: { uri: pathToFileURL(fileName).href },
        range,
        context: { diagnostics: [], only: ["source.removeUnusedImports.ts"] },
      }, { ...settings, ...preferences });
      return { changes: (actions ?? []).flatMap(action => this.#changes(action.edit)) };
    }
    const diagnostics = this.getProgram().getSemanticDiagnostics(fileName).filter(diagnostic => [2304, 2503, 2552, 2686].includes(diagnostic.code));
    if (diagnostics.length === 0)
      return { changes: [] };
    let action: CodeAction | undefined;
    for (const diagnostic of diagnostics) {
      const missingRange = { start: this.#position(fileName, diagnostic.pos), end: this.#position(fileName, diagnostic.end) };
      const actions = this.#request<CodeAction[] | null>("textDocument/codeAction", {
        textDocument: { uri: pathToFileURL(fileName).href },
        range: missingRange,
        context: { diagnostics: [{ range: missingRange, code: diagnostic.code, source: "ts", message: diagnostic.text }], only: ["quickfix"] },
      }, { ...settings, ...preferences });
      action = actions?.find(action => action.title === "Add all missing imports") ?? actions?.find(action => action.title.startsWith("Add import from"));
      if (action != null)
        break;
    }
    const changes = this.#changes(action?.edit);
    if (settings.newLineCharacter != null) {
      for (const file of changes) {
        for (const change of file.textChanges)
          change.newText = change.newText.replace(/\r?\n/g, settings.newLineCharacter);
      }
    }
    return { changes };
  }

  getEditsForRefactor(
    _file: string,
    _settings: FormatCodeSettings,
    _position: number | { pos: number; end: number },
    _refactor: string,
    _action: string,
    _preferences: UserPreferences,
  ): RefactorEditInfo | undefined {
    throw new Error("TypeScript 7.1 beta does not yet expose refactoring actions.");
  }

  getEmitOutput(fileName: string, declarationsOnly?: boolean) {
    const program = this.getProgram();
    if (this.#host.getCompilationSettings().noEmit)
      return { emitSkipped: true, diagnostics: [], outputFiles: new Map() };
    const output = program.emitToString(declarationsOnly ? EmitOnly.OnlyDts : EmitOnly.All);
    return {
      ...output,
      outputFiles: new Map(
        [...output.outputFiles].filter(([, file]) => String(file.sourceFileName) === fileName).sort(([a], [b]) => emitOrder(a) - emitOrder(b)),
      ),
    };
  }

  dispose() {
    this.#bridge.dispose();
    this.#documents.clear();
  }
}

function formattingOptions(settings: EditorSettings) {
  return { ...settings, tabSize: settings.indentSize ?? settings.tabSize ?? 4, insertSpaces: settings.convertTabsToSpaces ?? true };
}

function nodeAtPosition(file: SourceFile, position: number): Node {
  let result: Node = file;
  for (;;) {
    const child = result.getChildren(file).find(child => child.getStart(file) <= position && child.end > position);
    if (child == null)
      return result;
    result = child;
  }
}

function isWrite(node: Node): boolean {
  const parent = node.parent;
  if (parent == null)
    return false;
  if (isPrefixUnaryExpression(parent) || isPostfixUnaryExpression(parent))
    return parent.operator === SyntaxKind.PlusPlusToken || parent.operator === SyntaxKind.MinusMinusToken;
  return isBinaryExpression(parent) && parent.left === node
    && parent.operatorToken.kind >= SyntaxKind.FirstAssignment && parent.operatorToken.kind <= SyntaxKind.LastAssignment;
}

/** @internal */
export function createLanguageService(host: LanguageServiceHost, registry: DocumentRegistry) {
  return new NativeLanguageService(host, registry);
}

function emitOrder(fileName: string) {
  return /\.[cm]?jsx?\.map$/.test(fileName) ? 0 : /\.[cm]?jsx?$/.test(fileName) ? 1 : fileName.endsWith(".map") ? 2 : 3;
}

function addTextRenameLocations(source: SourceFile, name: string, strings: boolean, comments: boolean, locations: RenameLocation[]) {
  const text = source.text;
  const ranges = new Map<number, number>();
  visit(source);
  const identifierPart = /[\p{ID_Continue}$\u200c\u200d]/u;
  for (const [start, end] of ranges) {
    for (let index = text.indexOf(name, start); index >= start && index + name.length <= end; index = text.indexOf(name, index + name.length)) {
      const before = index >= start + 2 && text.codePointAt(index - 2)! > 0xffff
        ? String.fromCodePoint(text.codePointAt(index - 2)!)
        : index > start
        ? text[index - 1]
        : "";
      const after = index + name.length < end ? String.fromCodePoint(text.codePointAt(index + name.length)!) : "";
      if (identifierPart.test(before) || identifierPart.test(after))
        continue;
      if (
        !locations.some(location =>
          location.fileName === source.fileName && location.textSpan.start < index + name.length && location.textSpan.start + location.textSpan.length > index
        )
      ) {
        locations.push({ fileName: source.fileName, textSpan: { start: index, length: name.length } });
      }
    }
  }
  function visit(node: Node) {
    if (comments) {
      for (const range of [...getLeadingCommentRanges(text, node.pos) ?? [], ...getTrailingCommentRanges(text, node.end) ?? []])
        ranges.set(range.pos, range.end);
    }
    if (strings) {
      switch (node.kind) {
        case SyntaxKind.StringLiteral:
        case SyntaxKind.NoSubstitutionTemplateLiteral:
        case SyntaxKind.TemplateTail:
          ranges.set(node.getStart(source) + 1, node.end - 1);
          break;
        case SyntaxKind.TemplateHead:
        case SyntaxKind.TemplateMiddle:
          ranges.set(node.getStart(source) + 1, node.end - 2);
          break;
      }
    }
    if (node.kind !== SyntaxKind.JSDoc) {
      for (const child of node.getChildren(source))
        visit(child);
    }
  }
}
