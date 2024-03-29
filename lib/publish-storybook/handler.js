"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishStorybook = void 0;
const fs_1 = require("fs");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const handler_1 = require("../github-pages/handler");
const git_1 = require("../utils/git");
const github_1 = require("../utils/github");
const spawn_1 = require("../utils/spawn");
async function publishStorybook(options) {
    if (!options.pr && !options.branch) {
        throw new Error('Either "pr" or "branch" must be specified');
    }
    if (!options.ownerSlashRepo) {
        options.ownerSlashRepo = await (0, github_1.getGithubOwnerSlashRepo)(options.workingDirectory);
    }
    const storybooks = (0, fs_1.readdirSync)((0, path_1.join)('dist', 'storybooks'));
    /* istanbul ignore next */
    const commandRunner = options.runCommand
        ? options.runCommand
        : (command, args) => (0, spawn_1.runCommand)(command, args, {}, { logCommand: true }).catch((error) => {
            console.error(error);
            throw error;
        });
    let storybookPath;
    let storybooksBuildPath;
    let storybooksPath;
    let commitMessage;
    let githubPagesRepo;
    const sha = await (0, git_1.getLastCommit)({ logCommand: true });
    if (options.pr) {
        // If there are builds in dist/apps, get the list of apps.
        const apps = (0, fs_extra_1.existsSync)((0, path_1.join)('dist', 'apps'))
            ? (0, fs_1.readdirSync)((0, path_1.join)('dist', 'apps'))
            : [];
        // Copy the PR Storybooks to publish to e.g.
        // Composition: https://blackbaud.github.io/skyux-pr-preview/314/storybook/
        // Each component: https://blackbaud.github.io/skyux-pr-preview/314/storybooks/indicators-storybook/
        storybookPath = (0, path_1.join)(`${options.pr}`, 'storybook');
        storybooksPath = (0, path_1.join)(`${options.pr}`, 'storybooks');
        storybooksBuildPath = 'storybooks';
        commitMessage = `skyux #${options.pr} ${sha.substring(0, 8)}`;
        githubPagesRepo = `skyux-pr-preview`;
        const prCommentCommand = [
            'nx',
            'g',
            '@skyux-sdk/e2e-schematics:pr-comment',
            `--storybooks=${storybooks.join(',')}`,
            `--pr=${options.pr}`,
        ];
        if (apps.length > 0) {
            prCommentCommand.push(`--apps=${apps.join(',')}`);
        }
        await commandRunner('npx', prCommentCommand);
        (0, fs_extra_1.copySync)((0, path_1.join)('dist', 'README.md'), (0, path_1.join)(options.workingDirectory, `${options.pr}`, 'README.md'), { overwrite: true });
        // spawnSync('echo', [`Removed old PRs`], { stdio: 'inherit' });
        await (0, handler_1.githubPagesRemoveOldPrs)({
            workingDirectory: options.workingDirectory,
            subPath: `/storybooks/${options.pr}`,
            httpClient: options.httpClient,
            token: options.token,
        });
        // If there are apps, copy each app to its folder in PR preview.
        for (const app of apps) {
            await (0, handler_1.githubPagesMirror)({
                workingDirectory: options.workingDirectory,
                fromPath: (0, path_1.join)('dist', 'apps', app),
                toPath: (0, path_1.join)(`${options.pr}`, app),
            });
        }
    }
    else {
        // Copy the branch Storybooks to publish to e.g.
        // Composition: https://blackbaud.github.io/skyux-storybook/main/
        // Each component: https://blackbaud.github.io/skyux-storybook/storybooks/main/indicators-storybook/
        storybookPath = (0, path_1.join)(`${options.branch}`);
        storybooksPath = (0, path_1.join)('storybooks', `${options.branch}`);
        storybooksBuildPath = (0, path_1.join)('storybooks', `${options.branch}`);
        commitMessage = `skyux ${options.branch} ${sha.substring(0, 8)}`;
        githubPagesRepo = `skyux-storybook`;
    }
    await (0, handler_1.githubPagesMirror)({
        workingDirectory: options.workingDirectory,
        fromPath: (0, path_1.join)('dist', 'storybook'),
        toPath: storybookPath,
    });
    await (0, handler_1.githubPagesMirror)({
        workingDirectory: options.workingDirectory,
        fromPath: (0, path_1.join)('dist', storybooksBuildPath),
        toPath: storybooksPath,
    });
    // spawnSync('echo', [`Publish pages`], { stdio: 'inherit' });
    await (0, handler_1.githubPagesPublish)({
        workingDirectory: options.workingDirectory,
        message: commitMessage,
        githubPagesRepo,
        token: options.token,
        httpClient: options.httpClient,
        wait: options.wait,
    });
    if (options.pr) {
        // spawnSync('echo', [`Comment`], { stdio: 'inherit' });
        await (0, github_1.addOrUpdateGithubPrComment)(options.pr, '[Storybook preview]', (0, fs_1.readFileSync)((0, path_1.join)('dist', 'pr_comment.md')).toString(), {
            token: options.token,
            ownerSlashRepo: `blackbaud/skyux`,
            httpClient: options.httpClient,
        });
    }
}
exports.publishStorybook = publishStorybook;
