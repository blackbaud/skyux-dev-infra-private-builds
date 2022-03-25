"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckLibraryResourcesModule = void 0;
const handler_1 = require("./handler");
function builder(argv) {
    return argv;
}
exports.CheckLibraryResourcesModule = {
    builder,
    handler: handler_1.checkLibraryResources,
    command: 'check-lib-resources',
    describe: 'Confirms libraries resources modules are up-to-date with their resources strings.',
};
