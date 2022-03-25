"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyLibraryDependencies = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const semver_1 = __importDefault(require("semver"));
function verifyDependencySection(section, projectRoot, projectPackageJson, workspacePackageJson, npmPackageNames) {
    const errors = [];
    for (const packageName in projectPackageJson[section]) {
        const targetVersion = projectPackageJson[section][packageName];
        // Ignore packages that live in the monorepo.
        if (npmPackageNames.includes(packageName)) {
            continue;
        }
        const minTargetVersion = semver_1.default.minVersion(targetVersion).version;
        const workspaceVersion = workspacePackageJson.dependencies[packageName] ||
            workspacePackageJson.devDependencies[packageName];
        if (!workspaceVersion) {
            errors.push(`The package "${packageName}" listed in the \`${section}\` section of '${projectRoot}/package.json' ` +
                `was not found in the root 'package.json' \`dependencies\` section. Install the package at the root level and try again.`);
            continue;
        }
        const minWorkspaceVersion = semver_1.default.minVersion(workspaceVersion).version;
        if (workspaceVersion !== minWorkspaceVersion) {
            errors.push(`The version listed in the workspace 'package.json' for "${packageName}@${workspaceVersion}" must be set to a specific version ` +
                `(without a semver range character), and set to the minimum version satisfied by the range defined in the \`${section}\` ` +
                `section of '${projectRoot}/package.json' (wanted "${packageName}@${targetVersion}"). To address this problem, set ` +
                `"${packageName}" to (${minTargetVersion}) in the workspace 'package.json'.`);
        }
        else if (workspaceVersion !== minTargetVersion) {
            errors.push(`The version (${workspaceVersion}) of the package "${packageName}" in the \`dependencies\` section of 'package.json' ` +
                `does not meet the minimum version requirements of the range defined in the \`${section}\` section of ` +
                `'${projectRoot}/package.json' (wanted "${packageName}@${targetVersion}"). Either increase the minimum ` +
                `supported version in '${projectRoot}/package.json' to (^${minWorkspaceVersion}), or downgrade the ` +
                `version installed in the root 'package.json' to (${minTargetVersion}).`);
        }
    }
    return errors;
}
/**
 * Confirms the workspace package.json lists package versions that are satisfied by all peer dependency ranges.
 */
async function verifyLibraryDependencies(projects, workspacePackageJson) {
    console.log('Validating library dependencies...');
    const npmPackageNames = Object.keys(projects).map((projectName) => projects[projectName].npmName);
    const errors = [];
    for (const projectName in projects) {
        const projectConfig = projects[projectName];
        const projectPackageJson = await (0, fs_extra_1.readJson)((0, path_1.join)(projectConfig.root, 'package.json'));
        // Validate peer dependencies.
        if (projectPackageJson.peerDependencies) {
            errors.push(...verifyDependencySection('peerDependencies', projectConfig.root, projectPackageJson, workspacePackageJson, npmPackageNames));
        }
        // Validate dependencies.
        if (projectPackageJson.dependencies) {
            errors.push(...verifyDependencySection('dependencies', projectConfig.root, projectPackageJson, workspacePackageJson, npmPackageNames));
        }
    }
    if (errors.length > 0) {
        errors.forEach((error) => {
            console.error(` ✘ ${error}`);
        });
        throw new Error('Errors found with library dependencies.');
    }
    console.log(' ✔ Done validating dependencies. OK.');
}
exports.verifyLibraryDependencies = verifyLibraryDependencies;
