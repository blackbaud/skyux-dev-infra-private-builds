"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.release = void 0;
const fs_extra_1 = require("fs-extra");
const handler_1 = require("../release-tags/handler");
const azure_cli_1 = require("../utils/azure-cli");
const git_1 = require("../utils/git");
const spawn_1 = require("../utils/spawn");
async function release(options) {
    const { allowDirty, branch, remote, verbose, workingDirectory } = options;
    let dryRun = options.dryRun;
    await (0, git_1.fetchAll)({ workingDirectory, logCommand: verbose });
    const noChanges = await (0, git_1.isClean)({ workingDirectory, logCommand: verbose });
    dryRun ||= !noChanges;
    if (!noChanges && !allowDirty) {
        throw new Error('Working tree is dirty. Use --allowDirty to proceed.');
    }
    if (!dryRun) {
        await (0, handler_1.releaseTags)(options);
    }
    const releaseBranch = `release--${branch}`;
    const remoteExists = await (0, git_1.doesThisRefExist)(`refs/remotes/${remote}/${releaseBranch}`, {
        workingDirectory,
        logCommand: verbose,
    });
    if (!noChanges) {
        // Minimal reset for release files.
        const version = await (0, git_1.getPackageVersionForCommit)(`${remote}/${branch}`, {
            workingDirectory,
            logCommand: verbose,
        });
        if (!version) {
            throw new Error('No version found in package.json');
        }
        const pkg = await (0, fs_extra_1.readJson)(`${workingDirectory}/package.json`);
        pkg.version = version;
        await (0, fs_extra_1.writeJson)(`${workingDirectory}/package.json`, pkg, { spaces: 2 });
        await (0, git_1.resetFilesToCommit)(['CHANGELOG.md'], `${remote}/${branch}`, {
            workingDirectory,
            logCommand: verbose,
        });
    }
    else if (remoteExists) {
        await (0, git_1.checkoutNewBranch)(releaseBranch, {
            workingDirectory,
            fromBranch: `${remote}/${releaseBranch}`,
            force: true,
            logCommand: verbose,
        });
        await (0, git_1.mergeTheirChanges)(`${remote}/${branch}`, {
            workingDirectory,
            logCommand: verbose,
        });
        await (0, git_1.resetFilesToCommit)(['package.json', 'package-lock.json', 'CHANGELOG.md'], `${remote}/${branch}`, {
            workingDirectory,
            logCommand: verbose,
        });
    }
    else {
        await (0, git_1.checkoutNewBranch)(releaseBranch, {
            workingDirectory,
            fromBranch: `${remote}/${branch}`,
            force: true,
            logCommand: verbose,
        });
    }
    await (0, spawn_1.runCommand)('npx', ['commit-and-tag-version', '--skip.commit'], {
        cwd: workingDirectory,
    });
    await (0, git_1.addAll)({ workingDirectory, logCommand: verbose });
    const noChangesAfterBump = await (0, git_1.isClean)({
        workingDirectory,
        logCommand: verbose,
    });
    const remoteDiff = remoteExists
        ? await (0, git_1.getDiffNumbersForStagedChanges)([], `${remote}/${branch}`, {
            workingDirectory,
            logCommand: verbose,
        })
        : { added: 0, removed: 0 };
    const changelogDiff = await (0, git_1.getDiffNumbersForStagedChanges)(['CHANGELOG.md'], 'HEAD', {
        workingDirectory,
        logCommand: verbose,
    });
    if (verbose) {
        console.log('Remote diff:', remoteDiff);
        console.log('Changelog diff:', changelogDiff);
    }
    if (noChangesAfterBump &&
        remoteDiff.added === 0 &&
        remoteDiff.removed === 0) {
        // Release branch is up to date.
        console.log('No new changes to release. Exiting.');
        return;
    }
    if (remoteDiff.added === 0 &&
        remoteDiff.removed === 0 &&
        changelogDiff.added < 5 &&
        changelogDiff.removed === 0) {
        // Changelog only has boilerplate changes.
        console.log('No changes to release. Exiting.');
        return;
    }
    const { version } = await (0, fs_extra_1.readJson)(`${workingDirectory}/package.json`);
    const title = `chore: release ${version}`;
    if (dryRun) {
        console.log('Dry run complete. Changes have been staged.');
    }
    else {
        if (!noChangesAfterBump) {
            await (0, git_1.setCommitter)({ workingDirectory, logCommand: verbose });
            await (0, git_1.commit)({
                message: title,
                workingDirectory,
                logCommand: verbose,
            });
        }
        await (0, git_1.push)({
            branch: releaseBranch,
            remote,
            workingDirectory,
            logCommand: verbose,
        });
        await (0, azure_cli_1.azLogin)();
        const { prLink } = await (0, azure_cli_1.createOrUpdatePullRequest)(releaseBranch, branch, title, { workingDirectory, logCommand: verbose });
        console.log(`\n 📦 ${title}\n 🔗 ${prLink}\n`);
    }
}
exports.release = release;
