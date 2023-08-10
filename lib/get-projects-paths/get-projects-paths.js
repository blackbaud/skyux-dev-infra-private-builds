"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectsPaths = void 0;
const show_project_1 = require("../utils/show-project");
async function getProjectsPaths(projects, options) {
    const result = {};
    for (const project of projects) {
        await (0, show_project_1.showProject)(project, options)
            .then((projectInfo) => {
            result[project] = projectInfo['root'];
        })
            .catch(
        /* istanbul ignore next */
        (err) => {
            throw err;
        });
    }
    return result;
}
exports.getProjectsPaths = getProjectsPaths;
