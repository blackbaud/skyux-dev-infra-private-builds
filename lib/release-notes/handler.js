"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.releaseNotes = exports.getChangelogEntry = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
function getChangelogEntry(releaseName, workingDirectory) {
    const changelog = node_fs_1.default.readFileSync(node_path_1.default.join(workingDirectory, 'CHANGELOG.md'), 'utf-8');
    // Release entries start with `# [version]` or `## [version]`.
    let start = changelog.indexOf(`# [${releaseName}]`);
    if (start === -1) {
        throw new Error(`Release ${releaseName} not found in CHANGELOG.md`);
    }
    if (changelog.charAt(start - 1) === '#') {
        start--;
    }
    let end = changelog.indexOf('# [', start + releaseName.length + 3);
    if (end > 1 && changelog.charAt(end - 1) === '#') {
        end--;
    }
    return changelog
        .slice(start, end === -1 ? undefined : end)
        .toString()
        .trim();
}
exports.getChangelogEntry = getChangelogEntry;
async function releaseNotes(options) {
    const changelog = getChangelogEntry(options.releaseName, options.workingDirectory);
    console.log(changelog.trim());
}
exports.releaseNotes = releaseNotes;
