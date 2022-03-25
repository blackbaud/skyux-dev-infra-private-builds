"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishPackagesDistModule = void 0;
const handler_1 = require("./handler");
function builder(argv) {
    return argv;
}
exports.PublishPackagesDistModule = {
    builder,
    handler: handler_1.publishPackagesDist,
    command: 'publish-packages-dist',
    describe: 'Publishes the contents of the dist folder to NPM.',
};
