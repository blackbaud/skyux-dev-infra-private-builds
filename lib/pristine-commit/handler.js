"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pristineCommit = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const git_1 = require("../utils/git");
const spawn_1 = require("../utils/spawn");
async function promptCommit(baseBranch) {
    const answer = await inquirer_1.default.prompt([
        {
            type: 'confirm',
            name: 'squash',
            message: 'This command squashes all commits in the current branch with a new commit message that you provide. ' +
                "While local changes remain intact, it rewrites the current branch's commit history. " +
                'Proceed?',
            default: true,
        },
    ]);
    if (!answer.squash) {
        console.log('Squashing aborted.');
        process.exit(0);
    }
    try {
        console.log(`Attempting to merge origin/${baseBranch} into feature branch...`);
        await (0, git_1.fetchAll)();
        await (0, spawn_1.runCommand)('git', ['merge', `origin/${baseBranch}`]);
    }
    catch (err) {
        console.log('Address any conflicts and try running the command again.');
        process.exit();
    }
    const currentBranch = await (0, git_1.getCurrentBranch)();
    const hash = await (0, spawn_1.getCommandOutput)('git', [
        'merge-base',
        `origin/${baseBranch}`,
        currentBranch,
    ]);
    await (0, spawn_1.runCommand)('git', ['reset', hash]);
    await (0, git_1.addAll)();
    await (0, spawn_1.runCommand)('npx', ['cz']);
}
async function promptPush() {
    const answer = await inquirer_1.default.prompt([
        {
            type: 'confirm',
            name: 'pushOrigin',
            message: 'Push this change to origin?',
            default: true,
        },
    ]);
    if (answer.pushOrigin) {
        const branch = await (0, git_1.getCurrentBranch)();
        await (0, spawn_1.runCommand)('git', [
            'push',
            '--force-with-lease',
            '--set-upstream',
            'origin',
            branch,
        ]);
        console.log('Commits squashed and pushed!');
    }
    else {
        console.log('Done squashing commits. Run `git push --force-with-lease` when ready.');
    }
}
async function pristineCommit(options) {
    if ((await (0, git_1.getCurrentBranch)()) === options.baseBranch) {
        throw new Error(`This command may not be executed on the '${options.baseBranch}' branch.`);
    }
    // Ensure local git is clean.
    if (!(await (0, git_1.isClean)())) {
        throw new Error('Uncommitted changes detected. Stash or commit the changes and try again.');
    }
    await promptCommit(options.baseBranch);
    await promptPush();
}
exports.pristineCommit = pristineCommit;
