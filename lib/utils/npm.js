"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDistTags = exports.checkVersionExists = void 0;
const spawn_1 = require("./spawn");
async function getVersions(packageName) {
    const versions = await (0, spawn_1.getCommandOutput)('npm', [
        'view',
        packageName,
        'versions',
        '--json',
    ]);
    return JSON.parse(versions);
}
/**
 * Checks if a given version exists for an NPM package.
 */
async function checkVersionExists(packageName, version) {
    const versions = await getVersions(packageName);
    return versions.includes(version);
}
exports.checkVersionExists = checkVersionExists;
async function getDistTags(packageName) {
    const distTags = await (0, spawn_1.getCommandOutput)('npm', [
        'view',
        packageName,
        'dist-tags',
        '--json',
    ]);
    return JSON.parse(distTags);
}
exports.getDistTags = getDistTags;
