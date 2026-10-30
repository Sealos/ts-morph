import { ScriptTarget } from "@ts-morph/common";
import { expect } from "chai";
import { Project } from "../Project";

describe("native compiler lifecycle", () => {
  it("closes syntax, semantic, and editor resources idempotently", () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const file = project.createSourceFile("file.ts", "export const value = 1;");
    const type = file.getVariableDeclarationOrThrow("value").getType();
    file.organizeImports(); // starts the project's synchronous language-server bridge
    project.dispose();
    project.dispose();
    expect(() => file.getFullText()).to.throw("disposed");
    expect(() => type.getText()).to.throw("disposed");
    expect(() => project.createSourceFile("next.ts", "")).to.throw("disposed");
  });

  it("rejects stale semantic wrappers and allows fresh queries after edits", () => {
    using project = new Project({ useInMemoryFileSystem: true });
    const file = project.createSourceFile("file.ts", "export function value() { return 1; }");
    const declaration = file.getFunctionOrThrow("value");
    const type = declaration.getType();
    const symbol = declaration.getSymbolOrThrow();
    const signature = declaration.getSignature();
    declaration.setBodyText("return 'new';");
    expect(() => type.getText()).to.throw("stale");
    expect(() => symbol.getName()).to.throw("stale");
    expect(() => signature.getReturnType()).to.throw("stale");
    expect(declaration.getReturnType().getText()).to.equal("string");
    const fresh = declaration.getSymbolOrThrow();
    project.compilerOptions.set({ target: ScriptTarget.ES2022 });
    expect(() => fresh.getName()).to.throw("stale");
    expect(declaration.getSymbolOrThrow().getName()).to.equal("value");
  });

  it("uses custom module aliases for both semantic queries and editor renames", () => {
    const containingFiles = new Set<string>();
    using project = new Project({
      useInMemoryFileSystem: true,
      resolutionHost: () => ({
        resolveModuleNames: (names, containingFile) => {
          containingFiles.add(containingFile);
          return names.map(name => name === "virtual-model" ? { resolvedFileName: "/model.ts", extension: ".ts" } : undefined);
        },
      }),
    });
    const model = project.createSourceFile("/model.ts", "export interface Model { value: number }");
    const main = project.createSourceFile("/main.ts", "import { Model } from \"virtual-model\"; const item: Model = { value: 1 };");
    expect(main.getVariableDeclarationOrThrow("item").getType().getPropertyOrThrow("value").getName()).to.equal("value");
    expect(containingFiles.has("/main.ts")).to.be.true;
    model.getInterfaceOrThrow("Model").rename("RenamedModel");
    expect(main.getFullText()).to.contain("import { RenamedModel } from \"virtual-model\"");
  });

  for (const compilerOptions of [{ noEmit: true }, { noEmitOnError: true }]) {
    it(`honors ${Object.keys(compilerOptions)[0]} in project and per-file emit`, () => {
      using project = new Project({ useInMemoryFileSystem: true, compilerOptions });
      const file = project.createSourceFile("file.ts", "const value: number = 'invalid';");
      const projectOutput = project.emitToMemory();
      expect(projectOutput.getEmitSkipped()).to.be.true;
      expect(projectOutput.getFiles()).to.deep.equal([]);
      const fileOutput = file.getEmitOutput();
      expect(fileOutput.getEmitSkipped()).to.be.true;
      expect(fileOutput.getOutputFiles()).to.deep.equal([]);
    });
  }
});
