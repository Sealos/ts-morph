import { errors, ts } from "@ts-morph/common";
import { Expression, ExpressionedNode } from "../expression";
import { VariableDeclarationList } from "../variable";
import { IterationStatement } from "./IterationStatement";

export const ForInStatementBase = ExpressionedNode(IterationStatement);
export class ForInStatement extends ForInStatementBase<ts.ForInStatement> {
  /**
   * Gets this for in statement's initializer.
   */
  getInitializer(): VariableDeclarationList | Expression {
    const initializer = this.compilerNode.initializer;
    if (ts.isMissingDeclaration(initializer))
      throw new errors.InvalidOperationError("The for-in statement has no valid initializer.");
    return this._getNodeFromCompilerNode(initializer);
  }
}
