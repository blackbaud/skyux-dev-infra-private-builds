"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublishableProjects = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const CWD = process.cwd();
async function getPublishableProjects() {
    const angularJson = await (0, fs_extra_1.readJson)((0, path_1.join)(CWD, 'angular.json'));
    const distPackages = {};
    for (const projectName in angularJson.projects) {
        const projectConfig = angularJson.projects[projectName];
        if (projectConfig.tags &&
            projectConfig.tags.includes('npm') &&
            projectConfig.architect.build) {
            distPackages[projectName] = {
                distRoot: projectConfig.architect.build.options.outputPath ||
                    projectConfig.architect.build.outputs[0],
                root: projectConfig.root,
            };
            // Get the name of the NPM package.
            distPackages[projectName].npmName = (await (0, fs_extra_1.readJson)((0, path_1.join)(CWD, distPackages[projectName].root, 'package.json'))).name;
        }
    }
    return distPackages;
}
exports.getPublishableProjects = getPublishableProjects;
