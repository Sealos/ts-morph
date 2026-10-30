import { errors, ts } from "@ts-morph/common";
import { BooleanLiteral } from "../aliases";
import { Node } from "../common";
import { LiteralExpression, PrefixUnaryExpression } from "../expression";
import { NullLiteral } from "../literal";
import { TypeNode } from "./TypeNode";

export class LiteralTypeNode extends TypeNode<ts.LiteralTypeNode> {
  /**
   * Gets the literal type node's literal.
   */
  getLiteral(): NullLiteral | BooleanLiteral | LiteralExpression | PrefixUnaryExpression {
    const literal = this._getNodeFromCompilerNode(this.compilerNode.literal);
    if (
      Node.isNullLiteral(literal) || Node.isTrueLiteral(literal) || Node.isFalseLiteral(literal) || Node.isLiteralExpression(literal)
      || Node.isPrefixUnaryExpression(literal)
    ) {
      return literal;
    }
    throw new errors.InvalidOperationError("Unexpected literal type node.");
  }
}
