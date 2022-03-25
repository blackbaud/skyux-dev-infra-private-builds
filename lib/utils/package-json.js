"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hardenPackageJsonDependencies = exports.writePackageJson = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const sort_object_by_keys_1 = require("./sort-object-by-keys");
function arrangePackageJsonFields(packageJson) {
    const fieldOrder = [
        'name',
        'version',
        'author',
        'description',
        'keywords',
        'license',
        'repository',
        'bugs',
        'homepage',
        'schematics',
        'ng-add',
        'ng-update',
        'peerDependencies',
        'dependencies',
    ];
    const newJson = {};
    for (const field of fieldOrder) {
        if (packageJson[field]) {
            newJson[field] = packageJson[field];
            delete packageJson[field];
        }
    }
    for (const k in packageJson) {
        newJson[k] = packageJson[k];
    }
    return newJson;
}
async function writePackageJson(filePath, packageJson) {
    if (packageJson.peerDependencies) {
        packageJson.peerDependencies = (0, sort_object_by_keys_1.sortObjectByKeys)(packageJson.peerDependencies);
    }
    if (packageJson.dependencies) {
        packageJson.dependencies = (0, sort_object_by_keys_1.sortObjectByKeys)(packageJson.dependencies);
    }
    await (0, fs_extra_1.writeJson)(filePath, arrangePackageJsonFields(packageJson), {
        spaces: 2,
    });
}
exports.writePackageJson = writePackageJson;
function hardenDependencyVersions(dependencies, packageLock) {
    for (const packageName in dependencies) {
        const installedVersion = packageLock.dependencies[packageName]?.version;
        if (!installedVersion) {
            console.warn(`Warning: The package ${packageName} was found in package.json but is not installed.`);
            continue;
        }
        const version = dependencies[packageName];
        if (version !== installedVersion) {
            console.info(`Fixing version for dependency ${packageName} @ "${installedVersion}" (was "${version}")...`);
            dependencies[packageName] = installedVersion;
        }
    }
}
/**
 * Sets specific versions for package.json `dependencies` and `devDependencies`.
 */
async function hardenPackageJsonDependencies(workingDirectory) {
    console.info('Hardening package.json dependency versions...');
    workingDirectory = workingDirectory || process.cwd();
    const packageJson = await (0, fs_extra_1.readJson)((0, path_1.join)(workingDirectory, 'package.json'));
    const packageLockJson = await (0, fs_extra_1.readJson)((0, path_1.join)(workingDirectory, 'package-lock.json'));
    hardenDependencyVersions(packageJson.dependencies, packageLockJson);
    hardenDependencyVersions(packageJson.devDependencies, packageLockJson);
    await (0, fs_extra_1.writeJson)((0, path_1.join)(workingDirectory, 'package.json'), packageJson, {
        spaces: 2,
    });
    console.info('Done hardening dependencies.');
}
exports.hardenPackageJsonDependencies = hardenPackageJsonDependencies;
