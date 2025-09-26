"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReleaseNotesModule = void 0;
const handler_1 = require("./handler");
async function builder(argv) {
    return argv
        .option('workingDirectory', {
        type: 'string',
        default: process.cwd(),
        hidden: true,
        description: 'The path to a working copy.',
    })
        .option('releaseName', {
        type: 'string',
        demandOption: true,
        description: 'The version name to find in the changelog.',
    });
}
exports.ReleaseNotesModule = {
    builder,
    handler: handler_1.releaseNotes,
    command: 'release-notes',
    describe: 'Verify release tags and push missing tags to the repository.',
};
