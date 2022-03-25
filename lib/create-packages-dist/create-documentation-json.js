"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDocumentationJson = void 0;
const fs_extra_1 = require("fs-extra");
const glob_1 = require("glob");
const path_1 = require("path");
const spawn_1 = require("../utils/spawn");
const CWD = process.cwd();
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
    const projectRootPath = new RegExp(`^(${distPackage.root}/src/)?lib/`);
    if (json.children) {
        // Some types (read: List Builder) extend third-party types found in `node_modules`.
        // We should remove them because TypeDoc pulls in all of the third-party's properties into our documentation.
        json.children = json.children.filter((child) => {
            const fileName = child.sources && child.sources[0].fileName;
            // Only return children that...
            return (
            // ...have a source file,
            fileName &&
                // ...aren't found in node_modules,
                !/node_modules/.test(fileName) &&
                // ...and, are only found in this project.
                projectRootPath.test(fileName));
        });
        for (const child of json.children) {
            if (child.sources) {
                for (const source of child.sources) {
                    const fixedFileName = source.fileName.replace(projectRootPath, `projects/${projectName}/src/`);
                    source.fileName = fixedFileName;
                }
            }
            if (child.children) {
                fixSourcesPaths(child, projectName, distPackage);
            }
        }
    }
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
    const packageName = (await (0, fs_extra_1.readJson)((0, path_1.join)(CWD, distPackage.distRoot, 'package.json'))).name;
    const documentationJsonPath = `${distPackage.distRoot}/documentation.json`;
    await (0, spawn_1.runCommand)('./node_modules/.bin/typedoc', [
        `${distPackage.root}/src/index.ts`,
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
    remapComponentExports(typedocOutput);
    fixSourcesPaths(typedocOutput, projectName, distPackage);
    const anchorIds = getAnchorIds(typedocOutput);
    const documentationJson = {};
    documentationJson.anchorIds = anchorIds;
    documentationJson.typedoc = typedocOutput;
    documentationJson.codeExamples = await getCodeExamples(projectName, distPackage, packageName);
    await (0, fs_extra_1.writeJson)(documentationJsonPath, documentationJson, { spaces: 2 });
    console.log(` ✔ Done creating documentation.json for ${projectName}.`);
}
exports.createDocumentationJson = createDocumentationJson;
