"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixCrossvent = void 0;
const fs_extra_1 = require("fs-extra");
const glob_1 = require("glob");
const path_1 = require("path");
const REPLACEMENT = `declare const require: any;

// Fix for crossvent "global is not defined" error. The crossvent library
// is used by Dragula, which in turn is used by multiple SKY UX components.
// See: https://github.com/bevacqua/dragula/issues/602
(window as any).global = window;`;
async function fixCrossvent() {
    const testFiles = glob_1.glob.sync('**/test.ts', { nodir: true });
    for (const testFile of testFiles) {
        const filePath = (0, path_1.join)(process.cwd(), testFile);
        let contents = (await (0, fs_extra_1.readFile)(filePath)).toString();
        contents = contents.replace('declare const require: any;', REPLACEMENT);
        await (0, fs_extra_1.writeFile)(filePath, contents);
    }
}
exports.fixCrossvent = fixCrossvent;
