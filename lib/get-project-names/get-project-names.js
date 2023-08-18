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
    let projects = [];
    /* istanbul ignore next */
    const command = options?.getCommandOutput || spawn_1.getCommandOutput;
    for (const withTarget of targets) {
        /* istanbul ignore next */
        const result = await command('npx', [
            ...args,
            `--withTarget=${withTarget}`,
        ]).catch(() => '');
        projects.push(...(result || '').split(/\r?\n/).filter((p) => p));
    }
    projects = [...new Set(projects)].sort((a, b) => a.localeCompare(b));
    if (projectType !== 'all') {
        const graph = await (0, show_project_1.showAllProjects)(options);
        return projects.filter((project) => graph[project].projectType === projectTypes[projectType]);
    }
    return projects;
}
exports.getProjectNames = getProjectNames;
