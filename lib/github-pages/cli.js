"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubPagesPublishModule = exports.GithubPagesRemoveOldPrsModule = exports.GithubPagesMirrorModule = void 0;
const handler_1 = require("./handler");
async function githubPagesMirrorBuilder(argv) {
    return argv
        .option('workingDirectory', {
        type: 'string',
        demandOption: true,
        description: 'The path to a working copy of the GitHub Pages repository.',
    })
        .option('fromPath', {
        type: 'string',
        demandOption: true,
        description: 'The source path to copy from.',
    })
        .option('toPath', {
        type: 'string',
        demandOption: true,
        description: 'The destination path to copy to, relative to the workingDirectory.',
    });
}
async function githubPagesRemoveOldPrsBuilder(argv) {
    return argv
        .option('workingDirectory', {
        type: 'string',
        demandOption: true,
        description: 'The path to a working copy of the GitHub Pages repository.',
    })
        .option('subPath', {
        type: 'string',
        demandOption: true,
        description: 'The path relative to the workingDirectory that contains PR-number directories.',
    })
        .option('token', {
        type: 'string',
        demandOption: true,
        default: process.env.GIHUB_TOKEN,
        description: 'The GitHub token to use when publishing.',
        defaultDescription: 'derived from the environment variable `GITHUB_TOKEN`',
    });
}
async function githubPagesPublishBuilder(argv) {
    return argv
        .option('workingDirectory', {
        type: 'string',
        demandOption: true,
        description: 'The path to a working copy of the GitHub Pages repository.',
    })
        .option('githubPagesRepo', {
        type: 'string',
        demandOption: true,
        description: 'The `owner/repo` for the GitHub Pages repository.',
    })
        .option('message', {
        type: 'string',
        demandOption: true,
        description: 'The commit message to use when publishing.',
    })
        .option('token', {
        type: 'string',
        demandOption: true,
        default: process.env.GIHUB_TOKEN,
        description: 'The GitHub token to use when publishing.',
        defaultDescription: 'derived from the environment variable `GITHUB_TOKEN`',
    })
        .option('commitAsName', {
        type: 'string',
        hidden: true,
    })
        .option('commitAsEmail', {
        type: 'string',
        hidden: true,
    });
}
exports.GithubPagesMirrorModule = {
    builder: githubPagesMirrorBuilder,
    handler: handler_1.githubPagesMirror,
    command: 'github-pages-mirror',
    describe: 'Mirror the contents of a dist folder to a GitHub Pages repository.',
};
exports.GithubPagesRemoveOldPrsModule = {
    builder: githubPagesRemoveOldPrsBuilder,
    handler: handler_1.githubPagesRemoveOldPrs,
    command: 'github-pages-remove-old-prs',
    describe: 'Remove directories from a GitHub Pages repository for PRs that are no longer open.',
};
exports.GithubPagesPublishModule = {
    builder: githubPagesPublishBuilder,
    handler: handler_1.githubPagesPublish,
    command: 'github-pages-publish',
    describe: 'Publish changes to GitHub Pages and confirm the build step.',
};
