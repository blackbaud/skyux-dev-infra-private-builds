"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublishableProjects = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const get_project_names_1 = require("./get-project-names/get-project-names");
const get_projects_paths_1 = require("./get-projects-paths/get-projects-paths");
const CWD = process.cwd();
async function getPublishableProjects() {
    const buildableLibraries = await (0, get_project_names_1.getProjectNames)('build', 'lib', 'all');
    const buildableLibraryPaths = await (0, get_projects_paths_1.getProjectsPaths)(buildableLibraries);
    const distPackages = {};
    for (const projectName of buildableLibraries) {
        const projectConfigPath = buildableLibraryPaths[projectName];
        const projectConfig = await (0, fs_extra_1.readJson)((0, path_1.join)(CWD, projectConfigPath, 'project.json'));
        if (projectConfig.tags &&
            projectConfig.tags.includes('npm') &&
            projectConfig.targets.build) {
            const projectRoot = projectConfig.root || projectConfig.sourceRoot.replace(/\/src$/, '');
            distPackages[projectName] = {
                distRoot: (projectConfig.targets.build.options.outputPath ||
                    projectConfig.targets.build.outputs[0])
                    // Nx 15 adds '{workspaceRoot}' to the beginning of the output paths.
                    // Remove it so we can read the file path normally.
                    .replace(/^\{workspaceRoot}\//, '')
                    .replace('{projectRoot}', projectRoot),
                root: projectConfigPath,
            };
            // Get the name of the NPM package.
            distPackages[projectName].npmName = (await (0, fs_extra_1.readJson)((0, path_1.join)(CWD, projectConfigPath, 'package.json'))).name;
        }
    }
    return distPackages;
}
exports.getPublishableProjects = getPublishableProjects;
