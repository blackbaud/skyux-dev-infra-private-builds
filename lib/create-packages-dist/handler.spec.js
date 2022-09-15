"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const get_publishable_projects_1 = require("../get-publishable-projects");
const spawn_1 = require("../utils/spawn");
const handler_1 = require("./handler");
jest.mock('fs-extra');
jest.mock('typedoc');
jest.mock('../get-publishable-projects');
jest.mock('../utils/npm');
jest.mock('../utils/spawn');
describe('create-packages-dist', () => {
    const defaultProjectsConfig = {
        core: {
            distRoot: 'dist/libs/components/core',
            root: '',
        },
        indicators: {
            distRoot: 'dist/libs/components/indicators',
            root: '',
        },
    };
    let originalProcessEnv;
    function setupTest(options) {
        const settings = {
            ...{
                version: '6.0.0',
            },
            ...options,
        };
        jest.resetAllMocks();
        jest.resetModules();
        originalProcessEnv = process.env;
        process.env = {
            NPM_TOKEN: 'foobar-token',
        };
        jest.spyOn(console, 'log').mockImplementation(() => {
            return;
        });
        jest.spyOn(console, 'warn').mockImplementation(() => {
            return;
        });
        fs_extra_1.emptyDir.mockImplementation(() => {
            return;
        });
        get_publishable_projects_1.getPublishableProjects.mockReturnValueOnce(settings.projects);
        fs_extra_1.readJson.mockReturnValue({
            name: '@skyux',
            version: settings.version,
            dependencies: [],
        });
        fs_extra_1.readFile.mockReturnValue({
            toString: () => {
                return '{}';
            },
        });
        return {
            emptyDirMock: fs_extra_1.emptyDir,
            runCommandMock: spawn_1.runCommand,
        };
    }
    afterEach(() => {
        process.env = originalProcessEnv;
    });
    it('should only create the dist for certain projects if a project list is specified', async () => {
        const { emptyDirMock, runCommandMock } = setupTest({
            projects: defaultProjectsConfig,
        });
        await (0, handler_1.createPackagesDist)({ projects: ['indicators'] });
        expect(emptyDirMock).toHaveBeenCalledTimes(1);
        expect(runCommandMock).toHaveBeenCalledWith('npx', [
            'nx',
            'run-many',
            '--target=build',
            '--projects=indicators',
            '--parallel',
            '--maxParallel=2',
        ], {
            stdio: 'inherit',
        });
        expect(runCommandMock).toHaveBeenCalledWith('npx', [
            'nx',
            'run-many',
            '--target=postbuild',
            '--projects=indicators',
            '--parallel',
            '--maxParallel=2',
        ], {
            stdio: 'inherit',
            env: { ...process.env, NX_CLOUD_DISTRIBUTED_EXECUTION: 'false' },
        });
    });
    it('should create the dist all projects if a project list is not specified', async () => {
        const { emptyDirMock, runCommandMock } = setupTest({
            projects: defaultProjectsConfig,
        });
        await (0, handler_1.createPackagesDist)({});
        expect(emptyDirMock).toHaveBeenCalledTimes(1);
        expect(runCommandMock).toHaveBeenCalledWith('npx', [
            'nx',
            'run-many',
            '--target=build',
            '--projects=core,indicators',
            '--parallel',
            '--maxParallel=2',
        ], {
            stdio: 'inherit',
        });
        expect(runCommandMock).toHaveBeenCalledWith('npx', [
            'nx',
            'run-many',
            '--target=postbuild',
            '--projects=core,indicators',
            '--parallel',
            '--maxParallel=2',
        ], {
            stdio: 'inherit',
            env: { ...process.env, NX_CLOUD_DISTRIBUTED_EXECUTION: 'false' },
        });
    });
});
