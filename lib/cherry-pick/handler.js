"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cherryPick = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const git_1 = require("../utils/git");
const spawn_1 = require("../utils/spawn");
async function promptContinue() {
    return inquirer_1.default.prompt([
        {
            type: 'confirm',
            name: 'cherryPick',
            message: 'This command will cherry-pick a commit into a new branch. Proceed?',
            default: true,
        },
    ]);
}
async function promptHash() {
    return inquirer_1.default.prompt([
        {
            type: 'input',
            name: 'commitHash',
            message: 'Which commit hash should be cherry-picked?',
        },
    ]);
}
async function isValidHash(hash) {
    try {
        await (0, spawn_1.runCommand)('git', ['cat-file', 'commit', hash], {
            stdio: 'pipe',
        });
        return true;
    }
    catch (err) {
        return false;
    }
}
/**
 * Returns the commit message of a given commit hash.
 */
async function getCommitMessageFromHash(hash) {
    const commitMessage = await (0, spawn_1.getCommandOutput)('git', [
        'show',
        '-s',
        '--format=%B',
        hash,
    ]);
    console.log(`Hash found with message: "${commitMessage}"\n`);
    return commitMessage;
}
/**
 * Generates and returns the new cherry-pick branch.
 */
async function checkoutNewBranch(hash) {
    console.log(`Using hash '${hash}' to generate cherry-pick branch...`);
    const branch = `cherry-pick_${hash}_${new Date().getTime()}`;
    await (0, spawn_1.runCommand)('git', ['checkout', '-b', branch]);
    return branch;
}
/**
 * Cherry-picks a commit into the current branch.
 */
async function gitCherryPick(hash) {
    try {
        await (0, spawn_1.runCommand)('git', ['cherry-pick', hash]);
        return { hasMergeConflicts: false };
    }
    catch (err) {
        return { hasMergeConflicts: true };
    }
}
/**
 * Continues a cherry-pick after resolving merge conflicts.
 */
async function gitCherryPickContinue() {
    try {
        await (0, spawn_1.runCommand)('git', [
            '-c',
            'core.editor=echo',
            'cherry-pick',
            '--continue',
        ]);
        return { hasMergeConflicts: false };
    }
    catch (err) {
        return { hasMergeConflicts: true };
    }
}
async function cherryPick(options) {
    let hash = options.hash;
    // Ensure releases are executed against the correct branch.
    if ((await (0, git_1.getCurrentBranch)()) !== options.baseBranch) {
        throw new Error(`Cherry-picked commits can only be applied to the '${options.baseBranch}' branch. ` +
            'Checkout that branch and try again.');
    }
    if (!options.skipConfirmation) {
        const answer1 = await promptContinue();
        if (!answer1.cherryPick) {
            console.log('Cherry-pick aborted.');
            process.exit();
        }
    }
    if (!hash) {
        const answer2 = await promptHash();
        hash = answer2.commitHash;
    }
    if (!(await isValidHash(hash))) {
        throw new Error(`The hash '${hash}' is not a valid commit hash.`);
    }
    const commitMessage = await getCommitMessageFromHash(hash);
    const isRelease = commitMessage.match(/^chore: release \d+\.\d+\.\d+/);
    const branch = await checkoutNewBranch(hash);
    let result = await gitCherryPick(hash);
    if (isRelease && result.hasMergeConflicts) {
        await (0, spawn_1.runCommand)('git', [
            'checkout',
            options.baseBranch,
            '--',
            'package.json',
            'package-lock.json',
        ]);
        await (0, spawn_1.runCommand)('git', ['add', 'CHANGELOG.md']);
        result = await gitCherryPickContinue();
    }
    if (result.hasMergeConflicts) {
        console.log('\nDone creating cherry-pick branch. After reviewing the changes and resolving conflicts, run the following:\n' +
            '---\n' +
            'git add .\n' +
            `git commit -m "${commitMessage}"\n` +
            '---\n');
        throw new Error('Merge conflicts detected.');
    }
    else {
        console.log('\nDone creating cherry-pick branch. After reviewing the changes, run the following:\n' +
            '---\n' +
            `git push --set-upstream origin ${branch}\n` +
            '---\n');
    }
}
exports.cherryPick = cherryPick;
