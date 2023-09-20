"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishPackagesDist = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const semver_1 = __importDefault(require("semver"));
const get_publishable_projects_1 = require("../get-publishable-projects");
const npm_1 = require("../utils/npm");
const spawn_1 = require("../utils/spawn");
const CWD = process.cwd();
async function createNpmrcFile(distRoot, npmToken) {
    const npmFilePath = (0, path_1.join)(distRoot, '.npmrc');
    await (0, fs_extra_1.ensureFile)(npmFilePath);
    await (0, fs_extra_1.writeFile)(npmFilePath, `//registry.npmjs.org/:_authToken=${npmToken}`);
}
async function publishPackagesDist(options) {
    const npmToken = process.env.NPM_TOKEN;
    if (!npmToken) {
        throw new Error('Environment variable "NPM_TOKEN" not set! Abort publishing to NPM.');
    }
    const version = (await (0, fs_extra_1.readJson)((0, path_1.join)(CWD, 'package.json'))).version;
    // Since all SKY UX packages share the same version, arbitrarily choose one to get the version.
    const distTags = await (0, npm_1.getDistTags)(options.packageNameUsedToDetermineDistTags);
    const semverData = semver_1.default.parse(version);
    const isPrerelease = semverData ? semverData.prerelease.length > 0 : false;
    const majorVersion = semverData.major;
    let npmPublishTag = `lts-v${majorVersion}`;
    if (isPrerelease) {
        if (semver_1.default.gt(version, distTags.next)) {
            npmPublishTag = 'next';
        }
        else {
            npmPublishTag += '-next';
        }
    }
    else {
        if (semver_1.default.gt(version, distTags.latest)) {
            npmPublishTag = 'latest';
        }
    }
    const commandArgs = ['publish', '--access', 'public', '--tag', npmPublishTag];
    if (options.dryRun) {
        commandArgs.push('--dry-run');
    }
    console.log(`

==============================================================
> Run: npm ${commandArgs.join(' ')}
==============================================================

`);
    const distPackages = await (0, get_publishable_projects_1.getPublishableProjects)();
    const errors = [];
    for (const projectName in distPackages) {
        const distRoot = (0, path_1.join)(CWD, distPackages[projectName].distRoot);
        if (!(0, fs_extra_1.existsSync)(distRoot)) {
            throw new Error(`Path '${distRoot}' does not exist. Did you run 'skyux-dev create-packages-dist'?`);
        }
        await createNpmrcFile(distRoot, npmToken);
        try {
            await (0, spawn_1.runCommand)('npm', commandArgs, {
                cwd: distRoot,
                stdio: 'inherit',
            });
        }
        catch (err) {
            console.error(`Failed to publish '${projectName}'!`, err);
            errors.push(err);
        }
    }
    if (errors.length > 0) {
        console.error(...errors);
        throw new Error('Errors encountered when publishing packages.');
    }
}
exports.publishPackagesDist = publishPackagesDist;
