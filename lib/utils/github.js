"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBranchBuildStatus = void 0;
const axios_1 = __importDefault(require("axios"));
async function getBranchBuildStatus(branch) {
    console.log(`Checking build status for branch '${branch}'...`);
    const result = await (0, axios_1.default)(`https://api.github.com/repos/blackbaud/skyux/actions/workflows/ci.yml/runs?branch=${branch}&event=push`);
    return result.data.workflow_runs[0].status;
}
exports.getBranchBuildStatus = getBranchBuildStatus;
