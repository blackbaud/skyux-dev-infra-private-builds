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
async function buildI18nLibrary() {
    console.log('Preparing i18n schematic...');
    await (0, spawn_1.runCommand)('npx', ['nx', 'build', 'i18n']);
    await (0, spawn_1.runCommand)('npx', ['nx', 'run', 'i18n:postbuild'], {
        env: { ...process.env, NX_CLOUD_DISTRIBUTED_EXECUTION: 'false' },
    });
    console.log('Done preparing schematic.');
}
async function createLibraryResources(argv) {
    if (argv.projects) {
        console.log(`Updating library resources files for [${argv.projects.join(', ')}]...`);
    }
    else {
        console.log('Updating library resources files for all libraries...');
    }
    const projects = await (0, get_publishable_projects_1.getPublishableProjects)();
    const isI18nLocalProject = projects['i18n'];
    if (isI18nLocalProject) {
        await buildI18nLibrary();
    }
    const projectNames = (argv.projects || Object.keys(projects));
    if (!projectNames || projectNames.length === 0) {
        throw new Error('No projects found.');
    }
    for (const projectName of projectNames) {
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
        const i18nPath = isI18nLocalProject
            ? './dist/libs/components/i18n'
            : '@skyux/i18n';
        await (0, spawn_1.runCommand)('npx', [
            'nx',
            'generate',
            `${i18nPath}:lib-resources-module`,
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
