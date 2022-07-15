"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getE2eWorkflow = void 0;
const spawn_1 = require("../utils/spawn");
async function getStorybookProjects(runner, all) {
    const args = [
        'nx',
        'print-affected',
        '--target=build-storybook',
        '--exclude=storybook',
        '--select=tasks.target.project',
    ];
    if (all) {
        args.push('--all');
    }
    const affected = await runner('npx', args);
    return affected
        .split(',')
        .map((project) => project.trim())
        .filter((project) => project !== '');
}
async function getE2eWorkflow(options) {
    const all = options.workflowTrigger === 'push';
    if (options.workflowTrigger === 'push' && !options.branch) {
        throw new Error('--branch is required for push triggers');
    }
    if (options.workflowTrigger === 'pull_request' && !options.pr) {
        throw new Error('--pr is required for pull_request triggers');
    }
    // Allow tests to stub out the runner and logger.
    /* istanbul ignore next */
    const runner = options.getCommandOutput || spawn_1.getCommandOutput;
    /* istanbul ignore next */
    const logger = options.logger || console.log;
    const projects = await getStorybookProjects(runner, all);
    const e2eMap = projects.map((project) => {
        return {
            project,
            token: `PERCY_TOKEN_${project.toUpperCase().replace(/-/g, '_')}_E2E`,
        };
    });
    const ghPagesRepo = all ? 'skyux-storybook' : 'skyux-pr-preview';
    const storybooksPath = all ? `storybooks/${options.branch}/` : `storybooks/`;
    logger(JSON.stringify({
        projects,
        projectsJson: JSON.stringify(projects),
        e2eMap,
        ghPagesRepo,
        storybooksPath,
    }));
}
exports.getE2eWorkflow = getE2eWorkflow;
