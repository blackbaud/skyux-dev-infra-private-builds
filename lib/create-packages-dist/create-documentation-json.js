"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDocumentationJson = void 0;
const fs_extra_1 = require("fs-extra");
const glob_1 = require("glob");
const path_1 = require("path");
const package_json_1 = require("../utils/package-json");
const spawn_1 = require("../utils/spawn");
const CWD = process.cwd();
const NODE_MODULES_ALLOW_LIST = ['@skyux', '@angular/cdk'].map((pkg) => regexEscape(pkg));
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
        const kindString = child.kindString?.toLocaleUpperCase();
        return kindString && kindString !== 'VARIABLE';
    })
        .forEach((child) => {
        const kindString = toFriendlyUrl(child.kindString);
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
            if (child.kindString?.toLocaleUpperCase() === 'MODULE') {
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
    for (const filePath of examples) {
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
async function createDocumentationJson(projectName, distPackage) {
    console.log(`Creating documentation.json file for ${projectName}...`);
    const packageJsonPath = (0, path_1.join)(CWD, distPackage.distRoot, 'package.json');
    const packageJson = await (0, fs_extra_1.readJson)(packageJsonPath);
    const packageName = packageJson.name;
    const documentationJsonPath = `${distPackage.distRoot}/documentation.json`;
    await (0, spawn_1.runCommand)('./node_modules/.bin/typedoc', [
        `${distPackage.root}/src/index.ts`,
        `${distPackage.root}/testing/src/public-api.ts`,
        ...['--tsconfig', `${distPackage.root}/tsconfig.lib.prod.json`],
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
