"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowData = void 0;
const get_project_names_1 = require("../get-project-names/get-project-names");
async function workflowData(options) {
    const projects = await (0, get_project_names_1.getProjectNames)(['build', 'test', 'lint'], 'all', options.all ? 'all' : 'affected');
    if (projects.length === 0) {
        console.log(JSON.stringify({ projects: ['skip'] }));
    }
    else {
        const uniqueProjects = [...new Set(projects)].sort();
        console.log(JSON.stringify({ projects: uniqueProjects }));
    }
}
exports.workflowData = workflowData;
