"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLibraryResources = void 0;
const fs_extra_1 = require("fs-extra");
const glob_1 = __importDefault(require("glob"));
const path_1 = require("path");
const get_publishable_projects_1 = require("../get-publishable-projects");
const git_1 = require("../utils/git");
const spawn_1 = require("../utils/spawn");
const CWD = process.cwd();
async function createLibraryResources() {
    console.log('Updating library resources files...');
    console.log('Preparing i18n schematic...');
    await (0, spawn_1.runCommand)('npx', ['nx', 'build', 'i18n']);
    await (0, spawn_1.runCommand)('npx', ['nx', 'run', 'i18n:postbuild'], {
        env: { ...process.env, NX_CLOUD_DISTRIBUTED_EXECUTION: 'false' },
    });
    console.log('Done preparing schematic.');
    const projects = await (0, get_publishable_projects_1.getPublishableProjects)();
    for (const projectName in projects) {
        const project = projects[projectName];
        const resourcesFiles = glob_1.default.sync(`${project.root}/src/assets/locales/resources_*.json`);
        if (resourcesFiles.length === 0) {
            console.log(` [!] Resource files not found for project '${projectName}'. Skipping.`);
            continue;
        }
        let isEmptyOrInvalid = false;
        try {
            const resourcesJson = (0, fs_extra_1.readJsonSync)((0, path_1.join)(CWD, resourcesFiles[0]));
            isEmptyOrInvalid = Object.keys(resourcesJson).length === 0;
        }
        catch (err) {
            isEmptyOrInvalid = true;
        }
        if (isEmptyOrInvalid) {
            console.log(` [?] Empty resources JSON found for project '${projectName}'. ` +
                'Abort generating resources module.');
            continue;
        }
        await (0, spawn_1.runCommand)('npx', [
            'nx',
            'generate',
            './dist/libs/components/i18n:lib-resources-module',
            `lib/modules/shared/sky-${projectName}`,
            `--project=${projectName}`,
        ]);
    }
    console.log('Formatting files (this might take awhile)...');
    await (0, spawn_1.runCommand)('npx', [
        'prettier',
        '--loglevel=error',
        '--write',
        'libs/**/*-resources.module.ts',
    ]);
    console.log('Done formatting files.');
    if (!(await (0, git_1.isClean)())) {
        console.warn('Changes found with resources modules. ' +
            'These changes should be committed to the remote repository.');
    }
    else {
        console.log('Done updating library resources files.');
    }
}
exports.createLibraryResources = createLibraryResources;
