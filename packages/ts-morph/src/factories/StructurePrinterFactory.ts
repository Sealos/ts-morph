// DO NOT EDIT - Automatically maintained by createStructurePrinterFactory.ts
import { Memoize } from "@ts-morph/common";
import { SupportedFormatCodeSettings } from "../options/index";
import { InitializerExpressionableNodeStructurePrinter } from "../structurePrinters/base/InitializerExpressionableNodeStructurePrinter";
import { ModifierableNodeStructurePrinter } from "../structurePrinters/base/ModifierableNodeStructurePrinter";
import { ReturnTypedNodeStructurePrinter } from "../structurePrinters/base/ReturnTypedNodeStructurePrinter";
import { TypedNodeStructurePrinter } from "../structurePrinters/base/TypedNodeStructurePrinter";
import { ClassDeclarationStructurePrinter } from "../structurePrinters/class/ClassDeclarationStructurePrinter";
import { ClassMemberStructurePrinter } from "../structurePrinters/class/ClassMemberStructurePrinter";
import { ClassStaticBlockDeclarationStructurePrinter } from "../structurePrinters/class/ClassStaticBlockDeclarationStructurePrinter";
import { ConstructorDeclarationStructurePrinter } from "../structurePrinters/class/ConstructorDeclarationStructurePrinter";
import { GetAccessorDeclarationStructurePrinter } from "../structurePrinters/class/GetAccessorDeclarationStructurePrinter";
import { MethodDeclarationStructurePrinter } from "../structurePrinters/class/MethodDeclarationStructurePrinter";
import { PropertyDeclarationStructurePrinter } from "../structurePrinters/class/PropertyDeclarationStructurePrinter";
import { SetAccessorDeclarationStructurePrinter } from "../structurePrinters/class/SetAccessorDeclarationStructurePrinter";
import { DecoratorStructurePrinter } from "../structurePrinters/decorator/DecoratorStructurePrinter";
import { JSDocStructurePrinter } from "../structurePrinters/doc/JSDocStructurePrinter";
import { JSDocTagStructurePrinter } from "../structurePrinters/doc/JSDocTagStructurePrinter";
import { EnumDeclarationStructurePrinter } from "../structurePrinters/enum/EnumDeclarationStructurePrinter";
import { EnumMemberStructurePrinter } from "../structurePrinters/enum/EnumMemberStructurePrinter";
import { ObjectLiteralExpressionPropertyStructurePrinter } from "../structurePrinters/expression/object/ObjectLiteralExpressionPropertyStructurePrinter";
import { PropertyAssignmentStructurePrinter } from "../structurePrinters/expression/object/PropertyAssignmentStructurePrinter";
import { ShorthandPropertyAssignmentStructurePrinter } from "../structurePrinters/expression/object/ShorthandPropertyAssignmentStructurePrinter";
import { SpreadAssignmentStructurePrinter } from "../structurePrinters/expression/object/SpreadAssignmentStructurePrinter";
import { FunctionDeclarationStructurePrinter } from "../structurePrinters/function/FunctionDeclarationStructurePrinter";
import { ParameterDeclarationStructurePrinter } from "../structurePrinters/function/ParameterDeclarationStructurePrinter";
import { CallSignatureDeclarationStructurePrinter } from "../structurePrinters/interface/CallSignatureDeclarationStructurePrinter";
import { ConstructSignatureDeclarationStructurePrinter } from "../structurePrinters/interface/ConstructSignatureDeclarationStructurePrinter";
import { IndexSignatureDeclarationStructurePrinter } from "../structurePrinters/interface/IndexSignatureDeclarationStructurePrinter";
import { InterfaceDeclarationStructurePrinter } from "../structurePrinters/interface/InterfaceDeclarationStructurePrinter";
import { MethodSignatureStructurePrinter } from "../structurePrinters/interface/MethodSignatureStructurePrinter";
import { PropertySignatureStructurePrinter } from "../structurePrinters/interface/PropertySignatureStructurePrinter";
import { TypeElementMemberedNodeStructurePrinter } from "../structurePrinters/interface/TypeElementMemberedNodeStructurePrinter";
import { TypeElementMemberStructurePrinter } from "../structurePrinters/interface/TypeElementMemberStructurePrinter";
import { JsxAttributeDeciderStructurePrinter } from "../structurePrinters/jsx/JsxAttributeDeciderStructurePrinter";
import { JsxAttributeStructurePrinter } from "../structurePrinters/jsx/JsxAttributeStructurePrinter";
import { JsxChildDeciderStructurePrinter } from "../structurePrinters/jsx/JsxChildDeciderStructurePrinter";
import { JsxElementStructurePrinter } from "../structurePrinters/jsx/JsxElementStructurePrinter";
import { JsxNamespacedNameStructurePrinter } from "../structurePrinters/jsx/JsxNamespacedNameStructurePrinter";
import { JsxSelfClosingElementStructurePrinter } from "../structurePrinters/jsx/JsxSelfClosingElementStructurePrinter";
import { JsxSpreadAttributeStructurePrinter } from "../structurePrinters/jsx/JsxSpreadAttributeStructurePrinter";
import { ExportAssignmentStructurePrinter } from "../structurePrinters/module/ExportAssignmentStructurePrinter";
import { ExportDeclarationStructurePrinter } from "../structurePrinters/module/ExportDeclarationStructurePrinter";
import { ImportAttributeStructurePrinter } from "../structurePrinters/module/ImportAttributeStructurePrinter";
import { ImportDeclarationStructurePrinter } from "../structurePrinters/module/ImportDeclarationStructurePrinter";
import { ModuleDeclarationStructurePrinter } from "../structurePrinters/module/ModuleDeclarationStructurePrinter";
import { NamedImportExportSpecifierStructurePrinter } from "../structurePrinters/module/NamedImportExportSpecifierStructurePrinter";
import { SourceFileStructurePrinter } from "../structurePrinters/module/SourceFileStructurePrinter";
import { StatementedNodeStructurePrinter } from "../structurePrinters/statement/StatementedNodeStructurePrinter";
import { StatementStructurePrinter } from "../structurePrinters/statement/StatementStructurePrinter";
import { VariableStatementStructurePrinter } from "../structurePrinters/statement/VariableStatementStructurePrinter";
import { TypeAliasDeclarationStructurePrinter } from "../structurePrinters/types/TypeAliasDeclarationStructurePrinter";
import { TypeParameterDeclarationStructurePrinter } from "../structurePrinters/types/TypeParameterDeclarationStructurePrinter";
import { VariableDeclarationStructurePrinter } from "../structurePrinters/variable/VariableDeclarationStructurePrinter";

