"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.releaseVersion = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const semver_1 = require("semver");
const git_1 = require("../utils/git");
async function releaseVersion(options) {
    const version = JSON.parse(await (0, git_1.getContentAtCommit)('package.json', `${options.remote}/${options.branch}`, { workingDirectory: options.workingDirectory }).catch(() => '{}')).version;
    const releaseAs = (await (0, fs_extra_1.readJson)((0, path_1.join)(options.workingDirectory, '.versionrc')).catch(() => ({}))).releaseAs;
    if (version && releaseAs && (0, semver_1.gt)(releaseAs, version)) {
        return console.log(releaseAs);
    }
    const currentPrerelease = (0, semver_1.prerelease)(version)?.slice();
    const versionObj = (0, semver_1.coerce)(version);
    if (currentPrerelease && versionObj) {
        if (Number.isInteger(currentPrerelease[1])) {
            // If the second prerelease segment is a number, increment it.
            currentPrerelease[1] = Number(currentPrerelease[1]) + 1;
        }
        else {
            // Otherwise, append a new segment.
            currentPrerelease.push(0);
        }
        return console.log(`${versionObj.version}-${currentPrerelease.join('.')}`);
    }
}
exports.releaseVersion = releaseVersion;
