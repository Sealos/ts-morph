import { minimatch } from "minimatch";
import { createNativeCompilerFileSystem } from "../compiler/createNativeCompilerFileSystem";
import { Memoize } from "../decorators";
import { FileUtils, StandardizedFilePath, TransactionalFileSystem } from "../fileSystem";
import { NativeCompilerSession, ts } from "../typescript";

export class TsConfigResolver {
  readonly #encoding: string;
  readonly #fileSystem: TransactionalFileSystem;
  readonly #tsConfigFilePath: StandardizedFilePath;
  readonly #tsConfigDirPath: StandardizedFilePath;

  constructor(fileSystem: TransactionalFileSystem, tsConfigFilePath: StandardizedFilePath, encoding: string) {
    this.#tsConfigFilePath = fileSystem.getStandardizedAbsolutePath(tsConfigFilePath);
    this.#tsConfigDirPath = FileUtils.getDirPath(this.#tsConfigFilePath);
    this.#fileSystem = fileSystem;
    this.#encoding = encoding;
  }

  getCompilerOptions() {
    return this._parseJsonConfigFileContent().options;
  }

  getErrors() {
    return this._parseJsonConfigFileContent().errors || [];
  }

  @Memoize
  getPaths(compilerOptions?: ts.CompilerOptions) {
    const files = new Set<StandardizedFilePath>();
    const fileSystem = this.#fileSystem;
    const directories = new Set<StandardizedFilePath>();

    compilerOptions = compilerOptions ?? this.getCompilerOptions();

    const configFileContent = this._parseJsonConfigFileContent();

    if (configFileContent.fileNames.length === 0 && configFileContent.directories.length > 0)
      directories.add(this.#tsConfigDirPath);

    for (let fileName of configFileContent.fileNames) {
      const filePath = fileSystem.getStandardizedAbsolutePath(fileName);
      const parentDirPath = FileUtils.getDirPath(filePath);
      if (fileSystem.fileExistsSync(filePath)) {
        directories.add(parentDirPath);
        files.add(filePath);
      }
    }

    const raw = configFileContent.rawConfig as { exclude?: string[] };
    const exclusions = [...(raw.exclude ?? []), ...(compilerOptions.outDir == null ? [] : [compilerOptions.outDir])]
      .map(pattern => fileSystem.getStandardizedAbsolutePath(pattern, this.#tsConfigDirPath));
    for (const directory of configFileContent.directories.sort()) {
      const path = fileSystem.getStandardizedAbsolutePath(directory);
      if (
        !directories.has(FileUtils.getDirPath(path))
        || exclusions.some(pattern => path === pattern || path.startsWith(pattern + "/") || minimatch(path, pattern))
      ) {
        continue;
      }
      if (fileSystem.directoryExistsSync(path) && fileSystem.readDirSync(path).length === 0)
        directories.add(path);
    }

    return {
      filePaths: Array.from(files.values()),
      directoryPaths: Array.from(directories.values()).sort(),
    };
  }

  @Memoize
  private _parseJsonConfigFileContent() {
    const host = createNativeCompilerFileSystem(this.#fileSystem);
    const directories: string[] = [];
    const getEntries = host.getAccessibleEntries;
    host.getAccessibleEntries = path => {
      directories.push(path);
      return getEntries(path);
    };
    using session = new NativeCompilerSession(host);
    // Read through our filesystem first to preserve FileNotFoundError and encoding.
    this.#fileSystem.readFileSync(this.#tsConfigFilePath, this.#encoding);
    const config = session.api.readConfigFile(this.#tsConfigFilePath);
    if (config.error != null)
      throw new Error(config.error.text);
    const result = session.api.parseConfigFile(this.#tsConfigFilePath);
    if (result.fileNames.length === 0 && !(config.config as { files?: unknown }).files && !result.errors.some(error => error.code === 18003)) {
      const raw = config.config as { include?: string[]; exclude?: string[] };
      result.errors.push({
        category: ts.DiagnosticCategory.Error,
        code: 18003,
        pos: -1,
        end: -1,
        text: `No inputs were found in config file '${this.#tsConfigFilePath}'. Specified 'include' paths were '${
          JSON.stringify(raw.include ?? ["**/*"])
        }' and 'exclude' paths were '${JSON.stringify(raw.exclude ?? [])}'.`,
      });
    }
    return { ...result, directories, rawConfig: config.config };
  }
}
