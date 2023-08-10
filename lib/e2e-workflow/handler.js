"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getE2eWorkflow = void 0;
const get_project_names_1 = require("../get-project-names/get-project-names");
const get_projects_paths_1 = require("../get-projects-paths/get-projects-paths");
const spawn_1 = require("../utils/spawn");
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
    if (['pull_request', 'pull_request_target'].includes(options.workflowTrigger) &&
        !options.pr) {
        throw new Error('--pr is required for pull_request triggers');
    }
    // Allow tests to stub out getCommandOutput.
    /* istanbul ignore next */
    const runner = options.getCommandOutput || spawn_1.getCommandOutput;
    // Branch previews include all Storybooks; PR previews include only affected Storybooks.
    const projects = await (0, get_project_names_1.getProjectNames)('build-storybook', 'all', all ? 'all' : 'affected', {
        getCommandOutput: runner,
    });
    // Only run affected e2e tests for both branches and PRs.
    const e2eProjects = await (0, get_project_names_1.getProjectNames)('e2e', 'all', 'affected', {
        getCommandOutput: runner,
    });
    /* istanbul ignore next */
    const e2eProjectPaths = await (0, get_projects_paths_1.getProjectsPaths)(e2eProjects, {
        getCommandOutput: runner,
    });
    // Unfiltered list of e2e projects, including the project root to find the cypress output.
    const e2eTargets = e2eProjects.length === 0
        ? [{ project: 'skip', token: 'skip', root: 'skip' }]
        : e2eProjects.map((e2eProject) => {
            return {
                project: e2eProject,
                token: `PERCY_TOKEN_${e2eProject.toUpperCase().replace(/-/g, '_')}`,
                root: e2eProjectPaths[e2eProject],
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
        e2eTargets,
        ghPagesRepo,
        storybooksPath,
    }));
}
exports.getE2eWorkflow = getE2eWorkflow;
