"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishPackagesDist = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const get_publishable_projects_1 = require("../get-publishable-projects");
const dist_tag_1 = require("../utils/dist-tag");
const npm_1 = require("../utils/npm");
const spawn_1 = require("../utils/spawn");
const CWD = process.cwd();
async function createNpmrcFile(npmToken) {
    await (0, spawn_1.runCommand)('npm', [
        'config',
        'set',
        'registry=https://registry.npmjs.org/',
        `//registry.npmjs.org/:_authToken=${npmToken}`,
    ]);
}
async function publishPackagesDist(options) {
    const npmToken = process.env.NPM_TOKEN;
    if (!npmToken) {
        throw new Error('Environment variable "NPM_TOKEN" not set! Abort publishing to NPM.');
    }
    const { version } = await (0, fs_extra_1.readJson)((0, path_1.join)(CWD, 'package.json'));
    // Since all SKY UX packages share the same version, arbitrarily choose one to get the version.
    const versions = await (0, npm_1.getVersions)(options.packageNameUsedToDetermineDistTags);
    const npmPublishTag = (0, dist_tag_1.getDistTag)(version, versions);
    const commandArgs = ['publish', '--access', 'public', '--tag', npmPublishTag];
    if (options.dryRun) {
        commandArgs.push('--dry-run');
    }
    const distPackages = await (0, get_publishable_projects_1.getPublishableProjects)();
    const errors = [];
    await createNpmrcFile(npmToken);
    for (const projectName in distPackages) {
        if (!distPackages[projectName].distRoot) {
            throw new Error(`No output path for '${projectName}'. Did you run 'skyux-dev create-packages-dist'?`);
        }
        const distRoot = (0, path_1.join)(CWD, distPackages[projectName].distRoot);
        if (!(0, fs_extra_1.existsSync)((0, path_1.join)(distRoot, 'package.json'))) {
            throw new Error(`Path '${distRoot}/package.json' does not exist. Did you run 'skyux-dev create-packages-dist'?`);
        }
        const { name: packageName, version: packageVersion } = await (0, fs_extra_1.readJson)((0, path_1.join)(distRoot, 'package.json'));
        if (version !== packageVersion) {
            throw new Error(`Path '${distRoot}/package.json' has version '${packageVersion}' but this release is version '${version}'. Did you run 'skyux-dev create-packages-dist'?`);
        }
        try {
            const alreadyPublished = await (0, npm_1.checkTagVersionExists)(packageName, npmPublishTag, packageVersion);
            if (alreadyPublished) {
                console.log(`Package '${packageName}@${packageVersion}' already published. Skipping.`);
                continue;
            }
            console.log(`

==============================================================
> Run: npm ${commandArgs.join(' ')}
> Path: ${distRoot}
> Package: ${packageName}@${packageVersion}
==============================================================

`);
            await (0, spawn_1.runCommand)('npm', commandArgs, {
                cwd: distRoot,
                stdio: 'inherit',
            }).catch(async (err) => {
                throw new Error(`Error when publishing '${projectName}'!`, {
                    cause: err,
                });
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
