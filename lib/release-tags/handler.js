"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.releaseTags = void 0;
const git_1 = require("../utils/git");
async function findUntaggedReleaseCommits(workingDirectory, branch) {
    await (0, git_1.fetchAll)({ workingDirectory });
    const releaseCommits = await (0, git_1.getCommitsToFile)('chore: release', branch, 'package.json');
    const releaseTags = await (0, git_1.getReleaseTags)();
    return releaseCommits.filter((commit) => commit && !releaseTags[commit]);
}
async function releaseTags(options) {
    const { workingDirectory, dryRun, remote, branch } = options;
    const verbose = dryRun || options.verbose;
    const logger = verbose ? console.log : () => { };
    const untaggedCommits = await findUntaggedReleaseCommits(workingDirectory, `${remote}/${branch}`);
    for (const untaggedCommit of untaggedCommits) {
        const version = await (0, git_1.getPackageVersionForCommit)(untaggedCommit);
        if (!version) {
            continue;
        }
        const tag = `v${version}`;
        const exists = await (0, git_1.doesThisTagExist)(tag, {
            logCommand: verbose,
        });
        if (!exists) {
            logger(`🆕🏷️ ${tag} at ${untaggedCommit}`);
            if (!dryRun) {
                await (0, git_1.createAndPushTag)(tag, untaggedCommit, options.remote, {
                    logCommand: verbose,
                });
            }
        }
    }
}
exports.releaseTags = releaseTags;
