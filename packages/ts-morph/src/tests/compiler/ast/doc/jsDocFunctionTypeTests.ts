import { expect } from "chai";
import { Node } from "../../../../compiler";
import { getInfoFromText } from "../../testHelpers";

describe("legacy JSDocFunctionType", () => {
  it("does not manufacture nodes absent from the native AST", () => {
    const { sourceFile } = getInfoFromText("/** @type {function (): void} */let x;");
    expect(sourceFile.getDescendants().some(Node.isJSDocFunctionType)).to.be.false;
  });
});
