"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPublishedPackages = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const get_publishable_projects_1 = require("../get-publishable-projects");
const dist_tag_1 = require("../utils/dist-tag");
const npm_1 = require("../utils/npm");
const CWD = process.cwd();
async function checkPublishedPackages(options) {
    const { version } = await (0, fs_extra_1.readJson)((0, path_1.join)(CWD, 'package.json'));
    // Since all SKY UX packages share the same version, arbitrarily choose one to get the version.
    const versions = await (0, npm_1.getVersions)(options.packageNameUsedToDetermineDistTags);
    const npmPublishTag = (0, dist_tag_1.getDistTag)(version, versions);
    const distPackages = await (0, get_publishable_projects_1.getPublishableProjects)();
    if (Object.keys(distPackages).length === 0) {
        return Promise.reject('No publishable packages found.');
    }
    for (const projectName in distPackages) {
        const packageName = distPackages[projectName].npmName;
        if (!packageName) {
            return Promise.reject(`No npm name for '${projectName}'.`);
        }
        const currentVersion = await (0, npm_1.getVersion)(`${packageName}@${npmPublishTag}`);
        const alreadyPublished = currentVersion === version;
        if (alreadyPublished) {
            console.log(`✅ ${packageName}`);
        }
        else {
            console.log(`❌ ${packageName} — ${packageName}@${npmPublishTag} is ${currentVersion} but expected ${version}`);
        }
    }
}
exports.checkPublishedPackages = checkPublishedPackages;
