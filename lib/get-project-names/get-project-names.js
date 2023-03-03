"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectNames = void 0;
const spawn_1 = require("../utils/spawn");
/**
 * Returns a list of project names for a given target.
 * @param target
 * @param projectType
 * @param allOrAffected
 * @param options
 */
async function getProjectNames(target, projectType = 'all', allOrAffected = 'all', options) {
    const args = [
        'nx',
        'print-affected',
        '--select=tasks.target.project',
        `--target=${Array.isArray(target) ? target.join(',') : target}`,
    ];
    if (projectType !== 'all') {
        args.push(`--type=${projectType}`);
    }
    if (allOrAffected === 'all') {
        args.push('--all');
    }
    const result = await (options?.getCommandOutput || spawn_1.getCommandOutput)('npx', args);
    return result
        .split(',')
        .map((project) => project.trim())
        .filter((project) => project);
}
exports.getProjectNames = getProjectNames;
