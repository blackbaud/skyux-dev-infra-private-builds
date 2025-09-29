"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishPackagesDistModule = void 0;
const read_skyuxdev_config_1 = require("../read-skyuxdev-config");
const handler_1 = require("./handler");
async function builder(argv) {
    const skyuxConfig = await (0, read_skyuxdev_config_1.readSkyuxdevConfig)([
        'expectedRegistryUrl',
        'packageNameUsedToDetermineDistTags',
        'offsetPackageVersions',
    ]);
    return argv
        .parserConfiguration({
        'dot-notation': false,
    })
        .config(skyuxConfig)
        .option('dryRun', {
        type: 'boolean',
        default: false,
        description: `Do not publish the packages and only report what it would have done.`,
    })
        .option('firstRun', {
        type: 'boolean',
        default: false,
        description: `Do not expect to find any published versions of the package.`,
    })
        .option('packageNameUsedToDetermineDistTags', {
        type: 'string',
        default: '@skyux/core',
        description: `The name of a published package whose version is used to determine the next version's NPM publish "dist" tags.`,
    })
        .option('expectedRegistryUrl', {
        type: 'string',
        default: skyuxConfig.expectedRegistryUrl ?? 'https://registry.npmjs.org/',
        description: `The expected NPM registry to which packages will be published.`,
    })
        .option('skipRegistryConfig', {
        type: 'boolean',
        default: false,
        description: `Assume that the NPM registry is already configured with a token and do not attempt to set it.`,
    })
        .option('offsetPackageVersions', {});
}
exports.PublishPackagesDistModule = {
    builder,
    handler: handler_1.publishPackagesDist,
    command: 'publish-packages-dist',
    describe: 'Publishes the contents of the dist folder to NPM.',
};
