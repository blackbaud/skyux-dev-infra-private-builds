"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectNames = void 0;
const show_project_1 = require("../utils/show-project");
const spawn_1 = require("../utils/spawn");
const projectTypes = {
    app: 'application',
    lib: 'library',
};
/**
 * Returns a list of project names for a given target.
 * @param target
 * @param projectType
 * @param allOrAffected
 * @param options
 */
async function getProjectNames(target, projectType, allOrAffected, options) {
    const args = ['nx', 'show', 'projects'];
    if (allOrAffected === 'affected') {
        args.push('--affected');
    }
    const targets = Array.isArray(target) ? target : [target];
    const projects = [];
    /* istanbul ignore next */
    const command = options?.getCommandOutput || spawn_1.getCommandOutput;
    for (const withTarget of targets) {
        const result = await command('npx', [
            ...args,
            `--withTarget=${withTarget}`,
        ]);
        projects.push(...result.split(/\r?\n/).filter((p) => p));
    }
    if (projectType !== 'all') {
        for (const project of projects) {
            const projectInfo = await (0, show_project_1.showProject)(project, options);
            if (projectInfo['projectType'] !== projectTypes[projectType]) {
                projects.splice(projects.indexOf(project), 1);
            }
        }
    }
    return projects;
}
exports.getProjectNames = getProjectNames;
