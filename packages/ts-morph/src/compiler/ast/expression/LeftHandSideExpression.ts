import { ts } from "@ts-morph/common";
import { UpdateExpression } from "./UpdateExpression";

export class LeftHandSideExpression<T extends ts.Expression = ts.Expression> extends UpdateExpression<T> {
}
