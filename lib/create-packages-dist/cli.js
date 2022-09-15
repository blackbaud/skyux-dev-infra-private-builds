"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePackagesDistModule = void 0;
const read_skyuxdev_config_1 = require("../read-skyuxdev-config");
const handler_1 = require("./handler");
async function builder(argv) {
    const skyuxConfig = await (0, read_skyuxdev_config_1.readSkyuxdevConfig)([
        'documentationExcludeProjects',
    ]);
    return argv
        .config(skyuxConfig)
        .option('documentationExcludeProjects', {
        type: 'array',
        description: 'A list of project names that should be excluded from documentation.',
    })
        .option('projects', {
        type: 'array',
        description: 'A list of project names that should be built. If this option is omitted, all projects are built.',
    });
}
exports.CreatePackagesDistModule = {
    builder,
    handler: handler_1.createPackagesDist,
    command: 'create-packages-dist',
    describe: 'Builds and validates all distribution packages to be published to NPM.',
};
