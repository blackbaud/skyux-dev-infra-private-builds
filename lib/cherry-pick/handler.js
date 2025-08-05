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
        await (0, spawn_1.runCommand)('git', ['rev-parse', '--verify', '--quiet', hash], {}, { quiet: true });
        const commit = await (0, spawn_1.getCommandOutput)('git', ['show', '-s', '--format=%H', hash], {}, { quiet: true });
        return commit.trim();
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
        '--format=%s',
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
function isInProgress() {
    return isValidHash('CHERRY_PICK_HEAD');
}
/**
 * Cherry-picks a commit into the current branch.
 */
async function gitCherryPick(hash) {
    try {
        const fullHash = await isValidHash(hash);
        if (!fullHash) {
            return Promise.reject(`'${hash}' is not a valid commit hash.`);
        }
        const inProgress = await isInProgress();
        if (inProgress === fullHash) {
            await (0, spawn_1.runCommand)('git', ['cherry-pick', '--continue', '--no-edit']);
        }
        else if (inProgress) {
            const inProgressShort = inProgress.substring(0, 8);
            console.log(`A cherry-pick for ${inProgressShort} is already in progress.`);
            console.log(`If you want to cancel that cherry-pick, run:`);
            console.log(' # git cherry-pick --abort');
            process.exit(1);
        }
        else {
            await (0, spawn_1.runCommand)('git', ['cherry-pick', hash]);
        }
        return { hasMergeConflicts: false };
    }
    catch (err) {
        return { hasMergeConflicts: true };
    }
}
async function cherryPick(options) {
    let hash = options.hash;
    // Ensure releases are executed against the correct branch.
    const inProgress = await isInProgress();
    if ((await (0, git_1.getCurrentBranch)()) !== options.baseBranch && !inProgress) {
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
    const isRelease = commitMessage.match(/^(Merged PR \d+: )?chore: release \d+\.\d+\.\d+/);
    const branch = inProgress
        ? await (0, git_1.getCurrentBranch)()
        : await checkoutNewBranch(hash);
    if (isRelease) {
        // For a release, we only want to cherry-pick the changelog changes, and we want to modify the commit message.
        await (0, spawn_1.runCommand)(process.env['SHELL'] || 'sh', [
            '-c',
            `git diff ${hash}~1..${hash} --patch --unified=0 -- CHANGELOG.md | git apply --unidiff-zero -`,
        ]);
        await (0, spawn_1.runCommand)('git', ['add', 'CHANGELOG.md']);
        await (0, spawn_1.runCommand)('git', [
            'commit',
            '-m',
            `${commitMessage
                .replace(/^Merged PR \d+: /, '')
                .replace('release', 'changelog for')} 🍒`,
        ]);
    }
    else {
        const result = await gitCherryPick(hash);
        const mergeCommit = commitMessage.match(/^Merged PR (\d+): /);
        if (mergeCommit) {
            // Remove the ADO merge commit message.
            await (0, spawn_1.runCommand)('git', [
                'commit',
                '--amend',
                '-m',
                `${commitMessage.replace(/^Merged PR \d+: /, '')} (!${mergeCommit[1]})`,
            ]);
        }
        if (result.hasMergeConflicts) {
            console.log([
                '',
                'Done creating cherry-pick branch. After reviewing the changes and resolving conflicts, run the following:',
                `---`,
                'git add .',
                `npx skyux-dev cherry-pick --hash=${hash} --skip-confirmation`,
                '---',
                '',
            ].join(process.platform === 'win32' ? '\r\n' : '\n'));
            throw new Error('Merge conflicts detected.');
        }
    }
    console.log('\nDone creating cherry-pick branch. After reviewing the changes, run the following:\n' +
        '---\n' +
        `git push --set-upstream origin ${branch}\n` +
        '---\n');
}
exports.cherryPick = cherryPick;
