"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkLibraryResources = void 0;
const handler_1 = require("../create-lib-resources/handler");
const git_1 = require("../utils/git");
async function checkLibraryResources() {
    console.log('Checking library resources...');
    await (0, handler_1.createLibraryResources)({});
    if (!(await (0, git_1.isClean)())) {
        throw new Error('Library resources modules are not up-to-date! Run the following to regenerate all library resources modules:\n' +
            '---\n' +
            ' npx skyux-dev create-lib-resources\n' +
            '---\n');
    }
    else {
        console.log('Library resources are up-to-date. OK.');
    }
}
exports.checkLibraryResources = checkLibraryResources;
