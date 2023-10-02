"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDistTag = void 0;
const semver_1 = __importDefault(require("semver"));
function getDistTag(version, publishedVersions) {
    if (!version) {
        throw new Error(`Unable to determine version.`);
    }
    if (!publishedVersions) {
        throw new Error(`Unable to determine published versions.`);
    }
    const semverData = semver_1.default.parse(version);
    const isPrerelease = semverData ? semverData.prerelease.length > 0 : false;
    const majorVersion = semverData?.major;
    if (!majorVersion) {
        throw new Error(`Unable to determine major version from '${version}'.`);
    }
    // Since all SKY UX packages share the same version, arbitrarily choose one to get the version.
    let versions = [...publishedVersions];
    if (!isPrerelease) {
        versions = versions.filter((v) => !semver_1.default.prerelease(v));
    }
    versions.sort(semver_1.default.compare);
    const latestVersion = versions.pop();
    if (!latestVersion) {
        throw new Error(`Unable to determine latest published version.`);
    }
    const isLatestVersion = semver_1.default.gte(version, latestVersion);
    let npmPublishTag = `lts-v${majorVersion}`;
    if (isPrerelease) {
        if (isLatestVersion) {
            npmPublishTag = 'next';
        }
        else {
            npmPublishTag += '-next';
        }
    }
    else {
        if (isLatestVersion) {
            npmPublishTag = 'latest';
        }
    }
    return npmPublishTag;
}
exports.getDistTag = getDistTag;
