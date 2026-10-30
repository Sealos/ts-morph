import { ts } from "@ts-morph/common";
import { NamedNode, QuestionDotTokenableNode } from "../base";
import { ExpressionedNode } from "./expressioned";
import { MemberExpression } from "./MemberExpression";

const createBase = <T extends typeof MemberExpression>(ctor: T) => NamedNode(QuestionDotTokenableNode(ExpressionedNode(ctor)));
export const PropertyAccessExpressionBase = createBase(MemberExpression);
export class PropertyAccessExpression<T extends ts.PropertyAccessExpression = ts.PropertyAccessExpression> extends PropertyAccessExpressionBase<T> {
}
