"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPackagesDist = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const semver_1 = __importDefault(require("semver"));
const get_publishable_projects_1 = require("../get-publishable-projects");
const spawn_1 = require("../utils/spawn");
const create_documentation_json_1 = require("./create-documentation-json");
const inline_external_resources_paths_1 = require("./inline-external-resources-paths");
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
    console.log('Creating distribution packages for all libraries...');
    const packageJson = await (0, fs_extra_1.readJson)((0, path_1.join)(CWD, 'package.json'));
    const skyuxVersion = packageJson.version;
    // For SKY UX v.5, add 1000 to the minor version number.
    // e.g. 5.5.1 --> 5.1005.1
    const skyuxPackagesVersion = semver_1.default.major(skyuxVersion) === 5
        ? skyuxVersion.replace(/\.([0-9])\./, (match, group) => {
            return match.replace(/[0-9]/, `${+group + 1000}`);
        })
        : skyuxVersion;
    await (0, fs_extra_1.emptyDir)((0, path_1.join)(CWD, 'dist'));
    const distPackages = await (0, get_publishable_projects_1.getPublishableProjects)();
    const projectNames = Object.keys(distPackages);
    // Build all libraries.
    await (0, spawn_1.runCommand)('npx', [
        'nx',
        'run-many',
        '--target=build',
        `--projects=${projectNames.join(',')}`,
        '--parallel',
        '--maxParallel=2',
    ], {
        stdio: 'inherit',
    });
    // Run postbuild steps.
    await (0, spawn_1.runCommand)('npx', [
        'nx',
        'run-many',
        '--target=postbuild',
        `--projects=${projectNames.join(',')}`,
        '--parallel',
        '--maxParallel=2',
    ], {
        stdio: 'inherit',
        env: { ...process.env, NX_CLOUD_DISTRIBUTED_EXECUTION: 'false' },
    });
    for (const projectName in distPackages) {
        const distPackage = distPackages[projectName];
        await replacePlaceholderTextWithVersion((0, path_1.join)(distPackage.distRoot, 'package.json'), skyuxVersion, skyuxPackagesVersion);
        (0, inline_external_resources_paths_1.inlineExternalResourcesPaths)(distPackage.distRoot);
        if (!argv.documentationExcludeProjects?.includes(projectName)) {
            await (0, create_documentation_json_1.createDocumentationJson)(projectName, distPackage);
        }
        const migrationCollectionJsonPath = (0, path_1.join)(distPackage.distRoot, 'src/schematics/migrations/migration-collection.json');
        if ((0, fs_extra_1.existsSync)(migrationCollectionJsonPath)) {
            await replacePlaceholderTextWithVersion(migrationCollectionJsonPath, skyuxVersion, skyuxPackagesVersion);
        }
    }
    await (0, verify_packages_dist_1.verifyPackagesDist)(distPackages, packageJson);
    console.log(' ✔ Done creating distribution packages for all libraries.');
}
exports.createPackagesDist = createPackagesDist;
