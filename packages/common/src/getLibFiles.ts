import { readdirSync, readFileSync } from "node:fs";
import * as path from "node:path";
import { errors } from "./errors";
import { StandardizedFilePath } from "./fileSystem";
import { getNativeLibDirectory } from "./typescript/getNativeLibDirectory";
import { nameof } from "./utils";

/** Gets the TypeScript lib files (.d.ts files). */
let libFiles: { fileName: string; text: string }[] | undefined;
export function getLibFiles() {
  if (libFiles == null) {
    const directory = getNativeLibDirectory();
    libFiles = readdirSync(directory).filter(name => /^lib.*\.d\.ts$/.test(name)).sort().map(fileName => ({
      fileName,
      text: readFileSync(path.join(directory, fileName), "utf8"),
    }));
  }
  return libFiles;
}

/** The folder to use to "store" the in memory lib files. */
export const libFolderInMemoryPath = "/node_modules/typescript/lib" as StandardizedFilePath;

export function getLibFolderPath(options: {
  libFolderPath?: string;
  skipLoadingLibFiles?: boolean;
}) {
  if (options.libFolderPath != null) {
    if (options.skipLoadingLibFiles === true) {
      throw new errors.InvalidOperationError(
        `Cannot set ${nameof(options, "skipLoadingLibFiles")} to true when ${nameof(options, "libFolderPath")} is provided.`,
      );
    }
    return options.libFolderPath;
  }
  return libFolderInMemoryPath;
}
