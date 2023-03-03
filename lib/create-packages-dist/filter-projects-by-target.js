"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterProjectsByTarget = void 0;
const get_project_names_1 = require("../get-project-names/get-project-names");
/**
 * Filters an array of project names if they have defined a given target in
 * their project.json file.
 */
async function filterProjectsByTarget(projects, target) {
    return (0, get_project_names_1.getProjectNames)(target, 'all', 'all').then((projectNames) => projects.filter((project) => projectNames.includes(project)));
}
exports.filterProjectsByTarget = filterProjectsByTarget;
