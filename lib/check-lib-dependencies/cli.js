"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckLibraryDependenciesModule = void 0;
const handler_1 = require("./handler");
function builder(argv) {
    return argv;
}
exports.CheckLibraryDependenciesModule = {
    builder,
    handler: handler_1.checkLibraryDependencies,
    command: 'check-lib-dependencies',
    describe: 'Confirms the workspace package.json lists package versions that are satisfied by all peer dependency ranges.',
};
