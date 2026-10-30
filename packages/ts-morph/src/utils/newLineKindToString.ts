import { errors, NewLineKind } from "@ts-morph/common";

export function newLineKindToString(kind: NewLineKind) {
  switch (kind) {
    case NewLineKind.CRLF:
      return "\r\n";
    case NewLineKind.LF:
      return "\n";
    default:
      throw new errors.NotImplementedError(`Not implemented newline kind: ${kind}`);
  }
}
