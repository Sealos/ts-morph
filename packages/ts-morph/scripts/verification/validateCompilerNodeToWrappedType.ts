/**
 * Code Verification - Validate CompilerNodeToWrappedType
 * ------------------------------------------------------
 * This code verification validates that the CompilerNodeToWrappedType
 * type alias properly converts the passed in compiler node type to a
 * wrapped node type.
 * ------------------------------------------------------
 */
import { tsMorph } from "../deps.ts";
import { TsMorphInspector } from "../inspectors/mod.ts";
import { Problem } from "./Problem.ts";

export function validateCompilerNodeToWrappedType(inspector: TsMorphInspector, addProblem: (problem: Problem) => void) {
  const wrappedNodes = inspector.getWrappedNodes();
  const sourceFile = inspector.getProject().getSourceFileOrThrow("CompilerNodeToWrappedType.ts");
  const initialText = sourceFile.getFullText();

  try {
    const structures: tsMorph.TypeAliasDeclarationStructure[] = [];
    for (let i = 0; i < wrappedNodes.length; i++) {
      const wrapper = wrappedNodes[i];
      const nodes = wrapper.getAssociatedTsNodes();
      if (nodes.length === 0)
        continue;

      structures.push({
        kind: tsMorph.StructureKind.TypeAlias,
        name: `${wrapper.getName()}_test`,
        type: `CompilerNodeToWrappedType<compiler.${wrapper.getNameForType()}["compilerNode"]>`,
      });
    }

    const addedNodes = sourceFile.addTypeAliases(structures);
    const diagnostics = sourceFile.getPreEmitDiagnostics();

    if (diagnostics.length > 0) {
      console.log(inspector.getProject().formatDiagnosticsWithColorAndContext(diagnostics));
      throw new Error("Stopping -- Compile errors in validation.");
    }

    for (const addedNode of addedNodes) {
      const typeText = addedNode.getType().getText(addedNode).replace(/\<.*\>$/, "");
      const name = addedNode.getName().replace("_test", "");
      const absentNativeKinds = new Set([
        "CommaListExpression",
        "JSDocAuthorTag",
        "JSDocClassTag",
        "JSDocEnumTag",
        "JSDocFunctionType",
        "JSDocMemberName",
        "JSDocNamepathType",
        "JSDocUnknownType",
      ]);
      const abstractExpressions = new Set(["LeftHandSideExpression", "MemberExpression", "PrimaryExpression", "UnaryExpression", "UpdateExpression"]);
      // Native abstract expression types do not carry the legacy compiler brands.
      // Heritage elements share TypeReference with ordinary type references.
      const nodeText = absentNativeKinds.has(name)
        ? "never"
        : abstractExpressions.has(name)
        ? "compiler.Expression"
        : name === "TypeReferenceNode" || name === "ExpressionWithTypeArguments"
        ? "compiler.ExpressionWithTypeArguments | compiler.TypeReferenceNode"
        : "compiler." + name;
      if (typeText.split(" | ").sort().join(" | ") !== nodeText.split(" | ").sort().join(" | ")) {
        addProblem({
          filePath: sourceFile.getFilePath(),
          lineNumber: sourceFile.getTypeAliasOrThrow("CompilerNodeToWrappedType").getStartLineNumber(),
          message: `Could not get wrapped type from node "${nodeText.replace("compiler.", "")}". Got "${typeText}".`,
        });
      }
    }
  } finally {
    sourceFile.replaceWithText(initialText);
  }
}
