import { DiagnosticCategory, Memoize, StringUtils, ts } from "@ts-morph/common";
import { ProjectContext } from "../../../ProjectContext";
import { SourceFile } from "../../ast";
import { DiagnosticMessageChain } from "./DiagnosticMessageChain";

/**
 * Diagnostic.
 */
export class Diagnostic<TCompilerObject extends ts.Diagnostic = ts.Diagnostic> {
  /** @internal */
  readonly _context: ProjectContext | undefined;
  /** @internal */
  readonly _compilerObject: TCompilerObject;

  /** @private */
  constructor(context: ProjectContext | undefined, compilerObject: TCompilerObject) {
    this._context = context;
    this._compilerObject = compilerObject;

    // memoize
    this.getSourceFile();
  }

  /**
   * Gets the underlying compiler diagnostic.
   */
  get compilerObject(): TCompilerObject {
    return this._compilerObject;
  }

  /**
   * Gets the source file.
   */
  @Memoize
  getSourceFile(): SourceFile | undefined {
    if (this._context == null)
      return undefined;
    const fileName = this.compilerObject.fileName;
    return fileName == null
      ? undefined
      : this._context.compilerFactory.addOrGetSourceFileFromFilePath(this._context.fileSystemWrapper.getStandardizedAbsolutePath(fileName), {
        markInProject: false,
        scriptKind: undefined,
      });
  }

  /**
   * Gets the message text.
   */
  getMessageText(): string | DiagnosticMessageChain {
    if (this._compilerObject.messageChain == null)
      return this._compilerObject.text;
    const convert = (diagnostic: ts.Diagnostic): ts.DiagnosticMessageChain => ({
      messageText: diagnostic.text,
      category: diagnostic.category,
      code: diagnostic.code,
      next: diagnostic.messageChain?.map(convert),
    });
    return new DiagnosticMessageChain(convert(this._compilerObject));
  }

  /**
   * Gets the line number.
   */
  getLineNumber() {
    const sourceFile = this.getSourceFile();
    const start = this.getStart();
    if (sourceFile == null || start == null)
      return undefined;
    return StringUtils.getLineNumberAtPos(sourceFile.getFullText(), start);
  }

  /**
   * Gets the start.
   */
  getStart() {
    return this.compilerObject.pos < 0 ? undefined : this.compilerObject.pos;
  }

  /**
   * Gets the length.
   */
  getLength() {
    return this.compilerObject.pos < 0 ? undefined : this.compilerObject.end - this.compilerObject.pos;
  }

  /**
   * Gets the diagnostic category.
   */
  getCategory(): DiagnosticCategory {
    return this.compilerObject.category;
  }

  /**
   * Gets the code of the diagnostic.
   */
  getCode() {
    return this.compilerObject.code;
  }

  /**
   * Gets the source.
   */
  getSource() {
    return this.compilerObject.source;
  }
}
