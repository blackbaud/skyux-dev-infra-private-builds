"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrateModule = void 0;
const read_skyuxdev_config_1 = require("../read-skyuxdev-config");
const handler_1 = require("./handler");
async function builder(argv) {
    const skyuxConfig = await (0, read_skyuxdev_config_1.readSkyuxdevConfig)(['baseBranch']);
    return argv.config(skyuxConfig).option('baseBranch', {
        type: 'string',
        demandOption: true,
        description: 'The base branch to run the migration against.',
    });
}
exports.MigrateModule = {
    builder,
    handler: handler_1.migrate,
    command: 'migrate',
    describe: 'Migrates to the next version of Nx CLI.',
};
