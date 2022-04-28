"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CherryPickModule = void 0;
const read_skyuxdev_config_1 = require("../read-skyuxdev-config");
const handler_1 = require("./handler");
async function builder(argv) {
    const skyuxConfig = await (0, read_skyuxdev_config_1.readSkyuxdevConfig)(['baseBranch']);
    return argv
        .config(skyuxConfig)
        .option('baseBranch', {
        type: 'string',
        demandOption: true,
        description: 'The branch to apply the cherry-pick.',
    })
        .option('hash', {
        type: 'string',
        description: 'The hash of the commit to cherry-pick.',
    });
}
exports.CherryPickModule = {
    builder,
    handler: handler_1.cherryPick,
    command: 'cherry-pick',
    describe: 'Cherry-picks a commit into a new branch.',
};
