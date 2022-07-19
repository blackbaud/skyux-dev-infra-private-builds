"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishStorybookModule = void 0;
const cli_1 = require("../e2e-workflow/cli");
const handler_1 = require("./handler");
async function builder(argv) {
    return argv
        .option('workingDirectory', {
        type: 'string',
        demandOption: true,
        description: 'The path to a working copy of the GitHub Pages repository.',
    })
        .option('pr', {
        type: 'number',
        default: process.env.GITHUB_REF,
        description: 'PR number',
        defaultDescription: 'derived from GITHUB_REF',
        coerce: cli_1.getPrNumber,
    })
        .option('branch', {
        type: 'string',
        default: process.env.GITHUB_REF_NAME,
        description: 'The branch name',
        defaultDescription: 'GITHUB_REF_NAME',
    })
        .option('token', {
        type: 'string',
        demandOption: true,
        default: process.env.GITHUB_TOKEN,
        description: 'The GitHub token to use when publishing.',
        defaultDescription: '`GITHUB_TOKEN` from environment',
    });
}
exports.PublishStorybookModule = {
    builder,
    handler: handler_1.publishStorybook,
    command: 'publish-storybook',
    describe: 'Publish the Storybook to GitHub Pages.',
};
