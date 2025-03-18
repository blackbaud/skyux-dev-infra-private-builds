"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPackagesDist = void 0;
const fs_extra_1 = require("fs-extra");
const glob_1 = require("glob");
const path_1 = require("path");
const get_publishable_projects_1 = require("../get-publishable-projects");
const offset_versions_1 = require("../utils/offset-versions");
const spawn_1 = require("../utils/spawn");
const filter_projects_by_target_1 = require("./filter-projects-by-target");
const verify_packages_dist_1 = require("./verify-packages-dist");
const CWD = process.cwd();
/**
 * Replaces any occurrence of '0.0.0-PLACEHOLDER' with a version number.
 */
async function replacePlaceholderTextWithVersion(filePath, skyuxVersion, offsetPackageVersions) {
    const originalContents = await (0, fs_extra_1.readFile)(filePath, { encoding: 'utf-8' });
    const replacements = [['0.0.0-PLACEHOLDER', skyuxVersion]];
    if (offsetPackageVersions) {
        replacements.push(...Object.entries((0, offset_versions_1.getOffsetVersions)(offsetPackageVersions, skyuxVersion)));
    }
    const modifiedContents = replacements.reduce((contents, [placeholder, version]) => contents.replaceAll(placeholder, version), originalContents);
    if (modifiedContents !== originalContents) {
        console.log(`Replaced "0.0.0-PLACEHOLDER" in file '${filePath}'.`);
        await (0, fs_extra_1.writeFile)(filePath, modifiedContents);
    }
}
async function createPackagesDist(argv) {
    if (argv.projects) {
        console.log(`Creating distribution packages for [${argv.projects.join(', ')}]...`);
    }
    else {
        console.log('Creating distribution packages for all libraries...');
    }
    const packageJson = await (0, fs_extra_1.readJson)((0, path_1.join)(CWD, 'package.json'));
    const skyuxVersion = packageJson.version;
    let distPackages = await (0, get_publishable_projects_1.getPublishableProjects)();
    const projectNames = (argv.projects || Object.keys(distPackages));
    if (!projectNames || projectNames.length === 0) {
        throw new Error('No projects found.');
    }
    if (argv.projects) {
        distPackages = Object.entries(distPackages).reduce((newObj, [key, val]) => {
            if (projectNames.indexOf(key) >= 0) {
                newObj[key] = val;
            }
            return newObj;
        }, {});
        for (const project of Object.values(distPackages)) {
            await (0, fs_extra_1.emptyDir)(project.distRoot);
        }
    }
    else {
        await (0, fs_extra_1.emptyDir)((0, path_1.join)(CWD, 'dist'));
    }
    // Build all libraries.
    await (0, spawn_1.runCommand)('npx', [
        'nx',
        'run-many',
        '--target=build',
        `--projects=${projectNames.join(',')}`,
        '--parallel',
    ].concat(argv.skipNxCache ? ['--skip-nx-cache'] : []), {
        stdio: 'inherit',
    });
    const postBuildProjectNames = await (0, filter_projects_by_target_1.filterProjectsByTarget)(projectNames, 'postbuild');
    // Run postbuild steps.
    if (postBuildProjectNames.length > 0) {
        await (0, spawn_1.runCommand)('npx', [
            'nx',
            'run-many',
            '--target=postbuild',
            `--projects=${postBuildProjectNames.join(',')}`,
            '--parallel',
        ].concat(argv.skipNxCache ? ['--skip-nx-cache'] : []), {
            stdio: 'inherit',
            env: { ...process.env, NX_CLOUD_DISTRIBUTED_EXECUTION: 'false' },
        });
    }
    for (const projectName in distPackages) {
        const distPackage = distPackages[projectName];
        const distRoot = distPackage.distRoot;
        if (!distRoot) {
            throw new Error(`Unable to resolve an output path for '${projectName}'`);
        }
        const versionedFilePaths = glob_1.glob.sync((0, path_1.join)(distRoot, '**/*.{js,json,mjs}'), {
            nodir: true,
        });
        for (const versionedFilePath of versionedFilePaths) {
            if ((0, fs_extra_1.existsSync)((0, path_1.normalize)(versionedFilePath))) {
                await replacePlaceholderTextWithVersion(versionedFilePath, skyuxVersion, argv.offsetPackageVersions);
            }
        }
    }
    if (argv.projects) {
        console.log(` ✔ Done creating distribution packages for [${argv.projects.join(', ')}].`);
    }
    else {
        await (0, verify_packages_dist_1.verifyPackagesDist)(distPackages, packageJson);
        console.log(' ✔ Done creating distribution packages for all libraries.');
    }
}
exports.createPackagesDist = createPackagesDist;
