"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckPublishedPackagesDistModule = void 0;
const read_skyuxdev_config_1 = require("../read-skyuxdev-config");
const handler_1 = require("./handler");
async function builder(argv) {
    const skyuxConfig = await (0, read_skyuxdev_config_1.readSkyuxdevConfig)([
        'packageNameUsedToDetermineDistTags',
    ]);
    return argv.config(skyuxConfig).option('packageNameUsedToDetermineDistTags', {
        type: 'string',
        default: '@skyux/core',
        description: 'The name of a published package whose version is used to determine the next version\'s NPM publish "dist" tags.',
    });
}
exports.CheckPublishedPackagesDistModule = {
    builder,
    handler: handler_1.checkPublishedPackages,
    command: 'check-published-packages',
    describe: 'Verifies NPM registry for expected published packages.',
};
