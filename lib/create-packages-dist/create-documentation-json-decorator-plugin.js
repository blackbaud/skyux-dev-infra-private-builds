"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.load = exports.DeclarationReflectionWithDecorators = void 0;
const typedoc_1 = require("typedoc");
class DeclarationReflectionWithDecorators extends typedoc_1.DeclarationReflection {
}
exports.DeclarationReflectionWithDecorators = DeclarationReflectionWithDecorators;
/**
 * This plugin is based on a suggestion from a Typedoc maintainer at https://github.com/TypeStrong/typedoc/issues/2346#issuecomment-1656806051.
 * Modifications were made to support accessors and to fix issues that were present in his suggestion (which he admitted hadn't been tested).
 */
function load(app) {
    // Add decorator info to reflections
    app.converter.on(typedoc_1.Converter.EVENT_CREATE_DECLARATION, addDecoratorInfo);
    // Add decorator info to serialized json
    app.serializer.addSerializer({
        priority: 0,
        supports() {
            return true;
        },
        toObject(item, obj, _ser) {
            if (item.decorators) {
                obj.decorators = item.decorators;
            }
            return obj;
        },
    });
    function addDecoratorInfo(context, decl) {
        const symbol = context.project.getSymbolFromReflection(decl);
        if (!symbol)
            return;
        const declaration = symbol.valueDeclaration;
        if (!declaration)
            return;
        if (!typedoc_1.TypeScript.isPropertyDeclaration(declaration) &&
            !typedoc_1.TypeScript.isMethodDeclaration(declaration) &&
            !typedoc_1.TypeScript.isClassDeclaration(declaration) &&
            !typedoc_1.TypeScript.isAccessor(declaration)) {
            return;
        }
        const modifiers = declaration.modifiers;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let decorators;
        if (typedoc_1.TypeScript.isClassDeclaration(declaration)) {
            decorators = modifiers
                ?.filter((m) => m.getText().match(/@Component|@Directive|@Injectable|@Pipe|@NgModule/))
                .map((m) => ({
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                name: m
                    .getText()
                    .match(/(?<=@)Component|Directive|Injectable|Pipe|NgModule/)[0],
                arguments: {
                    obj: m.getText(),
                },
            }));
        }
        else {
            decorators = modifiers
                ?.filter((m) => m.getText().match(/(?<=@)Input|Output(?=\(\))/))
                .map((m) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const argumentName = m.expression?.arguments[0]?.getText();
                const decoratorObject = {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    name: m.getText().match(/(?<=@)Input|Output(?=\(\))/)[0],
                };
                if (argumentName) {
                    decoratorObject.arguments = {
                        bindingPropertyName: argumentName,
                    };
                }
                return decoratorObject;
            });
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        decl.decorators = decorators;
    }
}
exports.load = load;