/** Cached lazy factory for StructurePrinters. */
export class StructurePrinterFactory {
  constructor(private readonly _getFormatCodeSettings: () => SupportedFormatCodeSettings) {
  }

  getFormatCodeSettings(): SupportedFormatCodeSettings {
    return this._getFormatCodeSettings();
  }

  @Memoize
  forInitializerExpressionableNode(): InitializerExpressionableNodeStructurePrinter {
    return new InitializerExpressionableNodeStructurePrinter();
  }

  @Memoize
  forModifierableNode(): ModifierableNodeStructurePrinter {
    return new ModifierableNodeStructurePrinter();
  }

  @Memoize
  forReturnTypedNode(alwaysWrite?: boolean): ReturnTypedNodeStructurePrinter {
    return new ReturnTypedNodeStructurePrinter(alwaysWrite);
  }

  @Memoize
  forTypedNode(separator: string, alwaysWrite?: boolean): TypedNodeStructurePrinter {
    return new TypedNodeStructurePrinter(separator, alwaysWrite);
  }

  @Memoize
  forGetAccessorDeclaration(options: { isAmbient: boolean }): GetAccessorDeclarationStructurePrinter {
    return new GetAccessorDeclarationStructurePrinter(this, options);
  }

  @Memoize
  forSetAccessorDeclaration(options: { isAmbient: boolean }): SetAccessorDeclarationStructurePrinter {
    return new SetAccessorDeclarationStructurePrinter(this, options);
  }

