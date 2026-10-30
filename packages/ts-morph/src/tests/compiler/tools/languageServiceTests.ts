import { errors, nameof, ScriptTarget, ts } from "@ts-morph/common";
import { expect } from "chai";
import { EmitOutput, FileTextChanges, LanguageService, SourceFile, TextChange, TextSpan } from "../../../compiler";
import { getInfoFromText } from "../testHelpers";

describe("LanguageService", () => {
  describe(nameof<LanguageService>("getEmitOutput"), () => {
    it("should get the emit output", () => {
      function doTest(sourceFileOrFilePath: string | SourceFile) {
        const output = sourceFile._context.languageService.getEmitOutput(sourceFileOrFilePath);
        checkOutput(output, {
          emitSkipped: false,
          outputFiles: [{
            fileName: "/" + sourceFile.getBaseName().replace(".ts", ".js"),
            text: "\"use strict\";\nconst t = 5;\n",
            writeByteOrderMark: false,
          }],
        });
      }

      const { sourceFile } = getInfoFromText("const t = 5;", { compilerOptions: { target: ScriptTarget.ES2015 } });

      doTest(sourceFile);
      doTest(sourceFile.getFilePath());
    });

    it("should get the emit output when specifying a source file", () => {
      const { sourceFile, project } = getInfoFromText("const t = 5;", { compilerOptions: { target: ScriptTarget.ES2015 } });
      const output = sourceFile._context.languageService.getEmitOutput(sourceFile);
      checkOutput(output, {
        emitSkipped: false,
        outputFiles: [{
          fileName: "/" + sourceFile.getBaseName().replace(".ts", ".js"),
          text: "\"use strict\";\nconst t = 5;\n",
          writeByteOrderMark: false,
        }],
      });
    });

    it("should only emit the declaration file when specified", () => {
      const { sourceFile, project } = getInfoFromText("const t = 5;", { compilerOptions: { declaration: true } });
      const output = sourceFile._context.languageService.getEmitOutput(sourceFile.getFilePath(), true);
      checkOutput(output, {
        emitSkipped: false,
        outputFiles: [{
          fileName: "/" + sourceFile.getBaseName().replace(".ts", ".d.ts"),
          text: "declare const t = 5;\n",
          writeByteOrderMark: false,
        }],
      });
    });

    it("should throw when the specified file does not exist", () => {
      const { project } = getInfoFromText("");
      expect(() => project.getLanguageService().getEmitOutput("nonExistentFile.ts")).to.throw(errors.FileNotFoundError);
    });
  });

  describe(nameof<LanguageService>("organizeImports"), () => {
    it("should remove imports that don't exist", () => {
      const { sourceFile, project } = getInfoFromText("import * as bravo from 'bravo';\nimport * as alpha from 'alpha';", { filePath: "/file.ts" });
      const results = project.getLanguageService().organizeImports(sourceFile);
      expect(results.length).to.equal(1);
      results[0].applyChanges();
      expect(sourceFile.getFullText()).to.equal("");
    });

    it("should organize imports when they're used", () => {
      const { project } = getInfoFromText("export default class MyClass {}", { filePath: "/MyClass.ts" });
      project.createSourceFile("/MyInterface.ts", "export default interface MyInterface {}");
      project.createSourceFile("/UnusedInterface.ts", "export default interface Identifier {}");
      const sourceFile = project.createSourceFile(
        "/main.ts",
        "import MyInterface from './MyInterface';\nimport MyClass from './MyClass';\n"
          + "import UnusedInterface from './UnusedInterface';\n"
          + "const myVar: MyInterface = new MyClass();",
      );
      const results = project.getLanguageService().organizeImports(sourceFile.getFilePath());
      expect(results.length).to.equal(1);
      checkFileTextChanges(results[0], {
        fileName: "/main.ts",
        textChanges: [{
          newText: "import MyClass from './MyClass';\nimport MyInterface from './MyInterface';\n",
          span: { start: 0, length: 41 },
        }, {
          newText: "",
          span: { start: 41, length: 33 },
        }, {
          newText: "",
          span: { start: 74, length: 49 },
        }],
      });
    });
  });

  describe(nameof<LanguageService>("getEditsForRefactor"), () => {
    it("rejects refactoring actions unavailable in the native beta", () => {
      const { project, sourceFile } = getInfoFromText("export class A {}", { filePath: "/file.ts" });
      expect(() => project.getLanguageService().getEditsForRefactor(sourceFile, {}, 0, "Move to a new file", "Move to a new file", {}))
        .to.throw("does not yet expose refactoring actions");
    });

    it("should throw for a file that doesn't exist", () => {
      const { project } = getInfoFromText("const moment = require('moment'); moment(); ");
      expect(() => project.getLanguageService().getEditsForRefactor("nonExistent.ts", {}, 1, "Move to a new file", "Move to a new file", {}))
        .to.throw(errors.FileNotFoundError);
    });
  });

  describe(nameof<LanguageService>("getCombinedCodeFix"), () => {
    it("should get the combined code fixes", () => {
      const { sourceFile, project } = getInfoFromText("export class T extends Node {}", { filePath: "/file.ts" });
      const languageService = project.getLanguageService();
      project.createSourceFile("/Node.ts", "export class Node { prop: string; }");
      const result = languageService.getCombinedCodeFix(sourceFile, "fixMissingImport");

      expect(result.getChanges().map(c => ({ filePath: c.getFilePath(), changes: c.getTextChanges().map(t => t.compilerObject) }))).to.deep.equal([{
        filePath: "/file.ts",
        changes: [{
          newText: `import { Node } from "./Node";\n\n`,
          span: {
            length: 0,
            start: 0,
          },
        }],
      }]);
    });
  });

  describe(nameof<LanguageService>("getCodeFixesAtPosition"), () => {
    it("gets and applies a native import code fix", () => {
      const { project, sourceFile } = getInfoFromText("const value = new Missing();", { filePath: "/file.ts" });
      project.createSourceFile("/Missing.ts", "export class Missing {}");
      const position = sourceFile.getFullText().indexOf("Missing");
      const fixes = project.getLanguageService().getCodeFixesAtPosition(sourceFile, position, position + 7, [2304], {}, {});
      const fix = fixes.find(fix => fix.getDescription().startsWith("Add import from"));
      expect(fix).not.to.be.undefined;
      fix!.getChanges().forEach(change => change.applyChanges());
      expect(sourceFile.getFullText()).to.contain("import { Missing } from \"./Missing\";");
    });

    it("should throw for a file that doesn't exist", () => {
      const { project } = getInfoFromText("const moment = require('moment'); moment(); ");
      expect(() => project.getLanguageService().getCodeFixesAtPosition("nonExistent.ts", 0, 1, [80001], {}, {})).to.throw(errors.FileNotFoundError);
    });
  });

  describe(nameof<LanguageService>("getSuggestionDiagnostics"), () => {
    it("should return default suggestion diagnostics for file", () => {
      const { sourceFile, project } = getInfoFromText("const moment = require('moment'); moment(); ");
      const diagnostics = project.getLanguageService().getSuggestionDiagnostics(sourceFile);
      // The beta does not implement the legacy require-to-import suggestion.
      expect(diagnostics).to.deep.equal([]);
    });

    it("should throw for a file that doesn't exist", () => {
      const { project } = getInfoFromText("const moment = require('moment'); moment(); ");
      expect(() => project.getLanguageService().getSuggestionDiagnostics("someFile.ts")).to.throw(errors.FileNotFoundError);
    });
  });
});

