"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateReleaseModule = void 0;
const read_skyuxdev_config_1 = require("../read-skyuxdev-config");
const handler_1 = require("./handler");
async function builder(argv) {
    const skyuxConfig = await (0, read_skyuxdev_config_1.readSkyuxdevConfig)([
        'baseBranch',
        'allowedSemverRange',
    ]);
    return argv
        .config(skyuxConfig)
        .option('baseBranch', {
        type: 'string',
        demandOption: true,
        description: 'The branch that includes the commits to generate release notes.',
    })
        .option('allowedSemverRange', {
        type: 'string',
        demandOption: true,
        description: 'The semantic versioning range allowed for the version bump. ' +
            'If the next version is not satisfied by this range, an error is thrown.',
    });
}
exports.CreateReleaseModule = {
    builder,
    handler: handler_1.createRelease,
    command: 'create-release',
    describe: 'Generates a tag and release notes for the next version of SKY UX.',
};
