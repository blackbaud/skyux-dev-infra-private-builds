"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectsPaths = void 0;
const show_project_1 = require("../utils/show-project");
async function getProjectsPaths(projects, options) {
    const result = {};
    const graph = await (0, show_project_1.showAllProjects)(options);
    for (const project of projects) {
        result[project] = `${graph[project].root}`;
    }
    return result;
}
exports.getProjectsPaths = getProjectsPaths;
