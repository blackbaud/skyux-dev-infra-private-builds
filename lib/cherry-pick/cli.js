"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CherryPickModule = void 0;
const handler_1 = require("./handler");
async function builder(argv) {
    return argv.option('hash', {
        type: 'string',
        description: 'The hash of the commit to cherry-pick.',
    });
}
exports.CherryPickModule = {
    builder,
    handler: handler_1.cherryPick,
    command: 'cherry-pick',
    describe: 'Cherry-picks a commit into a new branch.',
};
