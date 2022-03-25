"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckLibraryMissingPeersModule = void 0;
const handler_1 = require("./handler");
function builder(argv) {
    return argv.option('fix', {
        type: 'boolean',
        default: false,
        description: "Add or remove peer dependencies found (or not found) in the library's source code.",
    });
}
exports.CheckLibraryMissingPeersModule = {
    builder,
    handler: handler_1.checkLibraryMissingPeers,
    command: 'check-lib-missing-peers',
    describe: 'Finds any unlisted peer dependencies that are used in the source code.',
};
