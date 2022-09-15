"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readSkyuxdevConfig = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const CWD = process.cwd();
const CONFIG_FILE_NAME = '.skyuxdev.json';
const CONFIG_FILE_PATH = (0, path_1.join)(CWD, CONFIG_FILE_NAME);
/**
 * Reads the local .skyuxdev.json file and retrieves wanted values.
 * @param wanted An array of keys you want to extract from the config.
 */
async function readSkyuxdevConfig(wanted) {
    if (!(0, fs_extra_1.existsSync)(CONFIG_FILE_PATH)) {
        throw new Error(`\n [!] A configuration file named '${CONFIG_FILE_NAME}' was expected but not found.\n`);
    }
    const config = await (0, fs_extra_1.readJson)(CONFIG_FILE_PATH);
    const partial = {};
    for (const key of wanted) {
        const value = config[key];
        if (value) {
            partial[key] = value;
        }
    }
    return partial;
}
exports.readSkyuxdevConfig = readSkyuxdevConfig;
