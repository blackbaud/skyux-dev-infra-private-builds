"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowModule = void 0;
const handler_1 = require("./handler");
function builder(argv) {
    return argv.option('all', {
        type: 'boolean',
        default: false,
        description: 'Run all projects or only affected projects. By default, only affected projects are run.',
    });
}
exports.WorkflowModule = {
    builder,
    handler: handler_1.workflowData,
    command: 'workflow',
    describe: 'Retrieve the workflow data for the affected projects or all projects.',
};
