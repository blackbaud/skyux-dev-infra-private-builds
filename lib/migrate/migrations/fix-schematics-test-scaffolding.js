"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixSchematicsTestScaffolding = void 0;
const fs_extra_1 = require("fs-extra");
const glob_1 = __importDefault(require("glob"));
const path_1 = require("path");
async function fixSchematicsTestScaffolding() {
    const testFiles = glob_1.default.sync('**/testing/scaffold.ts', { nodir: true });
    for (const testFile of testFiles) {
        const filePath = (0, path_1.join)(process.cwd(), testFile);
        let contents = (await (0, fs_extra_1.readFile)(filePath)).toString();
        contents = contents
            .replace(/version: '12'/g, "version: '13'")
            .replace(/legacyBrowsers: true,/, '');
        await (0, fs_extra_1.writeFile)(filePath, contents);
    }
}
exports.fixSchematicsTestScaffolding = fixSchematicsTestScaffolding;
