import { errors, ScriptTarget, SyntaxKind, ts } from "@ts-morph/common";
import { expect } from "chai";
import { createCompilerSourceFile } from "../../../../../scripts/nativeTestHelpers";
import { SourceFile } from "../../../compiler";
import { Project } from "../../../Project";
import { createWrappedNode } from "../../../utils/compiler/createWrappedNode";

describe("createWrappedNode", () => {
  it("wraps native nodes whose parents are always available", () => {
    const sourceFile = createCompilerSourceFile("file.ts", "class MyClass {}", ScriptTarget.ES2016, false);
    const child = sourceFile.statements[0];
    expect(child.parent).to.equal(sourceFile);
    expect(createWrappedNode(child).getText()).to.equal("class MyClass {}");
  });

  it("should get a wrapped node", () => {
    const compilerSourceFile = createCompilerSourceFile("file.ts", "class MyClass {}", ScriptTarget.ES2016, true);
    const child = compilerSourceFile.getChildren()[0];
    const node = createWrappedNode(child);
    const sourceFile = node.getSourceFile();

    expect(node.getKind()).to.equal(SyntaxKind.SyntaxList);
    expect(sourceFile.getClasses().length).to.equal(1);
  });

  it("should get a wrapped node when also providing the source file", () => {
    const compilerSourceFile = createCompilerSourceFile("file.ts", "class MyClass {}", ScriptTarget.ES2016, true);
    const child = compilerSourceFile.getChildren()[0];
    const node = createWrappedNode(child, { sourceFile: compilerSourceFile });
    const sourceFile = node.getSourceFile();

    // testing for something arbitrary
    expect(sourceFile.getClasses().length).to.equal(1);
  });

  it("should be able to provide compiler options", () => {
    const compilerSourceFile = createCompilerSourceFile("file.ts", "class MyClass {}", ScriptTarget.ES2016, true);
    const child = compilerSourceFile.getChildren()[0];
    const compilerOptions = { target: ScriptTarget.ES2016 };
    const node = createWrappedNode(child, { compilerOptions });

    expect(node._context.compilerOptions.get()).to.deep.equal(compilerOptions);
  });

  it("should be able to provide a type checker", () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile("test.ts", "let s = '';");
    const typeChecker = project.getTypeChecker();
    const wrappedSourceFile = createWrappedNode(sourceFile.compilerNode, { typeChecker: typeChecker.compilerObject }) as SourceFile;

    expect(wrappedSourceFile.getVariableDeclarationOrThrow("s").getType().getText()).to.equal("string");
  });

  it("should throw when getting the type and no type checker was provided", () => {
    const compilerSourceFile = createCompilerSourceFile("file.ts", "let s = '';", ScriptTarget.ES2016, true);
    const wrappedSourceFile = createWrappedNode(compilerSourceFile) as SourceFile;
    const expectedMessage = "A type checker is required for this operation. This might occur when manipulating or "
      + "getting type information from a node that was not added to a Project object and created via createWrappedNode. "
      + "Please submit a bug report if you don't believe a type checker should be required for this operation.";

    expect(() => wrappedSourceFile.getVariableDeclarationOrThrow("s").getType()).to.throw(errors.InvalidOperationError, expectedMessage);
  });
});