  @Memoize
  forClassDeclaration(options: { isAmbient: boolean }): ClassDeclarationStructurePrinter {
    return new ClassDeclarationStructurePrinter(this, options);
  }

  @Memoize
  forClassMember(options: { isAmbient: boolean }): ClassMemberStructurePrinter {
    return new ClassMemberStructurePrinter(this, options);
  }

  @Memoize
  forClassStaticBlockDeclaration(): ClassStaticBlockDeclarationStructurePrinter {
    return new ClassStaticBlockDeclarationStructurePrinter(this);
  }

  @Memoize
  forConstructorDeclaration(options: { isAmbient: boolean }): ConstructorDeclarationStructurePrinter {
    return new ConstructorDeclarationStructurePrinter(this, options);
  }

  @Memoize
  forMethodDeclaration(options: { isAmbient: boolean }): MethodDeclarationStructurePrinter {
    return new MethodDeclarationStructurePrinter(this, options);
  }

  @Memoize
  forPropertyDeclaration(): PropertyDeclarationStructurePrinter {
    return new PropertyDeclarationStructurePrinter(this);
  }

  @Memoize
  forDecorator(): DecoratorStructurePrinter {
    return new DecoratorStructurePrinter(this);
  }

  @Memoize
  forJSDoc(): JSDocStructurePrinter {
    return new JSDocStructurePrinter(this);
  }

  @Memoize
  forJSDocTag(options: { printStarsOnNewLine: boolean }): JSDocTagStructurePrinter {
    return new JSDocTagStructurePrinter(this, options);
  }

  @Memoize
  forEnumDeclaration(): EnumDeclarationStructurePrinter {
    return new EnumDeclarationStructurePrinter(this);
  }

  @Memoize
  forEnumMember(): EnumMemberStructurePrinter {
    return new EnumMemberStructurePrinter(this);
  }

  @Memoize
  forObjectLiteralExpressionProperty(): ObjectLiteralExpressionPropertyStructurePrinter {
    return new ObjectLiteralExpressionPropertyStructurePrinter(this);
  }

  @Memoize
  forPropertyAssignment(): PropertyAssignmentStructurePrinter {
    return new PropertyAssignmentStructurePrinter(this);
  }

  @Memoize
  forShorthandPropertyAssignment(): ShorthandPropertyAssignmentStructurePrinter {
    return new ShorthandPropertyAssignmentStructurePrinter(this);
  }

  @Memoize
  forSpreadAssignment(): SpreadAssignmentStructurePrinter {
    return new SpreadAssignmentStructurePrinter(this);
  }

  @Memoize
  forFunctionDeclaration(options: { isAmbient: boolean }): FunctionDeclarationStructurePrinter {
    return new FunctionDeclarationStructurePrinter(this, options);
  }

  @Memoize
  forParameterDeclaration(): ParameterDeclarationStructurePrinter {
    return new ParameterDeclarationStructurePrinter(this);
  }

  @Memoize
  forCallSignatureDeclaration(): CallSignatureDeclarationStructurePrinter {
    return new CallSignatureDeclarationStructurePrinter(this);
  }

  @Memoize
  forConstructSignatureDeclaration(): ConstructSignatureDeclarationStructurePrinter {
    return new ConstructSignatureDeclarationStructurePrinter(this);
  }

  @Memoize
  forIndexSignatureDeclaration(): IndexSignatureDeclarationStructurePrinter {
    return new IndexSignatureDeclarationStructurePrinter(this);
  }

  @Memoize
  forInterfaceDeclaration(): InterfaceDeclarationStructurePrinter {
    return new InterfaceDeclarationStructurePrinter(this);
  }

