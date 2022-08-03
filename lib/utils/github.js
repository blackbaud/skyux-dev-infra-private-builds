"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.githubPagesWait = exports.addOrUpdateGithubPrComment = exports.checkGithubPagesPublished = exports.getOpenPrNumbers = exports.getBranchBuildStatus = exports.getGithubOwnerSlashRepo = void 0;
const axios_1 = __importDefault(require("axios"));
const git_1 = require("./git");
const spawn_1 = require("./spawn");
/* istanbul ignore next */
function normalizeGithubOptions(options) {
    options = options || {};
    const httpClient = options.httpClient ||
        axios_1.default.create({
            headers: {
                Accept: 'application/vnd.github.v3+json',
            },
        });
    if (options.token) {
        httpClient.defaults.headers.common.Authorization = `token ${options.token}`;
    }
    const ownerSlashRepo = options.ownerSlashRepo || 'blackbaud/skyux';
    if (!ownerSlashRepo.match(/^[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+$/)) {
        throw new Error(`Invalid ownerSlashRepo: ${ownerSlashRepo}`);
    }
    return {
        httpClient,
        ownerSlashRepo,
    };
}
async function getGithubOwnerSlashRepo(workingDirectory, options) {
    /* istanbul ignore next */
    const getRemoteUrlCommand = options?.getRemoteUrl || git_1.getRemoteUrl;
    const remoteUrl = await getRemoteUrlCommand({ workingDirectory });
    const remoteMatch = remoteUrl.match(/^https:\/\/github\.com\/([^/]+\/[^.]+)(\.git)?$/);
    if (!remoteMatch) {
        throw new Error(`Invalid remote URL: ${remoteUrl}`);
    }
    return remoteMatch[1];
}
exports.getGithubOwnerSlashRepo = getGithubOwnerSlashRepo;
async function getBranchBuildStatus(branch, config) {
    const options = normalizeGithubOptions(config);
    console.log(`Checking build status for branch '${branch}'...`);
    const result = await options.httpClient.get(`https://api.github.com/repos/${options.ownerSlashRepo}/actions/workflows/ci.yml/runs?branch=${branch}&event=push`);
    return result.data.workflow_runs[0].status;
}
exports.getBranchBuildStatus = getBranchBuildStatus;
async function getOpenPrNumbers(config) {
    const options = normalizeGithubOptions(config);
    const result = await options.httpClient.get(`https://api.github.com/repos/${options.ownerSlashRepo}/pulls?state=open`);
    return result.data.map((pr) => pr.number.toString());
}
exports.getOpenPrNumbers = getOpenPrNumbers;
async function checkGithubPagesPublished(pagesPath, commit, config) {
    const options = normalizeGithubOptions(config);
    const result = await options.httpClient.get(`https://api.github.com/repos/${pagesPath}/pages/builds`);
    if (result.status === 200) {
        return result.data.some((build) => build.commit === commit);
    }
    else {
        return false;
    }
}
exports.checkGithubPagesPublished = checkGithubPagesPublished;
async function addOrUpdateGithubPrComment(prNumber, startingWith, fullComment, config) {
    const options = normalizeGithubOptions(config);
    const comments = await options.httpClient.get(`https://api.github.com/repos/${options.ownerSlashRepo}/issues/${prNumber}/comments`);
    const updateComment = comments.data.find((comment) => comment.body.startsWith(startingWith));
    if (updateComment) {
        await options.httpClient.patch(`https://api.github.com/repos/${options.ownerSlashRepo}/issues/comments/${updateComment.id}`, {
            body: fullComment,
        });
    }
    else {
        await options.httpClient.post(`https://api.github.com/repos/${options.ownerSlashRepo}/issues/${prNumber}/comments`, {
            body: fullComment,
        });
    }
}
exports.addOrUpdateGithubPrComment = addOrUpdateGithubPrComment;
async function githubPagesWait(workingDirectory, config) {
    if (config && config.skipWait) {
        return;
    }
    const options = normalizeGithubOptions(config);
    // Allow commands to be stubbed for testing.
    /* istanbul ignore next */
    const getLastCommitCommand = config?.getLastCommit || git_1.getLastCommit;
    /* istanbul ignore next */
    const commandRunner = config?.runCommand || spawn_1.runCommand;
    /* istanbul ignore next */
    const commitCommand = config?.commit || git_1.commit;
    /* istanbul ignore next */
    const pushCommand = config?.push || git_1.push;
    // Which commit are we waiting for?
    let latestCommit = await getLastCommitCommand({ workingDirectory });
    // Which remote are we waiting for?
    const ownerSlashRepo = await getGithubOwnerSlashRepo(workingDirectory, {
        getRemoteUrl: config?.getRemoteUrl,
    });
    let confirmed = false;
    for (let i = 1; i <= 10; i++) {
        // Pause progressively longer times between checks.
        await commandRunner('sleep', [`${20 + i * 3}`]);
        if (await checkGithubPagesPublished(ownerSlashRepo, latestCommit, {
            token: options.token,
            httpClient: options.httpClient,
        })) {
            confirmed = true;
            break;
        }
        else if (i === 7) {
            // After 7 checks, push another commit to the repo to trigger a build.
            await commitCommand({
                workingDirectory,
                message: 'Trigger rebuild',
                allowEmpty: true,
            });
            await pushCommand({ workingDirectory });
            latestCommit = await getLastCommitCommand({ workingDirectory });
        }
    }
    // After 10 checks, 365 seconds of sleep plus call times (so 6+ minutes), give up.
    if (!confirmed) {
        return Promise.reject(`Unable to verify GitHub Pages built.`);
    }
}
exports.githubPagesWait = githubPagesWait;
