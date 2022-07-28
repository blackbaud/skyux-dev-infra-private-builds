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
/**
 * Get the e2e workflow for the given options. Called from .github/workflows/e2e.yml to drive the workflow
 * [matrix](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstrategymatrix)
 * as well as other workflow parameters that vary between branch push and pull request workflows.
 * @param options
 */
async function getE2eWorkflow(options) {
    const all = options.workflowTrigger === 'push';
    if (options.workflowTrigger === 'push' && !options.branch) {
        throw new Error('--branch is required for push triggers');
    }
    if (options.workflowTrigger === 'pull_request' && !options.pr) {
        throw new Error('--pr is required for pull_request triggers');
    }
    // Allow tests to stub out getCommandOutput.
    /* istanbul ignore next */
    const runner = options.getCommandOutput || spawn_1.getCommandOutput;
    const projects = await getStorybookProjects(runner, all);
    const e2eMap = projects.map((project) => {
        return {
            project,
            token: `PERCY_TOKEN_${project.toUpperCase().replace(/-/g, '_')}_E2E`,
        };
    });
    const projectsJson = JSON.stringify(projects);
    // If there are no affected projects, return a "skip" project so the matrix is not empty.
    if (projects.length === 0) {
        projects.push('skip');
    }
    const ghPagesRepo = all ? 'skyux-storybook' : 'skyux-pr-preview';
    const storybooksPath = all ? `storybooks/${options.branch}/` : `storybooks/`;
    // Logged to the console as a JSON string and used as an output variable in the workflow.
    // https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idoutputs
    console.log(JSON.stringify({
        projects,
        projectsJson,
        e2eMap,
        ghPagesRepo,
        storybooksPath,
    }));
}
exports.getE2eWorkflow = getE2eWorkflow;