function checkOutput(
  output: EmitOutput,
  expected: { emitSkipped: boolean; outputFiles: { fileName: string; text: string; writeByteOrderMark: boolean }[] },
) {
  expect(output.getEmitSkipped()).to.equal(expected.emitSkipped, "emit skipped");
  expect(output.getOutputFiles().length).to.equal(expected.outputFiles.length, "output files length");
  for (let i = 0; i < expected.outputFiles.length; i++) {
    const actualFile = output.getOutputFiles()[i];
    const expectedFile = expected.outputFiles[i];
    expect(actualFile.getFilePath()).to.equal(expectedFile.fileName, "fileName");
    expect(actualFile.getText()).to.equal(expectedFile.text, "text");
    expect(actualFile.getWriteByteOrderMark()).to.equal(expectedFile.writeByteOrderMark, "writeByteOrderMark");
  }
}

function checkFileTextChanges(actual: FileTextChanges, expected: ts.FileTextChanges) {
  expect(actual.getFilePath()).to.equal(expected.fileName, "fileName");
  expect(actual.getTextChanges().length).to.equal(expected.textChanges.length, "textChangesLength");
  for (let i = 0; i < expected.textChanges.length; i++)
    checkTextChange(actual.getTextChanges()[i], expected.textChanges[i]);
}

function checkTextChange(actual: TextChange, expected: ts.TextChange) {
  expect(actual.getNewText()).to.equal(expected.newText, "newText");
  checkTextSpan(actual.getSpan(), expected.span);
}

function checkTextSpan(actual: TextSpan, expected: ts.TextSpan) {
  expect(actual.getStart()).to.equal(expected.start, "start");
  expect(actual.getLength()).to.equal(expected.length, "length");
  expect(actual.getEnd()).to.equal(expected.start + expected.length, "end");
}
