import { ts } from "@ts-morph/common";
import { LeftHandSideExpression } from "./LeftHandSideExpression";

export class MemberExpression<T extends ts.Expression = ts.Expression> extends LeftHandSideExpression<T> {
}
