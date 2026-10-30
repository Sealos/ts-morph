import { errors, getEmitModuleResolutionKind, ModuleResolutionKind, nameof, ts } from "@ts-morph/common";
import { ProjectContext } from "../../ProjectContext";
import { SourceFile } from "../ast/module";
import { Diagnostic, DiagnosticWithLocation, EmitResult, MemoryEmitResult, MemoryEmitResultFile } from "./results";
import { TypeChecker } from "./TypeChecker";

/**
 * Options for emitting from a Program.
 */
export interface ProgramEmitOptions extends EmitOptions {
  writeFile?: ts.WriteFileCallback;
}

/**
 * Options for emitting.
 */
export interface EmitOptions extends EmitOptionsBase {
  /**
   * Optional source file to only emit.
   */
  targetSourceFile?: SourceFile;
}

export interface EmitOptionsBase {
  /**
   * Whether only .d.ts files should be emitted.
   */
  emitOnlyDtsFiles?: boolean;
}

/** @internal */
export interface ProgramCreationData {
  context: ProjectContext;
  rootNames: ReadonlyArray<string>;
  host: ts.CompilerHost;
  configFileParsingDiagnostics: ts.Diagnostic[];
}

/**
 * Wrapper around Program.
 */
export class Program {
  /** @internal */
  readonly #context: ProjectContext;
  /** @internal */
  readonly #typeChecker: TypeChecker;
  /** @internal */
  #createdCompilerObject: ts.Program | undefined;
  #createdEpoch = -1;
  /** @internal */
  #getOrCreateCompilerObject!: () => ts.Program;
  /** @internal */
  #configFileParsingDiagnostics: ts.Diagnostic[];

  /** @private */
  constructor(opts: ProgramCreationData) {
    this.#context = opts.context;
    this.#configFileParsingDiagnostics = opts.configFileParsingDiagnostics;
    this.#typeChecker = new TypeChecker(this.#context);
    this._reset(opts.rootNames, opts.host);
  }

  /**
   * Gets the underlying compiler program.
   */
  get compilerObject() {
    return this.#getOrCreateCompilerObject();
  }

  /**
   * Gets if the internal compiler program is created.
   * @internal
   */
  _isCompilerProgramCreated() {
    return this.#createdCompilerObject != null && this.#createdEpoch === this.#context.compilerFactory.documentRegistry.nativeSession.epoch;
  }

