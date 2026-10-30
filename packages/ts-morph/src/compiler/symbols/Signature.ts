import { errors, ts } from "@ts-morph/common";
import { ProjectContext } from "../../ProjectContext";
import { JSDocTagInfo, Node } from "../ast";
import { SymbolDisplayPart } from "../tools";
import { Type } from "../types";
import { Symbol } from "./Symbol";

export class Signature {
  readonly #epoch: number;

  /** @internal */
  readonly #context: ProjectContext;
  /** @internal */
  readonly #compilerSignature: ts.Signature;

  /**
   * Initializes a new instance of Signature.
   * @private
   * @param context - Project context.
   * @param signature - Compiler signature.
   */
  constructor(context: ProjectContext, signature: ts.Signature) {
    this.#context = context;
    this.#epoch = context.compilerFactory.documentRegistry.nativeSession.epoch;
    this.#compilerSignature = signature;
  }

  /**
   * Gets the underlying compiler signature.
   */
  get compilerSignature() {
    this.#context.compilerFactory.documentRegistry.nativeSession.assertEpoch(this.#epoch);
    return this.#compilerSignature;
  }

  /**
   * Gets the type parameters.
   */
  getTypeParameters() {
    const typeParameters = this.compilerSignature.getTypeParameters() ?? [];
    return typeParameters.map(t => this.#context.compilerFactory.getTypeParameter(t));
  }

  /**
   * Gets the parameters.
   */
  getParameters(): Symbol[] {
    return this.compilerSignature.getParameters().map(p => this.#context.compilerFactory.getSymbol(p));
  }

  /**
   * Gets the signature return type.
   */
  getReturnType(): Type {
    return this.#context.compilerFactory.getType(this.compilerSignature.getReturnType());
  }

  /**
   * Get the documentation comments.
   */
  getDocumentationComments(): SymbolDisplayPart[] {
    const declaration = this.getDeclaration();
    const symbol = this.#context.typeChecker.compilerObject.getSymbolAtLocation(declaration.compilerNode);
    const docs = symbol?.getDocumentationComment(this.#context.typeChecker.compilerObject)
      ?? (Node.isJSDocable(declaration) ? declaration.getJsDocs().map(doc => doc.getCommentText() ?? "").filter(Boolean).join("\n") : "");
    return docs.length === 0 ? [] : [this.#context.compilerFactory.getSymbolDisplayPart({ text: docs, kind: "text" })];
  }

  /**
   * Gets the JS doc tags.
   */
  getJsDocTags(): JSDocTagInfo[] {
    const declaration = this.getDeclaration();
    const symbol = this.#context.typeChecker.compilerObject.getSymbolAtLocation(declaration.compilerNode);
    const tags = symbol?.getJsDocTags(this.#context.typeChecker.compilerObject)
      ?? (Node.isJSDocable(declaration)
        ? declaration.getJsDocs().flatMap(doc => doc.getTags().map(tag => ({ name: tag.getTagName(), text: tag.getCommentText() })))
        : []);
    return tags.map(t => this.#context.compilerFactory.getJSDocTagInfo(t));
  }

  /**
   * Gets the signature's declaration.
   */
  getDeclaration() {
    const { compilerFactory } = this.#context;
    const compilerSignatureDeclaration = errors.throwIfNullOrUndefined(
      this.compilerSignature.declaration?.resolve(),
      "Native signature declaration could not be resolved.",
    );
    return compilerFactory.getNodeFromCompilerNode(
      compilerSignatureDeclaration as ts.SignatureDeclaration,
      compilerFactory.getSourceFileForNode(compilerSignatureDeclaration),
    );
  }
}
