"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkLibraryMissingPeers = exports.findImportedPackages = void 0;
const fs_extra_1 = require("fs-extra");
const glob_1 = require("glob");
const path_1 = require("path");
const typescript_1 = __importDefault(require("typescript"));
const get_publishable_projects_1 = require("../get-publishable-projects");
const read_skyuxdev_config_1 = require("../read-skyuxdev-config");
const package_json_1 = require("../utils/package-json");
const CWD = process.cwd();
function findImportedPackages(contents) {
    const sourceFile = typescript_1.default.createSourceFile(`file.ts`, contents, typescript_1.default.ScriptTarget.Latest, true);
    const importedModules = sourceFile.statements
        .filter((statement) => typescript_1.default.isImportDeclaration(statement) &&
        typescript_1.default.isStringLiteral(statement.moduleSpecifier))
        .filter((statement) => {
        // Skip entirely type-only imports like: import type { Foo } from "foo"
        if (statement.importClause?.isTypeOnly) {
            return false;
        }
        // For mixed imports, check if there are any non-type imports
        // like: import { type Foo, Bar } from "foo" (Bar is non-type)
        if (statement.importClause?.namedBindings &&
            typescript_1.default.isNamedImports(statement.importClause.namedBindings)) {
            const namedImports = statement.importClause.namedBindings.elements;
            return namedImports.some((specifier) => !specifier.isTypeOnly);
        }
        // Default imports and namespace imports are not type-only
        return true;
    })
        .map((statement) => statement.moduleSpecifier.text)
        .filter((statement) => !statement.startsWith('.'));
    const dynamicImports = [];
    /**
     * Whether the import's module identifier is a valid package name.
     */
    function isPackageName(moduleName) {
        // Filter out relative paths
        if (moduleName.startsWith('.') || moduleName.startsWith('/')) {
            return false;
        }
        // Handle node: protocol imports
        if (moduleName.startsWith('node:')) {
            return true;
        }
        // Must be a valid package name format
        // Matches both scoped packages (@scope/package) and regular packages (package)
        const packageNameRegex = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
        return packageNameRegex.test(moduleName);
    }
    const importVisitor = (node) => {
        if (typescript_1.default.isCallExpression(node)) {
            const expression = node.expression;
            // Handle dynamic import() calls
            if (expression.kind === typescript_1.default.SyntaxKind.ImportKeyword) {
                const argument = node.arguments[0];
                if (argument && typescript_1.default.isStringLiteral(argument)) {
                    const moduleName = argument.text;
                    // Don't filter here, just collect all non-relative imports
                    if (!moduleName.startsWith('.') && !moduleName.startsWith('/')) {
                        dynamicImports.push(moduleName);
                    }
                }
            }
            // Handle require() calls
            if (typescript_1.default.isIdentifier(expression) && expression.text === 'require') {
                const argument = node.arguments[0];
                if (argument && typescript_1.default.isStringLiteral(argument)) {
                    const moduleName = argument.text;
                    // Don't filter here, just collect all non-relative imports
                    if (!moduleName.startsWith('.') && !moduleName.startsWith('/')) {
                        dynamicImports.push(moduleName);
                    }
                }
            }
        }
        node.forEachChild(importVisitor);
    };
    importVisitor(sourceFile);
    // Extract proper package names from all found modules
    const allModules = [...importedModules, ...dynamicImports];
    const packageNames = allModules
        .map(extractPackageName)
        .filter((name) => name && isPackageName(name)); // Filter out empty strings and invalid package names
    return Array.from(new Set(packageNames));
}
exports.findImportedPackages = findImportedPackages;
function extractPackageName(importPath) {
    // Handle scoped packages like @angular/core/testing -> @angular/core
    if (importPath.startsWith('@')) {
        const parts = importPath.split('/');
        return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : importPath;
    }
    // Handle regular packages like lodash/get -> lodash
    return importPath.split('/')[0];
}
async function getIgnorePatterns(projectRoot) {
    const ignore = [
        '**/fixtures/**',
        '**/*.fixture.ts',
        '**/*.spec.ts',
        '**/*.stories.ts',
        '**/*.test.ts',
        '**/test.ts',
        '**/vite.config.ts',
    ];
    const tsConfigPath = (0, path_1.join)(CWD, projectRoot, 'tsconfig.lib.json');
    if ((0, fs_extra_1.existsSync)(tsConfigPath)) {
        const tsConfig = await (0, fs_extra_1.readJson)(tsConfigPath);
        ignore.push(...(tsConfig.exclude ?? []));
    }
    return Array.from(new Set(ignore));
}
async function findUnlistedPeers(projectName, packageConfig, monorepoPackageNames, packageJson, fix = false, implicitPeers) {
    const errors = [];
    const packageLockJson = await (0, fs_extra_1.readJson)((0, path_1.join)(CWD, 'package-lock.json'));
    const dependencies = Object.keys({
        ...(packageJson.dependencies ?? {}),
        ...(packageJson.optionalDependencies ?? {}),
        ...(packageJson.peerDependencies ?? {}),
    });
    const ignore = await getIgnorePatterns(packageConfig.root);
    // Find all import statements within source files.
    const files = glob_1.glob.sync((0, path_1.join)(CWD, packageConfig.root, '**/*.ts'), {
        nodir: true,
        ignore,
    });
    const packagesFoundInSourceCode = [];
    for (const fileName of files) {
        const contents = (await (0, fs_extra_1.readFile)((0, path_1.join)(fileName))).toString();
        const foundPackages = findImportedPackages(contents);
        for (let foundPackage of foundPackages) {
            // Abort if the found package name is equal to the current library's package name.
            if (foundPackage === packageJson.name) {
                continue;
            }
            const ignoredPackages = [
                'child_process', // system level package
                'https', // system level package
                'os', // system level package
                'path', // system level package
                'rxjs', // peer of @angular/core
                'stream', // system level package
            ];
            if (implicitPeers) {
                ignoredPackages.push(...implicitPeers);
            }
            if (ignoredPackages.includes(foundPackage) ||
                foundPackage.startsWith('node:')) {
                continue;
            }
            // ng2-dragula also requires the dragula package.
            if (foundPackage === 'ng2-dragula') {
                packagesFoundInSourceCode.push('dragula');
            }
            // The following dependencies are provided by @angular/cli.
            if ((foundPackage.startsWith('@angular-devkit/') &&
                foundPackage !== '@angular-devkit/build-angular') ||
                foundPackage.startsWith('@schematics/')) {
                foundPackage = '@angular/cli';
            }
            packagesFoundInSourceCode.push(foundPackage);
            if (dependencies.includes(foundPackage)) {
                continue;
            }
            if (fix) {
                const version = packageLockJson.dependencies[foundPackage]
                    ? `^${packageLockJson.dependencies[foundPackage].version}`
                    : monorepoPackageNames.includes(foundPackage)
                        ? '0.0.0-PLACEHOLDER'
                        : undefined;
                if (!version) {
                    errors.push(`A version could not be located for package '${foundPackage}'. Is it installed?\n`);
                }
                else {
                    packageJson.peerDependencies = packageJson.peerDependencies || {};
                    if (!packageJson.peerDependencies[foundPackage]) {
                        packageJson.peerDependencies[foundPackage] = version;
                        console.log(` [fix] --> ${projectName}: Added '${foundPackage}' as a peer dependency.`);
                    }
                }
            }
            else {
                const affectedFile = fileName.replace((0, path_1.join)(CWD, '/'), '');
                errors.push(`The library '${projectName}' imports from '${foundPackage}' but it is not listed as a peer!\n` +
                    `   see: ${affectedFile}\n` +
                    `        ${'^'.repeat(affectedFile.length)}\n`);
            }
        }
    }
    return {
        errors,
        packagesFoundInSourceCode: [...new Set(packagesFoundInSourceCode)], // remove duplicates
    };
}
async function findUnusedPeers(projectName, packageConfig, packageJson, packagesFoundInSourceCode, fix = false, implicitPeers) {
    const errors = [];
    const peers = Object.keys(packageJson.peerDependencies || {});
    // All component libraries should have these peer dependencies.
    const ignoredPackages = ['@angular/core', '@angular/common'];
    if (implicitPeers) {
        ignoredPackages.push(...implicitPeers);
    }
    for (const peer of peers) {
        if (ignoredPackages.includes(peer)) {
            continue;
        }
        if (packagesFoundInSourceCode.includes(peer)) {
            continue;
        }
        if (fix) {
            if (packageJson.peerDependencies && packageJson.peerDependencies[peer]) {
                delete packageJson.peerDependencies[peer];
                console.log(` [fix] --> ${projectName}: Removed '${peer}' as a peer dependency since it is not being used.`);
            }
        }
        else {
            const affectedFile = (0, path_1.join)(packageConfig.root, 'package.json');
            errors.push(`The library '${projectName}' requests a peer of '${peer}' but it is not found in the source code.\n` +
                `   Remove the peer from: '${affectedFile}'\n` +
                `                          ${'^'.repeat(affectedFile.length)}\n`);
        }
    }
    return { errors };
}
async function checkLibraryMissingPeers(options) {
    console.log('Checking libraries for missing peer dependencies...\n');
    let errors = [];
    const packageConfigs = await (0, get_publishable_projects_1.getPublishableProjects)();
    const { implicitPeerDependencies } = await (0, read_skyuxdev_config_1.readSkyuxdevConfig)([
        'implicitPeerDependencies',
    ]);
    const monorepoPackageNames = [];
    for (const p in packageConfigs) {
        monorepoPackageNames.push(packageConfigs[p].npmName);
    }
    for (const projectName in packageConfigs) {
        const packageConfig = packageConfigs[projectName];
        const packageJsonPath = (0, path_1.join)(CWD, packageConfig.root, 'package.json');
        const packageJson = await (0, fs_extra_1.readJson)(packageJsonPath);
        const implicitPeers = implicitPeerDependencies?.[projectName];
        const unlistedPeersResult = await findUnlistedPeers(projectName, packageConfig, monorepoPackageNames, packageJson, options.fix, implicitPeers);
        const unusedPeersResult = await findUnusedPeers(projectName, packageConfig, packageJson, unlistedPeersResult.packagesFoundInSourceCode, options.fix, implicitPeers);
        errors = errors
            .concat(unlistedPeersResult.errors)
            .concat(unusedPeersResult.errors);
        if (options.fix) {
            await (0, package_json_1.writePackageJson)(packageJsonPath, packageJson);
        }
    }
    if (errors.length > 0) {
        errors.forEach((err) => console.error(` ✘ ${err}`));
        console.error(`
======================================================
  [!] Missing peers found!
      Append the command with '--fix' to fix them.
======================================================
`);
        process.exit(1);
    }
    console.log(' ✔ Done checking library peers. OK.\n');
}
exports.checkLibraryMissingPeers = checkLibraryMissingPeers;
