import { createNativeCompilerFileSystem } from "../compiler/createNativeCompilerFileSystem";
import { type TransactionalFileSystem } from "../fileSystem";
import { NativeCompilerSession } from "../typescript/NativeCompilerSession";

export function readDirectory(
  fileSystem: TransactionalFileSystem,
  _useCaseSensitiveFileNames: boolean,
  rootDir: string,
  extensions: ReadonlyArray<string>,
  excludes: ReadonlyArray<string> | undefined,
  includes: ReadonlyArray<string>,
  depth?: number,
) {
  const host = createNativeCompilerFileSystem(fileSystem);
  const directories: string[] = [];
  const getEntries = host.getAccessibleEntries;
  host.getAccessibleEntries = path => {
    directories.push(path);
    return getEntries(path);
  };
  using session = new NativeCompilerSession(host);
  const result = session.api.parseJsonConfigFileContent({ compilerOptions: { allowJs: true, resolveJsonModule: true }, include: includes, exclude: excludes }, {
    configDirectory: rootDir,
  });
  const files = result.fileNames.filter(file =>
    extensions.some(extension => file.endsWith(extension)) && (depth == null || file.slice(rootDir.length).split("/").length - 1 <= depth)
  );
  return { files, directories };
}