  /**
   * Resets the program.
   * @internal
   */
  _reset(rootNames: ReadonlyArray<string>, host: ts.CompilerHost) {
    const session = this.#context.compilerFactory.documentRegistry.nativeSession;
    session.invalidate();
    this.#createdCompilerObject = undefined;
    this.#getOrCreateCompilerObject = () => {
      this.#context.assertAlive();
      if (this.#createdCompilerObject == null || this.#createdEpoch !== session.epoch) {
        const program = session.getProgram(rootNames, this.#context.compilerOptions.get(), {
          configFileParsingDiagnostics: this.#configFileParsingDiagnostics,
        });
        this.#createdCompilerObject = program;
        this.#createdEpoch = session.epoch;
        for (const fileName of program.getSourceFileNames())
          this.#context.compilerFactory.getSourceFile(program.getSourceFile(fileName)!, { markInProject: false });
      }
      return this.#createdCompilerObject;
    };
    this.#typeChecker._reset(() => this.compilerObject.getProject().checker);
  }

  /**
   * Get the program's type checker.
   */
  getTypeChecker() {
    return this.#typeChecker;
  }

  /**
   * Asynchronously emits the TypeScript files as JavaScript files.
   * @param options - Options for emitting.
   */
  async emit(options: ProgramEmitOptions = {}) {
    if (options.writeFile) {
      const message = `Cannot specify a ${nameof(options, "writeFile")} option when emitting asynchrously. `
        + `Use ${nameof(this, "emitSync")}() instead.`;
      throw new errors.InvalidOperationError(message);
    }

    const { fileSystemWrapper } = this.#context;
    const promises: Promise<void>[] = [];
    const emitResult = this.#emit({
      writeFile: (filePath, text, writeByteOrderMark) => {
        promises
          .push(fileSystemWrapper.writeFile(fileSystemWrapper.getStandardizedAbsolutePath(filePath), writeByteOrderMark ? "\uFEFF" + text : text));
      },
      ...options,
    });
    await Promise.all(promises);
    return new EmitResult(this.#context, emitResult);
  }

  /**
   * Synchronously emits the TypeScript files as JavaScript files.
   * @param options - Options for emitting.
   * @remarks Use `emit()` as the asynchronous version will be much faster.
   */
  emitSync(options: ProgramEmitOptions = {}) {
    return new EmitResult(this.#context, this.#emit(options));
  }

  /**
   * Emits the TypeScript files to JavaScript files to memory.
   * @param options - Options for emitting.
   */
  emitToMemory(options: EmitOptions = {}) {
    const sourceFiles: MemoryEmitResultFile[] = [];
    const { fileSystemWrapper } = this.#context;
    const emitResult = this.#emit({
      writeFile: (filePath, text, writeByteOrderMark) => {
        sourceFiles.push({
          filePath: fileSystemWrapper.getStandardizedAbsolutePath(filePath),
          text,
          writeByteOrderMark: writeByteOrderMark || false,
        });
      },
      ...options,
    });
    return new MemoryEmitResult(this.#context, emitResult, sourceFiles);
  }

  /** @internal */
  #emit(options: ProgramEmitOptions = {}) {
    if ((options as { customTransformers?: unknown }).customTransformers != null)
      throw new errors.InvalidOperationError("TypeScript 7.1 does not support emit-time customTransformers. Use Node.transform() before emitting.");
    if (this.#context.compilerOptions.get().noEmit)
      return { emitSkipped: true, diagnostics: [], emittedFiles: [] };
    const { emitOnlyDtsFiles, writeFile } = options;
    const output = this.compilerObject.emitToString(emitOnlyDtsFiles ? ts.EmitOnly.OnlyDts : ts.EmitOnly.All);
    const emittedFiles: ts.Path[] = [];
    for (const [fileName, file] of output.outputFiles) {
      if (options.targetSourceFile != null && String(file.sourceFileName) !== options.targetSourceFile.getFilePath())
        continue;
      const hasBom = file.text.startsWith("\uFEFF");
      const text = hasBom ? file.text.slice(1) : file.text;
      if (writeFile != null)
        writeFile(fileName, text, hasBom);
      else
        this.#context.fileSystemWrapper.writeFileSync(this.#context.fileSystemWrapper.getStandardizedAbsolutePath(fileName), file.text);
      emittedFiles.push(fileName);
    }
    return { emitSkipped: output.emitSkipped, diagnostics: output.diagnostics, emittedFiles };
  }

  /**
   * Gets the syntactic diagnostics.
   * @param sourceFile - Optional source file to filter by.
   */
  getSyntacticDiagnostics(sourceFile?: SourceFile): DiagnosticWithLocation[] {
    const compilerDiagnostics = this.compilerObject.getSyntacticDiagnostics(sourceFile?.getFilePath());
    return compilerDiagnostics.map(d => this.#context.compilerFactory.getDiagnosticWithLocation(d));
  }

  /**
   * Gets the semantic diagnostics.
   * @param sourceFile - Optional source file to filter by.
   */
  getSemanticDiagnostics(sourceFile?: SourceFile): Diagnostic[] {
    const compilerDiagnostics = this.compilerObject.getSemanticDiagnostics(sourceFile?.getFilePath());
    return compilerDiagnostics.map(d => this.#context.compilerFactory.getDiagnostic(d));
  }

  /**
   * Gets the declaration diagnostics.
   * @param sourceFile - Optional source file to filter by.
   */
  getDeclarationDiagnostics(sourceFile?: SourceFile): DiagnosticWithLocation[] {
    const compilerDiagnostics = this.compilerObject.getDeclarationDiagnostics(sourceFile?.getFilePath());
    return compilerDiagnostics.map(d => this.#context.compilerFactory.getDiagnosticWithLocation(d));
  }

  /**
   * Gets the global diagnostics.
   */
  getGlobalDiagnostics(): Diagnostic[] {
    const compilerDiagnostics = this.compilerObject.getGlobalDiagnostics();
    return compilerDiagnostics.map(d => this.#context.compilerFactory.getDiagnostic(d));
  }

  /**
   * Gets the diagnostics found when parsing the tsconfig.json file.
   */
  getConfigFileParsingDiagnostics(): Diagnostic[] {
    const compilerDiagnostics = this.#configFileParsingDiagnostics;
    return compilerDiagnostics.map(d => this.#context.compilerFactory.getDiagnostic(d));
  }

  /**
   * Gets the emit module resolution kind.
   */
  getEmitModuleResolutionKind(): ModuleResolutionKind {
    return getEmitModuleResolutionKind(this.#context.compilerOptions.get());
  }

  /**
   * Gets if the provided source file was discovered while loading an external library.
   * @param sourceFile - Source file.
   */
  isSourceFileFromExternalLibrary(sourceFile: SourceFile) {
    // Do not use compilerObject.isSourceFileFromExternalLibrary because that method
    // will become out of date after a manipulation has happened to a source file.
    // Read more in sourceFile.isFromExternalLibrary()'s method body.
    return sourceFile.isFromExternalLibrary();
  }
}
