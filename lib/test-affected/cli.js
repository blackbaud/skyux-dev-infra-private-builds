"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestAffectedModule = void 0;
const handler_1 = require("./handler");
async function builder(argv) {
    return argv
        .option('codeCoverage', {
        type: 'boolean',
        default: true,
        description: 'Specifies if a code coverage report should be generated.',
    })
        .option('karmaConfig', {
        type: 'string',
        description: 'The Karma configuration file.',
    })
        .option('onlyComponents', {
        type: 'boolean',
        default: false,
        description: 'Specifies if only component tests should be executed.',
    });
}
exports.TestAffectedModule = {
    builder,
    handler: handler_1.testAffected,
    command: 'test-affected',
    describe: 'Executes Karma tests for all affected projects, within a single browser instance.',
};
