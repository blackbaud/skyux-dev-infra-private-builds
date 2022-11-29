"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterProjectsByTarget = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
/**
 * Filters an array of project names if they have defined a given target in
 * their project.json file.
 */
async function filterProjectsByTarget(projects, target) {
    const workspaceJson = await (0, fs_extra_1.readJson)((0, path_1.join)(process.cwd(), 'workspace.json'));
    const filtered = [];
    for (const project of projects) {
        const projectRoot = workspaceJson.projects[project];
        try {
            const projectJson = await (0, fs_extra_1.readJson)((0, path_1.join)(process.cwd(), projectRoot, 'project.json'));
            if (projectJson?.targets[target]) {
                filtered.push(project);
            }
        }
        catch (err) {
            console.error(`Unable to read project.json for project '${project}'.`);
        }
    }
    return filtered;
}
exports.filterProjectsByTarget = filterProjectsByTarget;
