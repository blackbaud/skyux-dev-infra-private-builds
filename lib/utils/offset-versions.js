"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOffsetVersions = void 0;
const semver_1 = require("semver");
function getOffsetVersions(offsetPackageVersions, baseVersion) {
    const version = (0, semver_1.parse)(baseVersion);
    if (!version) {
        throw new Error(`Unable to determine version.`);
    }
    const { major, minor, patch, prerelease } = version;
    return Object.fromEntries(Object.entries(offsetPackageVersions)
        .filter(([key, value]) => key.match(/^0\.0\.0-[A-Z][-_A-Z]*[A-Z]_PLACEHOLDER$/) &&
        `${value}`.match(/^-?\d*([.]\d*){0,2}$/))
        .map(([key, value]) => {
        const [offsetMajor, offsetMinor] = `${value}.`.split('.').map(Number);
        return [
            key,
            `${major + offsetMajor}.${minor + offsetMinor}.${patch}${prerelease.length > 0 ? `-${prerelease.join('.')}` : ''}`,
        ];
    }));
}
exports.getOffsetVersions = getOffsetVersions;
