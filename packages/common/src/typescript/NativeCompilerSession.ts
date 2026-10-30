import * as path from "node:path";
import { type ScriptKind, type SourceFile } from "typescript/ast";
import { createFileSystemLayer, type FileSystemCallbacks, type FileSystemEntries, serverFS } from "typescript/fs";
import {
  API,
  type CompilerOptions as NativeCompilerOptions,
  type CreateProgramOptions,
  type ModuleResolver,
  type Program,
  type ResolutionMode,
  type ResolvedModule,
  type RetainedSourceFile,
  type Snapshot,
} from "typescript/sync";
import type { ResolutionHost } from "../compiler/ResolutionHost";
import type { CompilerOptions } from "./CompilerOptions";
import { getNativeLibDirectory } from "./getNativeLibDirectory";

/** Host operations used by the native compiler. Reads must include unsaved files. */
export interface NativeCompilerFileSystem {
  getCurrentDirectory(): string;
  readFile(path: string): string | undefined;
  fileExists(path: string): boolean;
  directoryExists(path: string): boolean;
  getAccessibleEntries(path: string): FileSystemEntries;
  realpath(path: string): string;
}

/**
 * Owns the native process, parsed-file leases, and the current semantic snapshot.
 * A session must be disposed; neither native allocations nor subprocesses are
 * owned by the JavaScript garbage collector.
 * @internal
 */
export class NativeCompilerSession {
  #fileSystem: NativeCompilerFileSystem | undefined;
  #api: API | undefined;
  #snapshot: Snapshot | undefined;
  #program: Program | undefined;
  #resolver: ModuleResolver | undefined;
  #resolutionHost: ResolutionHost | undefined;
  #programOptions: CreateProgramOptions | undefined;
  readonly #files = new Map<string, RetainedSourceFile>();
  readonly #resources = new Set<Disposable>();
  #disposed = false;
  #epoch = 0;
  #skipLibraries = false;
  #libraryDirectory: string | undefined;

  constructor(fileSystem?: NativeCompilerFileSystem) {
    this.#fileSystem = fileSystem;
  }

