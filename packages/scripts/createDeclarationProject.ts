import { tsMorph } from "./deps.ts";
import { printDiagnostics } from "./utils/mod.ts";
const { IndentationText, NewLineKind, Project } = tsMorph;

export interface CreateDeclarationProjectOptions {
  tsConfigFilePath: string;
}

export function createDeclarationProject(opts: CreateDeclarationProjectOptions) {
  using project = new Project({
    tsConfigFilePath: opts.tsConfigFilePath,
    manipulationSettings: {
      indentationText: IndentationText.TwoSpaces,
      newLineKind: NewLineKind.LineFeed,
    },
    compilerOptions: {
      declaration: true,
    },
  });

  const emitResult = project.emitToMemory({ emitOnlyDtsFiles: true });

  if (emitResult.getDiagnostics().length > 0) {
    printDiagnostics(emitResult.getDiagnostics());
    throw new Error("Declaration generation failed.");
  }

  const declarationProject = new Project({
    tsConfigFilePath: opts.tsConfigFilePath,
    manipulationSettings: {
      indentationText: IndentationText.TwoSpaces,
      newLineKind: NewLineKind.LineFeed,
    },
    skipAddingFilesFromTsConfig: true,
  });

  for (const file of emitResult.getFiles())
    declarationProject.createSourceFile(file.filePath, file.text, { overwrite: true });

  const declDiagnostics = declarationProject.getPreEmitDiagnostics();
  if (declDiagnostics.length > 0) {
    console.log(declarationProject.formatDiagnosticsWithColorAndContext(declDiagnostics));
    declarationProject.dispose();
    throw new Error("Generated declarations contain compiler errors.");
  }

  return declarationProject;
}
