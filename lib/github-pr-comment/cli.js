"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubPrCommentModule = void 0;
const cli_1 = require("../e2e-workflow/cli");
const handler_1 = require("./handler");
async function builder(argv) {
    return argv
        .option('ownerSlashRepo', {
        type: 'string',
        description: 'The owner/repo of the repository to comment on.',
        default: 'blackbaud/skyux',
    })
        .option('pr', {
        type: 'number',
        demandOption: true,
        default: process.env.GITHUB_REF,
        description: 'PR number',
        defaultDescription: 'derived from GITHUB_REF',
        coerce: cli_1.getPrNumber,
    })
        .option('startsWith', {
        type: 'string',
        demandOption: true,
        description: 'The prefix of the comment to add or update. Used to identify the comment.',
    })
        .option('fullComment', {
        type: 'string',
        description: 'The full comment to add or update.',
        conflicts: 'commentFile',
    })
        .option('commentFile', {
        type: 'string',
        description: 'The path to a file containing the comment to add or update.',
        conflicts: 'fullComment',
    })
        .option('token', {
        type: 'string',
        demandOption: true,
        default: process.env.GITHUB_TOKEN,
        description: 'The GitHub token to use when publishing.',
        defaultDescription: 'derived from the environment variable `GITHUB_TOKEN`',
    });
}
exports.GithubPrCommentModule = {
    builder,
    handler: handler_1.addOrUpdateGithubPrCommentHandler,
    command: 'github-pr-comment',
    describe: 'Add or update a comment on a GitHub PR.',
};
