"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isClean = exports.getCurrentBranch = exports.fetchAll = exports.checkoutNewBranch = exports.addAll = void 0;
const spawn_1 = require("./spawn");
async function addAll() {
    await (0, spawn_1.runCommand)('git', ['add', '.']);
}
exports.addAll = addAll;
async function checkoutNewBranch(branch) {
    const result = await (0, spawn_1.getCommandOutput)('git', ['branch', '--list', branch]);
    if (result) {
        throw new Error(`The branch "${branch}" already exists. Aborting.`);
    }
    await (0, spawn_1.runCommand)('git', ['checkout', '-b', branch]);
}
exports.checkoutNewBranch = checkoutNewBranch;
async function fetchAll() {
    return (0, spawn_1.getCommandOutput)('git', ['fetch', '--all']);
}
exports.fetchAll = fetchAll;
async function getCurrentBranch() {
    return (0, spawn_1.getCommandOutput)('git', ['branch', '--show-current']);
}
exports.getCurrentBranch = getCurrentBranch;
async function isClean(config) {
    let options = {
        compareAgainstRemote: false,
    };
    if (config) {
        options = { ...options, ...config };
    }
    // Fetch any upstream changes before getting the status.
    if (options.compareAgainstRemote) {
        await fetchAll();
    }
    const result = await (0, spawn_1.getCommandOutput)('git', ['status']);
    let isClean = result.includes('nothing to commit, working tree clean');
    if (isClean && options.compareAgainstRemote) {
        isClean = result.includes('Your branch is up to date');
    }
    return isClean;
}
exports.isClean = isClean;
