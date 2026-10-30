import { expect } from "chai";
import { RefactorEditInfo } from "../../../../compiler";
import { getInfoFromText } from "../../testHelpers";

describe("RefactorEditInfo", () => {
  it("applies supplied edits across an existing file and a new file", () => {
    const { sourceFile, project } = getInfoFromText("export class A {}", { filePath: "/file.ts" });
    const edits = new RefactorEditInfo(project._context, {
      edits: [
        { fileName: "/file.ts", textChanges: [{ span: { start: 0, length: sourceFile.getFullWidth() }, newText: "export { A } from \"./A\";" }] },
        { fileName: "/A.ts", isNewFile: true, textChanges: [{ span: { start: 0, length: 0 }, newText: "export class A {}" }] },
      ],
    });
    edits.applyChanges();
    expect(sourceFile.getFullText()).to.equal("export { A } from \"./A\";");
    expect(project.getSourceFileOrThrow("A.ts").getFullText()).to.equal("export class A {}");
  });
});
