"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getE2eWorkflow = void 0;
const spawn_1 = require("../utils/spawn");
async function getProjects(target, runner, all) {
    const args = [
        'nx',
        'print-affected',
        '--select=tasks.target.project',
        `--target=${target}`,
    ];
    switch (target) {
        case 'build-storybook':
            args.push('--exclude=storybook');
            break;
        case 'e2e':
            args.push('--exclude=integration-e2e');
            break;
    }
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
    const projects = await getProjects('build-storybook', runner, all);
    const e2eProjects = (await getProjects('e2e', runner, all)).filter((project) => project.match(/-e2e$/)); // Workflow assumes e2e projects end in -e2e.
    const e2eMap = e2eProjects.map((e2eProject) => {
        return {
            project: e2eProject.replace(/-e2e$/, ''),
            token: `PERCY_TOKEN_${e2eProject.toUpperCase().replace(/-/g, '_')}`,
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
