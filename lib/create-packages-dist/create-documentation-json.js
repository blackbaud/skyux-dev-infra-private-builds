"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDocumentationJson = void 0;
const fs_extra_1 = require("fs-extra");
const glob_1 = require("glob");
const path_1 = require("path");
const typedoc_1 = require("typedoc");
const ts = __importStar(require("typescript"));
const get_publishable_projects_1 = require("../get-publishable-projects");
const normalize_glob_pattern_1 = require("../utils/normalize-glob-pattern");
const package_json_1 = require("../utils/package-json");
const spawn_1 = require("../utils/spawn");
const CWD = process.cwd();
const NODE_MODULES_ALLOW_LIST = ['@skyux', '@angular/cdk'].map((pkg) => regexEscape(pkg));
// This is a fallback version in case CI cannot locate typedoc.
// It should match the version in the package.json and there is a test for that.
const TYPEDOC_VERSION = '0.24.8';
function toFriendlyUrl(value) {
    const friendly = value
        .toLowerCase()
        // Remove special characters.
        .replace(/[_~`@!#$%^&*()[\]{};:'/\\<>,.?=+|"]/g, '')
        // Replace space characters with a dash.
        .replace(/\s/g, '-')
        // Remove any double-dashes.
        .replace(/--/g, '-');
    return friendly;
}
/**
 * Escapes a string value to be used in a `RegExp` constructor.
 * @see https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
 */
function regexEscape(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
/**
 * Returns anchor IDs to be used for same-page linking.
 */
function getAnchorIds(json) {
    const anchorIdMap = {};
    json.children
        ?.filter((child) => {
        if (!(child.kind in typedoc_1.ReflectionKind)) {
            process.stderr.write(`[getAnchorIds] ${child.kind} not found in typedoc ReflectionKind\n`);
            return false;
        }
        const kindString = typedoc_1.ReflectionKind[child.kind].toLocaleUpperCase();
        return kindString && kindString !== 'VARIABLE';
    })
        .forEach((child) => {
        // The replacements here are to maintain backwards compatibility with earlier versions.
        const kindString = toFriendlyUrl(typedoc_1.ReflectionKind[child.kind])
            .replace('typealias', 'type-alias')
            .replace('reference', 'type-alias')
            .replace('enum', 'enumeration');
        const friendlyName = toFriendlyUrl(child.name);
        const anchorId = `${kindString}-${friendlyName}`;
        anchorIdMap[child.name] = anchorId;
    });
    return anchorIdMap;
}
/**
 * @skyux/docs-tools expects to see paths pointing to the old repo structure when doing component demo page lookups.
 * Replace the new path with the old path until we can figure out a better way to handle this.
 */
function fixSourcesPaths(json, projectName, distPackage) {
    const mainProjectRootPath = new RegExp(`^(${distPackage.root}/)?(src/)?lib/`);
    const testingProjectRootPath = new RegExp(`^(${distPackage.root}/)?testing/src/`);
    if (json.children) {
        json.children = json.children.filter((child) => {
            const fileName = child.sources && child.sources[0].fileName;
            const nodeModulesRegExp = new RegExp('node_modules(?!/' + NODE_MODULES_ALLOW_LIST.join('|/') + ')');
            // Only return children that...
            return (
            // ...have a source file,
            fileName &&
                // ...aren't found in node_modules,
                !nodeModulesRegExp.test(fileName));
        });
        for (const child of json.children) {
            if (child.sources) {
                for (const source of child.sources) {
                    if (mainProjectRootPath.test(source.fileName)) {
                        const fixedFileName = source.fileName.replace(mainProjectRootPath, `projects/${projectName}/src/`);
                        source.fileName = fixedFileName;
                    }
                    else if (testingProjectRootPath.test(source.fileName)) {
                        const fixedFileName = source.fileName.replace(testingProjectRootPath, `projects/${projectName}/src/testing/`);
                        source.fileName = fixedFileName;
                    }
                }
            }
            if (child.children) {
                fixSourcesPaths(child, projectName, distPackage);
            }
        }
    }
}
/**
 * Typedoc creates json with modules with type children for each entry point when multiple entry points are given.
 * However, we expect a flat array of types. This function flattens these modules into one array of child types so that they can be parsed together.
 * BEFORE:
 * {
 *   name: 'our_lib'
 *   children: [
 *     {
 *       name: 'src',
 *       kindString: 'Module',
 *       children: [
 *         {
 *           name: 'Type1',
 *           kindString: 'Class',
 *           ...
 *         }
 *       ]
 *     },
 *     {
 *       name: 'testing',
 *       kindString: 'Module',
 *       children: [
 *         {
 *           name: 'TestingType1',
 *           kindString: 'Class',
 *           ...
 *         }
 *       ]
 *     }
 *   ]
 * }
 *
 * AFTER:
 * {
 *   name: 'our_lib'
 *   children: [
 *     {
 *       name: 'Type1',
 *       kindString: 'Class',
 *       ...
 *     },
 *     {
 *       name: 'TestingType1',
 *       kindString: 'Class',
 *       ...
 *     }
 *   ]
 * }
 */
function flattenOutput(json) {
    const flattenedChildren = [];
    if (json.children) {
        for (const child of json.children) {
            if (typedoc_1.ReflectionKind[child.kind].toLocaleUpperCase() === 'MODULE') {
                if (child.children) {
                    flattenedChildren.push(...child.children);
                }
            }
            else {
                flattenedChildren.push(child);
            }
        }
    }
    json.children = flattenedChildren;
}
async function getCodeExamples(projectName, distPackage, packageName) {
    const codeExamples = [];
    const publicApiPathNoExtension = `${distPackage.root}/index`;
    const examples = glob_1.glob.sync(`apps/code-examples/src/app/code-examples/${projectName}/**/*`, {
        nodir: true,
    });
    for (let filePath of examples) {
        filePath = (0, normalize_glob_pattern_1.normalizeGlobPattern)(filePath);
        const rawContents = (await (0, fs_extra_1.readFile)((0, path_1.resolve)(filePath), { encoding: 'utf-8' }))
            .toString()
            .replace(new RegExp(`('|")(${regexEscape(publicApiPathNoExtension)}|${regexEscape(publicApiPathNoExtension.replace(/\/index$/, ''))})('|")`, 'gi'), `'${packageName}'`);
        // Remove the trailing `.template` extension, if it exists.
        const fileName = (0, path_1.basename)(filePath);
        // @skyux/docs-tools expects to see the old repo paths when doing code example lookups.
        // Replace the new path with the old path until we can figure out a better way to handle this.
        const fixedFilePath = filePath.replace(`apps/code-examples/src/app/code-examples/${projectName}/`, `/projects/${projectName}/documentation/code-examples/`);
        codeExamples.push({
            fileName,
            filePath: fixedFilePath,
            rawContents,
        });
    }
    return codeExamples;
}
/**
 * Remaps the component/directive exports that use the lambda 'λ' prefix to the component's class name.
 * @example
 * ```
 * export { SkyAffixDirective as λ1 } from './modules/affix/affix.directive';
 * ```
 */
function remapComponentExports(json) {
    json.children
        ?.filter((child) => {
        return child.name.startsWith('λ');
    })
        .forEach((child) => {
        let originalName = child.name;
        child.children.forEach((x) => {
            if (x.name === 'constructor') {
                // Using 'any' because TypeDoc has invalid typings.
                const signature = x.signatures && x.signatures[0];
                originalName = signature.type.name;
                // Fix the constructor's name.
                signature.name = originalName;
            }
        });
        // Fix the class's name.
        child.name = originalName;
    });
}
async function findDependencies(codeExamples, distPackageJson) {
    const dependencies = {};
    const rootPackageJson = await (0, fs_extra_1.readJson)('package.json');
    const skyuxVersion = rootPackageJson.version;
    const dependenciesFromPackageJson = {
        ...rootPackageJson.dependencies,
        ...rootPackageJson.devDependencies,
    };
    const derivedDependencies = {};
    // Get dependencies within the same monorepo.
    const localPackages = await (0, get_publishable_projects_1.getPublishableProjects)().then((packages) => Object.fromEntries(Object.values(packages).map((pkg) => [pkg.npmName, pkg])));
    const getDependencies = async (packageNames) => {
        for (const packageName of packageNames) {
            if (!derivedDependencies[packageName]) {
                let directDependencies;
                if (packageName === distPackageJson.name) {
                    directDependencies = [
                        ...Object.keys(distPackageJson.peerDependencies || {}),
                        ...Object.keys(distPackageJson.dependencies || {}),
                    ];
                }
                else if (localPackages[packageName]) {
                    const packageJsonPath = (0, path_1.join)(CWD, localPackages[packageName].root, 'package.json');
                    const packageJson = await (0, fs_extra_1.readJson)(packageJsonPath);
                    directDependencies = [
                        ...Object.keys(packageJson.peerDependencies || {}),
                        ...Object.keys(packageJson.dependencies || {}),
                    ];
                }
                else {
                    const packageJsonPath = (0, path_1.join)(CWD, 'node_modules', packageName, 'package.json');
                    const packageJson = (0, fs_extra_1.existsSync)(packageJsonPath)
                        ? await (0, fs_extra_1.readJson)(packageJsonPath)
                        : {};
                    directDependencies = [
                        ...Object.keys(packageJson.peerDependencies || {}),
                        ...Object.keys(packageJson.dependencies || {}),
                    ];
                }
                derivedDependencies[packageName] = [
                    ...directDependencies,
                    ...(await getDependencies(directDependencies)),
                ];
                derivedDependencies[packageName] = [
                    ...new Set(derivedDependencies[packageName]),
                ].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
            }
        }
        return packageNames
            .map((packageName) => derivedDependencies[packageName])
            .flat();
    };
    // Find demo.component.ts files
    const allDemoComponents = codeExamples.filter((codeExample) => codeExample.fileName === 'demo.component.ts');
    for (const demoComponent of allDemoComponents) {
        const demoComponentPath = demoComponent.filePath.replace(/\/demo\.component\.ts$/, '');
        const demoComponentTsFiles = codeExamples.filter((codeExample) => codeExample.filePath.startsWith(demoComponentPath) &&
            codeExample.filePath.endsWith('.ts'));
        let demoComponentImports = [
            ...new Set(demoComponentTsFiles
                .map((demoComponentTsFile) => {
                const sourceCode = ts.createSourceFile(demoComponentTsFile.fileName, demoComponentTsFile.rawContents, ts.ScriptTarget.Latest, true);
                // Find imports in .ts files within the example module
                return sourceCode.statements
                    .filter((statement) => ts.isImportDeclaration(statement))
                    .map((importDeclaration) => {
                    const importDeclarationNode = importDeclaration;
                    const importDeclarationModuleSpecifier = importDeclarationNode.moduleSpecifier.getText();
                    return importDeclarationModuleSpecifier.substring(1, importDeclarationModuleSpecifier.length - 1);
                })
                    .filter((importDeclarationModuleSpecifier) => importDeclarationModuleSpecifier.startsWith('@') ||
                    importDeclarationModuleSpecifier.match(/^[a-z]/))
                    .map((importDeclarationModuleSpecifier) => {
                    // Translate secondary entrypoints into dependencies.
                    if (importDeclarationModuleSpecifier.startsWith('@')) {
                        return importDeclarationModuleSpecifier
                            .split('/')
                            .slice(0, 2)
                            .join('/');
                    }
                    else {
                        return importDeclarationModuleSpecifier.split('/')[0];
                    }
                });
            })
                .flat()),
        ];
        demoComponentImports = [
            ...new Set(demoComponentImports.concat(await getDependencies(demoComponentImports))),
        ].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
        dependencies[demoComponentPath] = {};
        demoComponentImports.forEach((dependency) => {
            // Get the version from the package.json
            const dependencyVersion = dependenciesFromPackageJson[dependency];
            if (localPackages[dependency]) {
                dependencies[demoComponentPath][dependency] = skyuxVersion;
            }
            else if (dependencyVersion) {
                dependencies[demoComponentPath][dependency] = dependencyVersion;
            }
        });
    }
    return dependencies;
}
async function createDocumentationJson(projectName, distPackage) {
    console.log(`Creating documentation.json file for ${projectName}...`);
    const packageJsonPath = (0, path_1.join)(CWD, distPackage.distRoot, 'package.json');
    const packageJson = await (0, fs_extra_1.readJson)(packageJsonPath);
    const packageName = packageJson.name;
    const documentationJsonPath = `${distPackage.distRoot}/documentation.json`;
    const pluginPath = (0, path_1.join)(CWD, 'node_modules/@skyux/dev-infra-private/lib/create-packages-dist/create-documentation-json-decorator-plugin.js');
    await (0, spawn_1.runCommand)('npx', [
        '--yes',
        '--package',
        `typedoc@${TYPEDOC_VERSION}`,
        '--',
        'typedoc',
        `${distPackage.root}/src/index.ts`,
        `${distPackage.root}/testing/src/public-api.ts`,
        ...['--tsconfig', `${distPackage.root}/tsconfig.lib.prod.json`],
        ...['--plugin', pluginPath],
        ...['--json', documentationJsonPath, '--pretty'],
        ...['--emit', 'docs'],
        ...['--logLevel', 'Error'],
        ...[
            '--exclude',
            `"!**/${distPackage.root}/**"`,
            '--exclude',
            '"**/(fixtures|node_modules)/**"',
            '--exclude',
            '"**/*+(.fixture|.spec).ts"',
        ],
        ...['--externalPattern', `"!**/${distPackage.root}/**"`],
        '--excludeExternals',
        '--excludeInternal',
        '--excludePrivate',
        '--excludeProtected',
    ]);
    const typedocOutput = await (0, fs_extra_1.readJson)((0, path_1.resolve)(CWD, documentationJsonPath));
    flattenOutput(typedocOutput);
    remapComponentExports(typedocOutput);
    const anchorIds = getAnchorIds(typedocOutput);
    fixSourcesPaths(typedocOutput, projectName, distPackage);
    const documentationJson = {};
    documentationJson.anchorIds = anchorIds;
    documentationJson.typedoc = typedocOutput;
    documentationJson.codeExamples = await getCodeExamples(projectName, distPackage, packageName);
    documentationJson.codeExampleDependencies = await findDependencies(documentationJson.codeExamples, packageJson);
    await (0, fs_extra_1.writeJson)(documentationJsonPath, documentationJson, { spaces: 2 });
    // Add documentation.json to the package.json exports section.
    if (packageJson.exports) {
        packageJson.exports['./documentation.json'] = {
            default: './documentation.json',
        };
    }
    await (0, package_json_1.writePackageJson)(packageJsonPath, packageJson);
    console.log(` ✔ Done creating documentation.json for ${projectName}.`);
}
exports.createDocumentationJson = createDocumentationJson;
