"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPackagesDist = void 0;
const fs_extra_1 = require("fs-extra");
const os_1 = __importDefault(require("os"));
const path_1 = require("path");
const semver_1 = __importDefault(require("semver"));
const get_publishable_projects_1 = require("../get-publishable-projects");
const spawn_1 = require("../utils/spawn");
const create_documentation_json_1 = require("./create-documentation-json");
const filter_projects_by_target_1 = require("./filter-projects-by-target");
const verify_packages_dist_1 = require("./verify-packages-dist");
const CWD = process.cwd();
/**
 * Replaces any occurrence of '0.0.0-PLACEHOLDER' with a version number.
 */
async function replacePlaceholderTextWithVersion(filePath, skyuxVersion, skyuxPackagesVersion) {
    const contents = (await (0, fs_extra_1.readFile)(filePath))
        .toString()
        .replace(/0\.0\.0-PLACEHOLDER/g, skyuxVersion)
        .replace(/0\.0\.0-PACKAGES_PLACEHOLDER/g, skyuxPackagesVersion);
    await (0, fs_extra_1.writeFile)(filePath, contents);
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
    // For SKY UX v.5, add 1000 to the minor version number.
    // e.g. 5.5.1 --> 5.1005.1
    const skyuxPackagesVersion = semver_1.default.major(skyuxVersion) === 5
        ? skyuxVersion.replace(/\.([0-9]+)\./, (match, group) => {
            return match.replace(/[0-9]+/, `${+group + 1000}`);
        })
        : skyuxVersion;
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
    ], {
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
        ], {
            stdio: 'inherit',
            env: { ...process.env, NX_CLOUD_DISTRIBUTED_EXECUTION: 'false' },
        });
    }
    // Use a separate cache directory so the dependencies match typedoc@0.22.15.
    const typedocCachePath = `${os_1.default.tmpdir()}/npm-cache-${Math.floor(Math.random() * 1e11).toString(24)}`;
    (0, fs_extra_1.existsSync)(typedocCachePath) || (await (0, fs_extra_1.emptyDir)(typedocCachePath));
    for (const projectName in distPackages) {
        const distPackage = distPackages[projectName];
        await replacePlaceholderTextWithVersion((0, path_1.join)(distPackage.distRoot, 'package.json'), skyuxVersion, skyuxPackagesVersion);
        if (!argv.documentationExcludeProjects?.includes(projectName)) {
            await (0, create_documentation_json_1.createDocumentationJson)(projectName, distPackage, typedocCachePath);
        }
        const migrationCollectionJsonPath = (0, path_1.join)(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        distPackage.distRoot, 'src/schematics/migrations/migration-collection.json');
        if ((0, fs_extra_1.existsSync)(migrationCollectionJsonPath)) {
            await replacePlaceholderTextWithVersion(migrationCollectionJsonPath, skyuxVersion, skyuxPackagesVersion);
        }
    }
    // Remove the temporary cache directory.
    (0, fs_extra_1.rmSync)(typedocCachePath, { force: true, recursive: true });
    if (argv.projects) {
        console.log(` ✔ Done creating distribution packages for [${argv.projects.join(', ')}].`);
    }
    else {
        await (0, verify_packages_dist_1.verifyPackagesDist)(distPackages, packageJson);
        console.log(' ✔ Done creating distribution packages for all libraries.');
    }
}
exports.createPackagesDist = createPackagesDist;
