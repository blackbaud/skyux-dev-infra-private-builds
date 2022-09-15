"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishPackagesDistModule = void 0;
const handler_1 = require("./handler");
function builder(argv) {
    return argv.option('dryRun', {
        type: 'boolean',
        default: false,
        description: 'Do not publish the packages and only report what it would have done.',
    });
}
exports.PublishPackagesDistModule = {
    builder,
    handler: handler_1.publishPackagesDist,
    command: 'publish-packages-dist',
    describe: 'Publishes the contents of the dist folder to NPM.',
};
