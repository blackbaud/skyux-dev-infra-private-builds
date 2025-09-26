"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReleaseModule = void 0;
const read_skyuxdev_config_1 = require("../read-skyuxdev-config");
const handler_1 = require("./handler");
async function builder(argv) {
    const skyuxConfig = await (0, read_skyuxdev_config_1.readSkyuxdevConfig)(['baseBranch', 'releaseBranch'], true);
    return argv
        .option('workingDirectory', {
        type: 'string',
        default: process.cwd(),
        hidden: true,
        description: 'The path to a working copy.',
    })
        .option('branch', {
        type: 'string',
        default: skyuxConfig.baseBranch,
        demandOption: true,
        description: 'The base branch to release.',
    })
        .option('releaseBranch', {
        type: 'string',
        default: skyuxConfig.releaseBranch,
        description: 'The name of the release branch.',
    })
        .option('remote', {
        type: 'string',
        default: 'origin',
        description: 'The name of the remote repository.',
    })
        .option('allowDirty', {
        type: 'boolean',
        default: false,
        description: 'Keep working tree changes.',
    })
        .option('dryRun', {
        type: 'boolean',
        default: false,
        description: 'Do not create or push tags.',
    })
        .option('verbose', {
        type: 'boolean',
        default: false,
        description: 'Log more.',
    });
}
exports.ReleaseModule = {
    builder,
    handler: handler_1.release,
    command: 'release',
    describe: 'Create a release branch and open a pull request, or update an existing release branch.',
};
