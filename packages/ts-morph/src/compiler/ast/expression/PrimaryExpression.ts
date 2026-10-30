import { ts } from "@ts-morph/common";
import { MemberExpression } from "./MemberExpression";

export class PrimaryExpression<T extends ts.Expression = ts.Expression> extends MemberExpression<T> {
}
