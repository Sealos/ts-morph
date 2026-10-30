import { ts } from "@ts-morph/common";
import { UnaryExpression } from "./UnaryExpression";

export class UpdateExpression<T extends ts.Expression = ts.Expression> extends UnaryExpression<T> {
}
