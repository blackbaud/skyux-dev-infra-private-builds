"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkLibraryDependencies = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const get_publishable_projects_1 = require("../get-publishable-projects");
const verify_library_dependencies_1 = require("../verify-library-dependencies");
const CWD = process.cwd();
async function checkLibraryDependencies() {
    const distPackages = await (0, get_publishable_projects_1.getPublishableProjects)();
    const packageJson = await (0, fs_extra_1.readJson)((0, path_1.join)(CWD, 'package.json'));
    await (0, verify_library_dependencies_1.verifyLibraryDependencies)(distPackages, packageJson);
}
exports.checkLibraryDependencies = checkLibraryDependencies;
