import type { FileSystemEntries } from "typescript/fs";
import { FileUtils, type TransactionalFileSystem } from "../fileSystem";
import type { NativeCompilerFileSystem } from "../typescript/NativeCompilerSession";
import type { TsSourceFileContainer } from "./TsSourceFileContainer";

/** @internal */
export function createNativeCompilerFileSystem(
  fileSystem: TransactionalFileSystem,
  sourceFiles?: TsSourceFileContainer,
): NativeCompilerFileSystem {
  const absolute = (path: string) => fileSystem.getStandardizedAbsolutePath(path);
  return {
    getCurrentDirectory: () => fileSystem.getCurrentDirectory(),
    fileExists: path => sourceFiles?.containsSourceFileAtPath(absolute(path)) || fileSystem.fileExistsSync(absolute(path)),
    directoryExists: path => sourceFiles?.containsDirectoryAtPath(absolute(path)) || fileSystem.directoryExistsSync(absolute(path)),
    readFile: path => {
      const sourceFile = sourceFiles?.getSourceFileFromCacheFromFilePath(absolute(path));
      if (sourceFile != null)
        return sourceFile.text;
      try {
        return fileSystem.readFileSync(absolute(path), "utf-8");
      } catch (error) {
        if (FileUtils.isNotExistsError(error))
          return undefined;
        throw error;
      }
    },
    getAccessibleEntries: path => {
      const files = new Set<string>();
      const directories = new Set<string>();
      try {
        for (const entry of fileSystem.readDirSync(absolute(path))) {
          if (entry.isFile)
            files.add(FileUtils.getBaseName(entry.path));
          else if (entry.isDirectory)
            directories.add(FileUtils.getBaseName(entry.path));
        }
      } catch (error) {
        if (!FileUtils.isNotExistsError(error))
          throw error;
      }
      if (sourceFiles != null) {
        for (const file of sourceFiles.getSourceFilePaths()) {
          if (FileUtils.getDirPath(file) === absolute(path))
            files.add(FileUtils.getBaseName(file));
        }
        for (const dir of sourceFiles.getChildDirectoriesOfDirectory(absolute(path)))
          directories.add(FileUtils.getBaseName(dir));
      }
      return { files: [...files], directories: [...directories], symlinks: undefined } satisfies FileSystemEntries;
    },
    realpath: path => fileSystem.realpathSync(absolute(path)),
  };
}
