"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixEslintNumericService = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const FIX = `/*eslint no-loss-of-precision: "warn"*/
/*eslint @typescript-eslint/no-loss-of-precision: "warn"*/
`;
async function fixEslintNumericService() {
    const filePath = (0, path_1.join)(process.cwd(), 'libs/components/core/src/lib/modules/numeric/numeric.service.spec.ts');
    await (0, fs_extra_1.writeFile)(filePath, FIX + (await (0, fs_extra_1.readFile)(filePath)).toString());
}
exports.fixEslintNumericService = fixEslintNumericService;
