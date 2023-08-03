"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showProject = void 0;
const spawn_1 = require("./spawn");
async function showProject(projectName, options) {
    const command = options?.getCommandOutput || spawn_1.getCommandOutput;
    const project = await command('npx', [
        'nx',
        'show',
        'project',
        projectName,
        '--json',
    ]);
    if (project.match(/Could not find project/)) {
        return Promise.reject(`Project '${projectName}' not found.`);
    }
    return JSON.parse(project);
}
exports.showProject = showProject;
