import { errors, SyntaxKind, ts } from "@ts-morph/common";
import { WriterFunction } from "../../../types";
import { EntityName } from "../aliases";
import { KindToNodeMappings } from "../kindToNodeMappings.generated";
import { NodeWithTypeArguments } from "./TypeNode";

export const ExpressionWithTypeArgumentsBase = NodeWithTypeArguments;
export class ExpressionWithTypeArguments extends ExpressionWithTypeArgumentsBase<ts.ExpressionWithTypeArguments | ts.TypeReferenceNode> {
  /** Gets the heritage expression, or native qualified type name. */
  getExpression() {
    const node = this.compilerNode;
    return ts.isTypeReferenceNode(node)
      ? this._getNodeFromCompilerNode(node.typeName)
      : this._getNodeFromCompilerNode(node.expression);
  }

  getExpressionIfKind<TKind extends SyntaxKind>(kind: TKind): KindToNodeMappings[TKind] | undefined {
    return this.getExpression().asKind(kind);
  }

  getExpressionIfKindOrThrow<TKind extends SyntaxKind>(kind: TKind): KindToNodeMappings[TKind] {
    return this.getExpression().asKindOrThrow(kind);
  }

  setExpression(textOrWriterFunction: string | WriterFunction) {
    this.getExpression().replaceWithText(textOrWriterFunction);
    return this;
  }

  /** Gets the type name when the native heritage element is a TypeReference. */
  getTypeName(): EntityName {
    const node = this.compilerNode;
    if (!ts.isTypeReferenceNode(node))
      throw new errors.InvalidOperationError("This heritage element is an expression, not a type reference.");
    return this._getNodeFromCompilerNode(node.typeName);
  }
}
