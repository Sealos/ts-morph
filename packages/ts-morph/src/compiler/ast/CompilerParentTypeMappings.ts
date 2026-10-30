import { SyntaxKind, ts } from "@ts-morph/common";

export interface CompilerParentTypeMappings {
  [SyntaxKind.ComputedPropertyName]: ts.Declaration;
  [SyntaxKind.Decorator]: ts.NamedDeclaration;
  [SyntaxKind.TypeParameter]:
    | (ts.SignatureDeclaration | ts.ClassLikeDeclaration | ts.InterfaceDeclaration | ts.TypeAliasDeclaration | ts.JSDocTemplateTag)
    | ts.InferTypeNode;
  [SyntaxKind.VariableDeclaration]: ts.VariableDeclarationList | ts.CatchClause;
  [SyntaxKind.VariableDeclarationList]: ts.VariableStatement | ts.ForStatement | ts.ForOfStatement | ts.ForInStatement;
  [SyntaxKind.Parameter]: ts.SignatureDeclaration;
  [SyntaxKind.BindingElement]: ts.BindingPattern;
  [SyntaxKind.PropertySignature]: ts.TypeLiteralNode | ts.InterfaceDeclaration;
  [SyntaxKind.PropertyDeclaration]: ts.ClassLikeDeclaration;
  [SyntaxKind.PropertyAssignment]: ts.ObjectLiteralExpression;
  [SyntaxKind.ShorthandPropertyAssignment]: ts.ObjectLiteralExpression;
  [SyntaxKind.SpreadAssignment]: ts.ObjectLiteralExpression;
  [SyntaxKind.ObjectBindingPattern]: ts.VariableDeclaration | ts.ParameterDeclaration | ts.BindingElement;
  [SyntaxKind.ArrayBindingPattern]: ts.VariableDeclaration | ts.ParameterDeclaration | ts.BindingElement;
  [SyntaxKind.MethodSignature]: ts.TypeLiteralNode | ts.InterfaceDeclaration;
  [SyntaxKind.MethodDeclaration]: ts.ClassLikeDeclaration | ts.ObjectLiteralExpression;
  [SyntaxKind.Constructor]: ts.ClassLikeDeclaration;
  [SyntaxKind.SemicolonClassElement]: ts.ClassLikeDeclaration;
  [SyntaxKind.GetAccessor]: ts.ClassLikeDeclaration | ts.ObjectLiteralExpression | ts.TypeLiteralNode | ts.InterfaceDeclaration;
  [SyntaxKind.SetAccessor]: ts.ClassLikeDeclaration | ts.ObjectLiteralExpression | ts.TypeLiteralNode | ts.InterfaceDeclaration;
  [SyntaxKind.IndexSignature]: ts.ObjectTypeDeclaration;
  [SyntaxKind.ClassStaticBlockDeclaration]: ts.ClassDeclaration | ts.ClassExpression;
  [SyntaxKind.TypePredicate]: ts.SignatureDeclaration | ts.JSDocTypeExpression;
  [SyntaxKind.TemplateLiteralTypeSpan]: ts.TemplateLiteralTypeNode;
  [SyntaxKind.TemplateHead]: ts.TemplateExpression | ts.TemplateLiteralTypeNode;
  [SyntaxKind.TemplateMiddle]: ts.TemplateSpan | ts.TemplateLiteralTypeSpan;
  [SyntaxKind.TemplateTail]: ts.TemplateSpan | ts.TemplateLiteralTypeSpan;
  [SyntaxKind.TemplateSpan]: ts.TemplateExpression;
  [SyntaxKind.SpreadElement]: ts.ArrayLiteralExpression | ts.CallExpression | ts.NewExpression;
  [SyntaxKind.JsxAttributes]: ts.JsxOpeningLikeElement;
  [SyntaxKind.JsxOpeningElement]: ts.JsxElement;
  [SyntaxKind.JsxOpeningFragment]: ts.JsxFragment;
  [SyntaxKind.JsxClosingFragment]: ts.JsxFragment;
  [SyntaxKind.JsxAttribute]: ts.JsxAttributes;
  [SyntaxKind.JsxSpreadAttribute]: ts.JsxAttributes;
  [SyntaxKind.JsxClosingElement]: ts.JsxElement;
  [SyntaxKind.JsxExpression]: ts.JsxElement | ts.JsxFragment | ts.JsxAttributeLike;
  [SyntaxKind.JsxText]: ts.JsxElement | ts.JsxFragment;
  [SyntaxKind.CaseBlock]: ts.SwitchStatement;
  [SyntaxKind.CaseClause]: ts.CaseBlock;
  [SyntaxKind.DefaultClause]: ts.CaseBlock;
  [SyntaxKind.CatchClause]: ts.TryStatement;
  [SyntaxKind.HeritageClause]: ts.InterfaceDeclaration | ts.ClassLikeDeclaration;
  [SyntaxKind.EnumMember]: ts.EnumDeclaration;
  [SyntaxKind.ModuleDeclaration]: ts.ModuleBody | ts.SourceFile;
  [SyntaxKind.ModuleBlock]: ts.ModuleDeclaration;
  [SyntaxKind.ImportEqualsDeclaration]: ts.SourceFile | ts.ModuleBlock;
  [SyntaxKind.ExternalModuleReference]: ts.ImportEqualsDeclaration;
  [SyntaxKind.ImportDeclaration]: ts.SourceFile | ts.ModuleBlock;
  [SyntaxKind.ImportClause]: ts.ImportDeclaration | ts.JSDocImportTag;
  [SyntaxKind.ImportAttribute]: ts.ImportAttributes;
  [SyntaxKind.ImportAttributes]: ts.ImportDeclaration | ts.ExportDeclaration;
  [SyntaxKind.NamespaceImport]: ts.ImportClause;
  [SyntaxKind.NamespaceExport]: ts.ExportDeclaration;
  [SyntaxKind.ExportDeclaration]: ts.SourceFile | ts.ModuleBlock;
  [SyntaxKind.NamedImports]: ts.ImportClause;
  [SyntaxKind.NamedExports]: ts.ExportDeclaration;
  [SyntaxKind.ImportSpecifier]: ts.NamedImports;
  [SyntaxKind.ExportSpecifier]: ts.NamedExports;
  [SyntaxKind.ExportAssignment]: ts.SourceFile;
  [SyntaxKind.JSDoc]:
    | ts.AccessorDeclaration
    | ts.ArrowFunction
    | ts.BinaryExpression
    | ts.Block
    | ts.BreakStatement
    | ts.CallSignatureDeclaration
    | ts.CaseClause
    | ts.ClassLikeDeclaration
    | ts.ClassStaticBlockDeclaration
    | ts.ConstructorDeclaration
    | ts.ConstructorTypeNode
    | ts.ConstructSignatureDeclaration
    | ts.ContinueStatement
    | ts.DebuggerStatement
    | ts.DoStatement
    | ts.ElementAccessExpression
    | ts.EmptyStatement
    | ts.EndOfFileToken
    | ts.EnumDeclaration
    | ts.EnumMember
    | ts.ExportAssignment
    | ts.ExportDeclaration
    | ts.ExportSpecifier
    | ts.ExpressionStatement
    | ts.ForInStatement
    | ts.ForOfStatement
    | ts.ForStatement
    | ts.FunctionDeclaration
    | ts.FunctionExpression
    | ts.FunctionTypeNode
    | ts.Identifier
    | ts.IfStatement
    | ts.ImportDeclaration
    | ts.ImportEqualsDeclaration
    | ts.IndexSignatureDeclaration
    | ts.InterfaceDeclaration
    | ts.JSDocFunctionType
    | ts.JSDocSignature
    | ts.LabeledStatement
    | ts.MethodDeclaration
    | ts.MethodSignature
    | ts.ModuleDeclaration
    | ts.NamedTupleMember
    | ts.NamespaceExportDeclaration
    | ts.ObjectLiteralExpression
    | ts.ParameterDeclaration
    | ts.ParenthesizedExpression
    | ts.PropertyAccessExpression
    | ts.PropertyAssignment
    | ts.PropertyDeclaration
    | ts.PropertySignature
    | ts.ReturnStatement
    | ts.SemicolonClassElement
    | ts.ShorthandPropertyAssignment
    | ts.SpreadAssignment
    | ts.SwitchStatement
    | ts.ThrowStatement
    | ts.TryStatement
    | ts.TypeAliasDeclaration
    | ts.TypeParameterDeclaration
    | ts.VariableDeclaration
    | ts.VariableStatement
    | ts.WhileStatement
    | ts.WithStatement;
  [SyntaxKind.JSDocTypedefTag]: ts.JSDoc;
  [SyntaxKind.JSDocCallbackTag]: ts.JSDoc;
  [SyntaxKind.JSDocOverloadTag]: ts.JSDoc;
  [SyntaxKind.JSDocImportTag]: ts.JSDoc;
}
