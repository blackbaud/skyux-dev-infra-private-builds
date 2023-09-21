"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrNumber = exports.getWorkflowEvent = exports.E2eWorkflowModule = void 0;
const handler_1 = require("./handler");
async function builder(argv) {
    return argv
        .option('workflowTrigger', {
        type: 'string',
        coerce: getWorkflowEvent,
        demandOption: true,
        requiresArg: true,
        choices: ['merge_group', 'pull_request', 'pull_request_target', 'push'],
        default: process.env.GITHUB_EVENT_NAME,
        description: 'The workflow trigger',
        defaultDescription: 'GITHUB_EVENT_NAME',
    })
        .option('pr', {
        type: 'number',
        default: process.env.GITHUB_REF,
        description: 'PR number',
        defaultDescription: 'derived from GITHUB_REF',
        coerce: getPrNumber,
    })
        .option('branch', {
        type: 'string',
        default: process.env.GITHUB_REF_NAME,
        description: 'The branch name',
        defaultDescription: 'GITHUB_REF_NAME',
    });
}
exports.E2eWorkflowModule = {
    builder,
    handler: handler_1.getE2eWorkflow,
    command: 'e2e-workflow',
    describe: 'Builds the matrix of projects to run e2e tests on.',
};
function getWorkflowEvent(value) {
    return value;
}
exports.getWorkflowEvent = getWorkflowEvent;
function getPrNumber(arg) {
    const number = parseInt(`${arg}`, 10);
    if (!isNaN(number)) {
        return number;
    }
    if (arg?.startsWith('refs/pull/')) {
        return parseInt(arg.split('/')[2], 10);
    }
    return 0;
}
exports.getPrNumber = getPrNumber;