  setFileSystem(fileSystem: NativeCompilerFileSystem) {
    this.assertAlive();
    if (this.#api != null)
      throw new Error("The native compiler filesystem must be configured before parsing files.");
    this.#fileSystem = fileSystem;
  }

  setResolutionHost(host: ResolutionHost | undefined) {
    if (host?.resolveTypeReferenceDirectives != null || host?.getResolvedModuleWithFailedLookupLocationsFromCache != null)
      throw new Error("TypeScript 7.1 does not expose custom type-reference resolution or failed-lookup cache hooks.");
    this.#resolutionHost = host;
  }

  configureProgramOptions(options: CreateProgramOptions) {
    this.assertAlive();
    if (this.#api != null)
      throw new Error("Program options must be configured before parsing files.");
    this.#programOptions = options;
  }

  own(resource: Disposable) {
    this.assertAlive();
    this.#resources.add(resource);
  }

  configureLibraries(skip: boolean | undefined, directory: string | undefined) {
    this.assertAlive();
    if (this.#api != null)
      throw new Error("Libraries must be configured before parsing files.");
    this.#skipLibraries = skip === true;
    this.#libraryDirectory = directory;
  }

  get epoch() {
    return this.#epoch;
  }

  get api(): API {
    this.assertAlive();
    if (this.#api == null) {
      const host = this.#fileSystem;
      const libDirectory = getNativeLibDirectory().replace(/\\/g, "/");
      const isLibrary = (path: string) => path.replace(/\\/g, "/") === libDirectory || path.replace(/\\/g, "/").startsWith(libDirectory + "/");
      const libraryPath = (path: string) => this.#libraryDirectory == null ? path : this.#libraryDirectory.replace(/\/$/, "") + path.slice(libDirectory.length);
      const fs: FileSystemCallbacks | undefined = host == null ? undefined : {
        directoryExists: path =>
          isLibrary(path)
            ? this.#skipLibraries ? false : this.#libraryDirectory == null ? serverFS.useOS : host.directoryExists(libraryPath(path))
            : host.directoryExists(path),
        fileExists: path =>
          isLibrary(path)
            ? this.#skipLibraries ? false : this.#libraryDirectory == null ? serverFS.useOS : host.fileExists(libraryPath(path))
            : host.fileExists(path),
        getAccessibleEntries: path =>
          isLibrary(path)
            ? this.#skipLibraries
              ? { files: [], directories: [], symlinks: undefined }
              : this.#libraryDirectory == null
              ? serverFS.useOS
              : host.getAccessibleEntries(libraryPath(path))
            : host.getAccessibleEntries(path),
        readFile: path =>
          isLibrary(path)
            ? this.#skipLibraries ? undefined : this.#libraryDirectory == null ? serverFS.useOS : host.readFile(libraryPath(path))
            : host.readFile(path),
        realpath: path => host.realpath(path),
        stat: serverFS.fakeStat,
        writeFile: serverFS.noop,
        removeFile: serverFS.noop,
      };
      // This is the compiler's logical --cwd, not the subprocess spawn cwd;
      // virtual working directories therefore do not need to exist on disk.
      this.#api = new API({ fs, cwd: host?.getCurrentDirectory(), useCaseSensitiveFileNames: true });
    }
    return this.#api;
  }

  parse(fileName: string, text: string, scriptKind?: ScriptKind): SourceFile {
    this.assertAlive();
    const lease = this.api.createSourceFile(fileName, text, { scriptKind });
    const previous = this.#files.get(fileName);
    this.#files.set(fileName, lease);
    previous?.dispose();
    this.invalidate();
    return lease.sourceFile;
  }

  remove(fileName: string) {
    this.assertAlive();
    const lease = this.#files.get(fileName);
    this.#files.delete(fileName);
    lease?.dispose();
    this.invalidate();
  }

  /** Discards semantic handles immediately, while keeping parsed syntax alive. */
  invalidate() {
    this.assertAlive();
    this.#epoch++;
    const program = this.#program;
    const snapshot = this.#snapshot;
    this.#program = undefined;
    this.#snapshot = undefined;
    try {
      program?.dispose();
    } finally {
      snapshot?.dispose();
      this.#resolver?.dispose();
      this.#resolver = undefined;
    }
  }

  getProgram(rootFiles: readonly string[], compilerOptions: CompilerOptions, options?: CreateProgramOptions): Program {
    this.assertAlive();
    if (this.#program != null)
      return this.#program;

    const files = Array.from(this.#files, ([path, lease]) => [path, this.#fileSystem?.readFile(path) ?? lease.sourceFile.text] as const);
    let nativeOptions = { ...this.#programOptions, ...options };
    if (this.#resolutionHost?.resolveModuleNames != null) {
      const host = this.#resolutionHost;
      this.#resolver = this.api.createModuleResolver(compilerOptions as NativeCompilerOptions, {
        resolveModuleName: (name, directory) => {
          // Native resolution is keyed by directory. Recover the importing file
          // when it is among our parsed documents; reject ambiguous overrides.
          const importers = [...this.#files.values()].map(lease => lease.sourceFile).filter(file =>
            path.dirname(file.fileName) === directory && file.imports.some(node => "text" in node && node.text === name)
          );
          const results = (importers.length > 0 ? importers.map(file => file.fileName) : [path.join(directory, "__ts_morph_resolve__.ts")])
            .map(file => host.resolveModuleNames!([name], file, undefined, undefined, compilerOptions)[0]);
          if (results.some(result => result?.resolvedFileName !== results[0]?.resolvedFileName))
            throw new Error("TypeScript 7.1 cannot represent different custom resolutions for the same module in one directory.");
          return results[0] == null ? undefined : { resolvedFileName: results[0].resolvedFileName };
        },
      });
      nativeOptions = { ...nativeOptions, moduleResolver: this.#resolver };
    }
    const snapshot = this.api.createSnapshot({
      fileSystem: createFileSystemLayer(files),
      createPrograms: [{
        rootFiles,
        compilerOptions: { allowNonTsExtensions: true, allowJs: true, ...compilerOptions } as NativeCompilerOptions,
        options: nativeOptions,
      }],
    });
    this.#snapshot = snapshot;
    this.#program = snapshot.operation.createdPrograms[0];
    return this.#program;
  }

  withDefaultModuleResolver<T>(
    options: CompilerOptions,
    action: (resolve: (name: string, directory: string, mode: ResolutionMode | undefined) => ResolvedModule | undefined) => T,
  ): T {
    using resolver = this.api.createModuleResolver(options as NativeCompilerOptions);
    return action((name, directory, mode) => resolver.resolveModuleName(name, directory, mode, { snapshot: this.#snapshot }).resolvedModule);
  }

  assertAlive() {
    if (this.#disposed)
      throw new Error("The project has been disposed.");
  }

  assertEpoch(epoch: number) {
    this.assertAlive();
    if (epoch !== this.#epoch)
      throw new Error("This compiler object is stale after a project edit. Reacquire it from the current project.");
  }

  dispose() {
    if (this.#disposed)
      return;
    const errors: unknown[] = [];
    const attempt = (action: () => void) => {
      try {
        action();
      } catch (error) {
        errors.push(error);
      }
    };
    attempt(() => this.invalidate());
    this.#disposed = true;
    for (const resource of this.#resources)
      attempt(() => resource[Symbol.dispose]());
    this.#resources.clear();
    // Closing the API also releases all remaining parsed-file leases.
    this.#files.clear();
    const api = this.#api;
    this.#api = undefined;
    if (api != null)
      attempt(() => api.close());
    if (errors.length > 0)
      throw new AggregateError(errors, "Failed to dispose native compiler resources.");
  }

  [Symbol.dispose]() {
    this.dispose();
  }
}
