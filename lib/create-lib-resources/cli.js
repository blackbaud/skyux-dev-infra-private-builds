"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateLibraryResourcesModule = void 0;
const handler_1 = require("./handler");
function builder(argv) {
    return argv.option('projects', {
        type: 'array',
        description: 'A list of project names that resources should be created for. If this option is omitted, resources will be created for all projects.',
    });
}
exports.CreateLibraryResourcesModule = {
    builder,
    handler: handler_1.createLibraryResources,
    command: 'create-lib-resources',
    describe: 'Creates resources modules for all libraries.',
};
