"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrUpdatePullRequest = exports.azLogin = void 0;
const git_1 = require("./git");
const spawn_1 = require("./spawn");
async function azLogin(config) {
    if (!process.env['AZURE_DEVOPS_EXT_PAT']) {
        await (0, spawn_1.runCommand)('az', ['account', 'list-locations', '-o', 'none'], {}, {
            logCommand: !!config?.logCommand,
        }).catch(() => {
            (0, spawn_1.runCommand)('az', ['login'], {}, {
                logCommand: !!config?.logCommand,
            });
        });
    }
}
exports.azLogin = azLogin;
async function createOrUpdatePullRequest(sourceBranch, targetBranch, title, config) {
    const options = {
        workingDirectory: process.cwd(),
        logCommand: false,
        ...config,
    };
    const repoUrlString = await (0, git_1.getRemoteUrl)({
        workingDirectory: options.workingDirectory,
        logCommand: options.logCommand,
    });
    const prJson = JSON.parse(await (0, spawn_1.getCommandOutput)(`az`, [
        `repos`,
        `pr`,
        `list`,
        `-t`,
        targetBranch,
        `-s`,
        sourceBranch,
        `-o`,
        `json`,
    ], {
        cwd: options.workingDirectory,
        stdio: 'pipe',
    }, {
        logCommand: options.logCommand,
    }).catch((err) => {
        console.error(`Error checking for PRs: ${err}`);
        throw err;
    }));
    let prLink;
    if (prJson.length === 0) {
        const newPrJson = await (0, spawn_1.getCommandOutput)(`az`, [
            `repos`,
            `pr`,
            `create`,
            `--source-branch`,
            sourceBranch,
            `--target-branch`,
            targetBranch,
            `--title`,
            title,
            `--description`,
            `Release ${targetBranch}`,
            `-o`,
            `json`,
        ], {
            cwd: options.workingDirectory,
            stdio: 'pipe',
        }, {
            logCommand: options.logCommand,
        }).catch((err) => {
            console.error(`Error creating PR: ${err}`);
            throw err;
        });
        prLink = `${repoUrlString}/pullrequest/${JSON.parse(newPrJson)['pullRequestId']}`;
    }
    else {
        prLink = `${repoUrlString}/pullrequest/${prJson[0]['pullRequestId']}`;
        if (prJson[0].title !== title) {
            await (0, spawn_1.getCommandOutput)(`az`, [
                `repos`,
                `pr`,
                `update`,
                `--title`,
                title,
                `--id`,
                prJson[0]['pullRequestId'],
            ], {
                cwd: options.workingDirectory,
                stdio: 'ignore',
            }, {
                logCommand: options.logCommand,
            }).catch((err) => {
                console.error(`Error updating PR: ${err}`);
                throw err;
            });
        }
    }
    return { prLink };
}
exports.createOrUpdatePullRequest = createOrUpdatePullRequest;
