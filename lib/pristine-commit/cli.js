"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PristineCommitModule = void 0;
const read_skyuxdev_config_1 = require("../read-skyuxdev-config");
const handler_1 = require("./handler");
async function builder(argv) {
    const skyuxConfig = await (0, read_skyuxdev_config_1.readSkyuxdevConfig)(['baseBranch']);
    return argv.config(skyuxConfig).option('baseBranch', {
        type: 'string',
        demandOption: true,
        description: 'The base branch of the repo.',
    });
}
exports.PristineCommitModule = {
    builder,
    handler: handler_1.pristineCommit,
    command: 'pristine-commit',
    describe: 'This command squashes all commits in the current branch with a new commit message that you provide.',
};
