import { ts } from "@ts-morph/common";
import { Expression } from "./Expression";

export class UnaryExpression<T extends ts.Expression = ts.Expression> extends Expression<T> {
}
