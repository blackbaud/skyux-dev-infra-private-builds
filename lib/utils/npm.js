"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublishRegistry = exports.getDistTags = exports.getVersion = exports.checkTagVersionExists = exports.checkVersionExists = exports.getVersions = void 0;
const spawn_1 = require("./spawn");
/**
 * Gets the published versions of an NPM package.
 */
async function getVersions(packageName) {
    return (0, spawn_1.getCommandOutput)('npm', ['view', packageName, 'versions', '--json'])
        .then((versions) => JSON.parse(versions))
        .then((versions) => Array.isArray(versions) ? versions : [versions])
        .catch(() => []);
}
exports.getVersions = getVersions;
/**
 * Checks if a given version exists for an NPM package.
 */
async function checkVersionExists(packageName, version) {
    return getVersion(packageName)
        .then((npmVersion) => npmVersion === version)
        .catch(() => false);
}
exports.checkVersionExists = checkVersionExists;
/**
 * Checks if a given version exists for an NPM package.
 */
async function checkTagVersionExists(packageName, distTag, version) {
    return getDistTags(packageName)
        .then((tags) => distTag in tags && tags[distTag] === version)
        .catch(() => false);
}
exports.checkTagVersionExists = checkTagVersionExists;
/**
 * Get the version for an NPM package.
 */
async function getVersion(packageName) {
    return (0, spawn_1.getCommandOutput)('npm', [
        'view',
        packageName,
        'version',
        '--json',
    ]).then((npmVersion) => JSON.parse(npmVersion));
}
exports.getVersion = getVersion;
/**
 * Gets the published dist-tags for an NPM package.
 */
async function getDistTags(packageName) {
    return (0, spawn_1.getCommandOutput)('npm', [
        'view',
        packageName,
        'dist-tags',
        '--json',
    ]).then((distTags) => JSON.parse(distTags));
}
exports.getDistTags = getDistTags;
async function getPublishRegistry(distRoot) {
    const publishDryRunResult = await (0, spawn_1.runCommand)('sh', ['-c', 'npm publish --access public --tag precheck --dry-run --json 2>&1'], {
        cwd: distRoot,
        stdio: 'pipe',
    });
    const match = /Publishing to (\S+) with tag latest and default access \(dry-run\)/.exec(publishDryRunResult ?? '');
    if (!match || !match[1]) {
        throw new Error(`Unable to determine NPM registry.`);
    }
    return match[1];
}
exports.getPublishRegistry = getPublishRegistry;
