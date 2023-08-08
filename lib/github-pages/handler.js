"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.githubPagesPublish = exports.githubPagesRemoveOldPrs = exports.githubPagesMirror = void 0;
const fs_1 = require("fs");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const git_1 = require("../utils/git");
const github_1 = require("../utils/github");
async function githubPagesMirror(options) {
    if (!options.fromPath || !(0, fs_extra_1.pathExistsSync)(options.fromPath)) {
        throw new Error(`Path "${options.fromPath}" does not exist`);
    }
    const destinationPath = (0, path_1.join)(options.workingDirectory, options.toPath.replace(/\/$/, ''));
    if ((0, fs_extra_1.pathExistsSync)(destinationPath)) {
        (0, fs_extra_1.rmSync)(destinationPath, { recursive: true, force: true });
    }
    if (destinationPath.includes('/')) {
        const containingPath = destinationPath.replace(/\/[^/]*$/, '');
        if (!(0, fs_extra_1.pathExistsSync)(containingPath)) {
            (0, fs_extra_1.mkdirpSync)(containingPath);
        }
    }
    (0, fs_extra_1.copySync)(options.fromPath, destinationPath, { recursive: true });
    await (0, git_1.addAll)({
        workingDirectory: options.workingDirectory,
        paths: [options.toPath],
    });
}
exports.githubPagesMirror = githubPagesMirror;
/* istanbul ignore next */
async function githubPagesRemoveOldPrs(options) {
    const prPath = (0, path_1.join)(options.workingDirectory, options.subPath);
    if (!(0, fs_extra_1.pathExistsSync)(prPath)) {
        return;
    }
    const currentBuilds = (0, fs_1.readdirSync)(prPath).filter((dir) => dir.match(/^\d+$/));
    if (currentBuilds.length === 0) {
        return;
    }
    const ownerSlashRepo = options.ownerSlashRepo || 'blackbaud/skyux';
    const currentPrs = await (0, github_1.getOpenPrNumbers)({
        httpClient: options.httpClient,
        token: options.token,
        ownerSlashRepo,
    });
    const removePrBuilds = currentBuilds
        .filter((dir) => !currentPrs.includes(dir))
        .map((dir) => (0, path_1.join)(options.subPath, dir));
    if (removePrBuilds.length > 0) {
        await (0, git_1.remove)({
            workingDirectory: options.workingDirectory,
            paths: removePrBuilds,
        });
    }
}
exports.githubPagesRemoveOldPrs = githubPagesRemoveOldPrs;
async function githubPagesPublish(options) {
    await (0, git_1.setCommitter)({
        workingDirectory: options.workingDirectory,
        name: options.commitAsName,
        email: options.commitAsEmail,
    });
    await (0, git_1.commit)({
        workingDirectory: options.workingDirectory,
        message: options.message,
        allowEmpty: true,
    });
    // Avoid conflicts with other builds by pulling first.
    await (0, git_1.pull)({
        workingDirectory: options.workingDirectory,
        rebase: true,
    });
    await (0, git_1.push)({ workingDirectory: options.workingDirectory });
    return (0, github_1.githubPagesWait)(options.workingDirectory, options);
}
exports.githubPagesPublish = githubPagesPublish;
