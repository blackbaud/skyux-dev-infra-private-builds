"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPrerelease = void 0;
const semver_1 = require("semver");
/**
 * Determines if a version is a prerelease.
 * @returns `false` if not a prerelease, `true` if the prerelease group is undefined (e.g. 1.0.0-0), or the string representation of the prerelease group (e.g. 'alpha', 'beta')
 */
function isPrerelease(version) {
    const semverData = (0, semver_1.parse)(version);
    if (!semverData) {
        return;
    }
    /**
     * The semver 'prerelease' value can be an array of length 1 or 2, depending on the prerelease type.
     * For example:
     *   5.0.0-alpha.5 => ['alpha', 5]
     *   5.0.0-5 => [5]
     */
    return semverData.prerelease.length === 1
        ? 'true'
        : semverData.prerelease.length === 0
            ? undefined
            : semverData.prerelease[0];
}
exports.isPrerelease = isPrerelease;
