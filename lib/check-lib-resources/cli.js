"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckLibraryResourcesModule = void 0;
const handler_1 = require("./handler");
function builder(argv) {
    return argv.option('projects', {
        type: 'array',
        description: 'A list of project names that should have their resources checked. If this option is omitted, resources all projects will have their resources checked.',
    });
}
exports.CheckLibraryResourcesModule = {
    builder,
    handler: handler_1.checkLibraryResources,
    command: 'check-lib-resources',
    describe: 'Confirms libraries resources modules are up-to-date with their resources strings.',
};
