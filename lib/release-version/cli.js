"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReleaseVersionModule = void 0;
const read_skyuxdev_config_1 = require("../read-skyuxdev-config");
const handler_1 = require("./handler");
async function builder(argv) {
    const skyuxConfig = await (0, read_skyuxdev_config_1.readSkyuxdevConfig)(['baseBranch'], true);
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
        description: 'The name of the release branch.',
    })
        .option('remote', {
        type: 'string',
        default: 'origin',
        description: 'The name of the remote repository.',
    })
        .option('verbose', {
        type: 'boolean',
        default: false,
        description: 'Log more.',
    });
}
exports.ReleaseVersionModule = {
    builder,
    handler: handler_1.releaseVersion,
    command: 'release-version',
    describe: 'Find the next version for a release branch.',
};