  @Memoize
  forMethodSignature(): MethodSignatureStructurePrinter {
    return new MethodSignatureStructurePrinter(this);
  }

  @Memoize
  forPropertySignature(): PropertySignatureStructurePrinter {
    return new PropertySignatureStructurePrinter(this);
  }

  @Memoize
  forTypeElementMemberedNode(): TypeElementMemberedNodeStructurePrinter {
    return new TypeElementMemberedNodeStructurePrinter(this);
  }

  @Memoize
  forTypeElementMember(): TypeElementMemberStructurePrinter {
    return new TypeElementMemberStructurePrinter(this);
  }

  @Memoize
  forJsxAttributeDecider(): JsxAttributeDeciderStructurePrinter {
    return new JsxAttributeDeciderStructurePrinter(this);
  }

  @Memoize
  forJsxAttribute(): JsxAttributeStructurePrinter {
    return new JsxAttributeStructurePrinter(this);
  }

  @Memoize
  forJsxChildDecider(): JsxChildDeciderStructurePrinter {
    return new JsxChildDeciderStructurePrinter(this);
  }

  @Memoize
  forJsxElement(): JsxElementStructurePrinter {
    return new JsxElementStructurePrinter(this);
  }

  @Memoize
  forJsxNamespacedName(): JsxNamespacedNameStructurePrinter {
    return new JsxNamespacedNameStructurePrinter(this);
  }

  @Memoize
  forJsxSelfClosingElement(): JsxSelfClosingElementStructurePrinter {
    return new JsxSelfClosingElementStructurePrinter(this);
  }

  @Memoize
  forJsxSpreadAttribute(): JsxSpreadAttributeStructurePrinter {
    return new JsxSpreadAttributeStructurePrinter(this);
  }

  @Memoize
  forExportAssignment(): ExportAssignmentStructurePrinter {
    return new ExportAssignmentStructurePrinter(this);
  }

  @Memoize
  forExportDeclaration(): ExportDeclarationStructurePrinter {
    return new ExportDeclarationStructurePrinter(this);
  }

  @Memoize
  forImportAttribute(): ImportAttributeStructurePrinter {
    return new ImportAttributeStructurePrinter(this);
  }

  @Memoize
  forImportDeclaration(): ImportDeclarationStructurePrinter {
    return new ImportDeclarationStructurePrinter(this);
  }

  @Memoize
  forModuleDeclaration(options: { isAmbient: boolean }): ModuleDeclarationStructurePrinter {
    return new ModuleDeclarationStructurePrinter(this, options);
  }

  @Memoize
  forNamedImportExportSpecifier(): NamedImportExportSpecifierStructurePrinter {
    return new NamedImportExportSpecifierStructurePrinter(this);
  }

  @Memoize
  forSourceFile(options: { isAmbient: boolean }): SourceFileStructurePrinter {
    return new SourceFileStructurePrinter(this, options);
  }

  @Memoize
  forStatementedNode(options: { isAmbient: boolean }): StatementedNodeStructurePrinter {
    return new StatementedNodeStructurePrinter(this, options);
  }

  @Memoize
  forStatement(options: { isAmbient: boolean }): StatementStructurePrinter {
    return new StatementStructurePrinter(this, options);
  }

  @Memoize
  forVariableStatement(): VariableStatementStructurePrinter {
    return new VariableStatementStructurePrinter(this);
  }

  @Memoize
  forTypeAliasDeclaration(): TypeAliasDeclarationStructurePrinter {
    return new TypeAliasDeclarationStructurePrinter(this);
  }

  @Memoize
  forTypeParameterDeclaration(): TypeParameterDeclarationStructurePrinter {
    return new TypeParameterDeclarationStructurePrinter(this);
  }

  @Memoize
  forVariableDeclaration(): VariableDeclarationStructurePrinter {
    return new VariableDeclarationStructurePrinter(this);
  }
}
