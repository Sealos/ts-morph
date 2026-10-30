import { ts } from "@ts-morph/common";
import { Constructor } from "../../../../types";
import { Node } from "../../common";
import { LeftHandSideExpression } from "../LeftHandSideExpression";
import { BaseExpressionedNode } from "./ExpressionedNode";

export type LeftHandSideExpressionedNodeExtensionType = Node<ts.Node & { expression: ts.Expression }>;

export interface LeftHandSideExpressionedNode extends BaseExpressionedNode<LeftHandSideExpression> {
}

export function LeftHandSideExpressionedNode<T extends Constructor<LeftHandSideExpressionedNodeExtensionType>>(
  Base: T,
): Constructor<LeftHandSideExpressionedNode> & T {
  return BaseExpressionedNode(Base);
}
