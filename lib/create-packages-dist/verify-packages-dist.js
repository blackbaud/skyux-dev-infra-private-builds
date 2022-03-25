"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPackagesDist = void 0;
const verify_library_dependencies_1 = require("../verify-library-dependencies");
async function verifyPackagesDist(projects, workspacePackageJson) {
    await (0, verify_library_dependencies_1.verifyLibraryDependencies)(projects, workspacePackageJson);
}
exports.verifyPackagesDist = verifyPackagesDist;
