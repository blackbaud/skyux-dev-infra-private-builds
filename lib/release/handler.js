"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.release = void 0;
const fs_extra_1 = require("fs-extra");
const handler_1 = require("../release-notes/handler");
const handler_2 = require("../release-tags/handler");
const azure_cli_1 = require("../utils/azure-cli");
const git_1 = require("../utils/git");
const github_1 = require("../utils/github");
const spawn_1 = require("../utils/spawn");
function fixChangeLog(changelog, mostRecentTag, previousVersion) {
    const newChangelog = changelog.replaceAll('https://github.com/blackbaud/AB/issues/', 'https://dev.azure.com/blackbaud/Products/_workitems/edit/');
    if (mostRecentTag !== previousVersion) {
        // Escape regex metacharacters in mostRecentTag
        const escapedMostRecentTag = mostRecentTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Find URLs containing mostRecentTag
        const regex = new RegExp(`https://\\S+(${escapedMostRecentTag})\\S*`, 'g');
        return newChangelog.replace(regex, (url) => {
            // Replace mostRecentTag with previousVersion in the URL
            return url.replace(mostRecentTag, previousVersion);
        });
    }
    return newChangelog;
}
async function getMostRecentTag(tagPrefix) {
    const releaseTags = await (0, git_1.getReleaseTags)(tagPrefix);
    return Object.values(releaseTags).shift();
}
async function release(options) {
    const { allowDirty, branch, releaseBranch, remote, verbose, workingDirectory, } = options;
    let dryRun = options.dryRun;
    await (0, git_1.fetchAll)({ workingDirectory, logCommand: verbose });
    const noChanges = await (0, git_1.isClean)({ workingDirectory, logCommand: verbose });
    dryRun ||= !noChanges;
    if (!noChanges && !allowDirty) {
        throw new Error('Working tree is dirty. Use --allowDirty to proceed.');
    }
    await (0, git_1.setCommitter)({ workingDirectory, logCommand: verbose });
    if (!dryRun &&
        (await (0, git_1.isAzureDevOps)({ workingDirectory, logCommand: verbose }))) {
        await (0, handler_2.releaseTags)(options);
    }
    const releaseBranchName = (releaseBranch ?? 'release--{baseBranch}').replace(`{baseBranch}`, branch);
    const remoteExists = await (0, git_1.doesThisRefExist)(`refs/remotes/${remote}/${releaseBranchName}`, {
        workingDirectory,
        logCommand: verbose,
    });
    const previousVersion = await (0, git_1.getPackageVersionForCommit)(`${remote}/${branch}`, {
        workingDirectory,
        logCommand: verbose,
    });
    if (!previousVersion) {
        throw new Error('No version found in package.json');
    }
    const tagPrefix = (await (0, git_1.isGitHub)({ workingDirectory, logCommand: verbose }))
        ? ''
        : 'v';
    const previousTag = `refs/tags/${tagPrefix}${previousVersion}`;
    // Validate that previousTag exists before using it
    const previousTagExists = await (0, git_1.doesThisRefExist)(previousTag, {
        workingDirectory,
        logCommand: verbose,
    });
    if (!previousTagExists) {
        throw new Error(`Previous release tag ${previousTag} not found`);
    }
    const changelogChangesSincePreviousTag = await (0, git_1.getUniDiff)(`${previousTag}..HEAD`, 'CHANGELOG.md', { workingDirectory, logCommand: verbose });
    if (dryRun) {
        // Minimal reset for release files.
        const pkg = await (0, fs_extra_1.readJson)(`${workingDirectory}/package.json`);
        pkg.version = previousVersion;
        await (0, fs_extra_1.writeJson)(`${workingDirectory}/package.json`, pkg, { spaces: 2 });
        await (0, git_1.resetFilesToCommit)(['CHANGELOG.md'], previousTag, {
            workingDirectory,
            logCommand: verbose,
        });
    }
    else if (remoteExists) {
        await (0, git_1.checkoutNewBranch)(releaseBranchName, {
            workingDirectory,
            fromBranch: `${remote}/${releaseBranchName}`,
            force: true,
            logCommand: verbose,
        });
        await (0, git_1.mergeTheirChanges)(`${remote}/${branch}`, {
            workingDirectory,
            logCommand: verbose,
        });
        await (0, git_1.resetFilesToCommit)(['package.json', 'package-lock.json', 'CHANGELOG.md'], previousTag, {
            workingDirectory,
            logCommand: verbose,
        });
    }
    else {
        await (0, git_1.checkoutNewBranch)(releaseBranchName, {
            workingDirectory,
            fromBranch: `${remote}/${branch}`,
            force: true,
            logCommand: verbose,
        });
    }
    await (0, spawn_1.runCommand)('npx', ['commit-and-tag-version', '--skip.commit', `--tag-prefix=${tagPrefix}`], {
        cwd: workingDirectory,
    });
    const changelogChanges = await (0, git_1.getUniDiff)(previousTag, 'CHANGELOG.md', {
        workingDirectory,
        logCommand: verbose,
    });
    await (0, git_1.resetFilesToCommit)(['CHANGELOG.md'], previousTag, {
        workingDirectory,
        logCommand: verbose,
    });
    if (changelogChangesSincePreviousTag) {
        // If there were changelog changes since the previous tag, such as cherry-picked changelog entries, add them back below the new changes.
        await (0, git_1.applyUniDiff)(changelogChangesSincePreviousTag, {
            workingDirectory,
            logCommand: verbose,
        });
    }
    const mostRecentTag = (await getMostRecentTag(tagPrefix)) ?? previousVersion;
    await (0, git_1.applyUniDiff)(fixChangeLog(changelogChanges, mostRecentTag, previousVersion), {
        workingDirectory,
        logCommand: verbose,
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
    /* istanbul ignore next */
    if (verbose) {
        console.log('Remote diff:', remoteDiff);
    }
    if (noChangesAfterBump &&
        remoteDiff.added === 0 &&
        remoteDiff.removed === 0) {
        // Release branch is up to date.
        console.log('No new changes to release. Exiting.');
        return;
    }
    const { version } = await (0, fs_extra_1.readJson)(`${workingDirectory}/package.json`);
    const title = `chore: release ${version}`;
    const changelogEntry = (0, handler_1.getChangelogEntry)(version, options.workingDirectory);
    if (remoteDiff.added === 0 &&
        remoteDiff.removed === 0 &&
        !changelogEntry.includes(`\n`)) {
        // Changelog only has boilerplate changes.
        console.log('No changes to release. Exiting.');
        return;
    }
    if (dryRun) {
        console.log('Dry run complete. Changes have been staged.');
    }
    else {
        if (!noChangesAfterBump) {
            await (0, git_1.commit)({
                message: title,
                workingDirectory,
                logCommand: verbose,
            });
        }
        await (0, git_1.push)({
            branch: releaseBranchName,
            remote,
            workingDirectory,
            logCommand: verbose,
        });
        if (await (0, git_1.isAzureDevOps)({ workingDirectory, logCommand: verbose })) {
            await (0, azure_cli_1.azLogin)();
            const { prLink } = await (0, azure_cli_1.createOrUpdatePullRequest)(releaseBranchName, branch, title, changelogEntry, { workingDirectory, logCommand: verbose });
            console.log(`\n 📦 ${title}\n 🔗 ${prLink}\n`);
        }
        if (await (0, git_1.isGitHub)({ workingDirectory, logCommand: verbose })) {
            const { prLink } = await (0, github_1.githubCreateOrUpdatePullRequest)(releaseBranchName, branch, title, changelogEntry, { workingDirectory, logCommand: verbose });
            console.log(`\n 📦 ${title}\n 🔗 ${prLink}\n`);
        }
    }
    await (0, git_1.unsetCommitter)({ workingDirectory, logCommand: verbose });
}
exports.release = release;
