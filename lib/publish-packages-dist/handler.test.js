"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const get_publishable_projects_1 = require("../get-publishable-projects");
const npm_1 = require("../utils/npm");
const spawn_1 = require("../utils/spawn");
const handler_1 = require("./handler");
jest.mock('fs-extra');
jest.mock('../get-publishable-projects');
jest.mock('../utils/npm');
jest.mock('../utils/spawn');
describe('public-packages-dist', () => {
    let originalProcessEnv;
    function setupTest(options) {
        const settings = {
            ...{
                distDirectoryExists: true,
            },
            ...options,
        };
        jest.resetAllMocks();
        jest.resetModules();
        originalProcessEnv = process.env;
        process.env = {
            NPM_TOKEN: 'foobar-token',
        };
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        jest.spyOn(console, 'log').mockImplementation(() => { });
        fs_extra_1.existsSync.mockReturnValueOnce(settings.distDirectoryExists);
        npm_1.getDistTags.mockReturnValueOnce(settings.npmDistTags);
        get_publishable_projects_1.getPublishableProjects.mockReturnValueOnce(settings.projects);
        fs_extra_1.readJson.mockReturnValueOnce({
            version: settings.version,
        });
        return {
            existsSyncMock: fs_extra_1.existsSync,
            getDistTagsMock: npm_1.getDistTags,
            getPublishableProjectsMock: get_publishable_projects_1.getPublishableProjects,
            runCommandMock: spawn_1.runCommand,
            readJsonMock: fs_extra_1.readJson,
        };
    }
    function verifyNpmDistTag(runCommandMock, tag) {
        expect(runCommandMock).toHaveBeenCalledWith('npm', ['publish', '--access', 'public', '--tag', tag], {
            cwd: (0, path_1.join)(process.cwd(), '/dist/libs/components/core'),
            stdio: 'inherit',
        });
    }
    afterEach(() => {
        process.env = originalProcessEnv;
    });
    it("should run 'npm publish'", async () => {
        const { runCommandMock } = setupTest({
            distDirectoryExists: true,
            npmDistTags: {
                next: '2.0.0-beta.0',
                latest: '1.2.0',
            },
            projects: {
                core: {
                    distRoot: 'dist/libs/components/core',
                },
            },
            version: '1.2.1',
        });
        await (0, handler_1.publishPackagesDist)({});
        verifyNpmDistTag(runCommandMock, 'latest');
    });
    it("should set tag to 'next' for prereleases", async () => {
        const { runCommandMock } = setupTest({
            distDirectoryExists: true,
            npmDistTags: {
                next: '2.0.0-beta.0',
                latest: '1.2.0',
            },
            projects: {
                core: {
                    distRoot: 'dist/libs/components/core',
                },
            },
            version: '2.0.0-beta.1',
        });
        await (0, handler_1.publishPackagesDist)({});
        verifyNpmDistTag(runCommandMock, 'next');
    });
    it("should set tag to 'lts-v*' for major versions older than the 'latest'", async () => {
        const { runCommandMock } = setupTest({
            distDirectoryExists: true,
            npmDistTags: {
                next: '3.0.0-0',
                latest: '2.0.0',
            },
            projects: {
                core: {
                    distRoot: 'dist/libs/components/core',
                },
            },
            version: '1.3.0',
        });
        await (0, handler_1.publishPackagesDist)({});
        verifyNpmDistTag(runCommandMock, 'lts-v1');
    });
    it("should set tag to 'lts-v*-next' for prerelease versions older than the 'next'", async () => {
        const { runCommandMock } = setupTest({
            distDirectoryExists: true,
            npmDistTags: {
                next: '3.0.0-0',
                latest: '2.0.0',
            },
            projects: {
                core: {
                    distRoot: 'dist/libs/components/core',
                },
            },
            version: '2.0.0-rc.0',
        });
        await (0, handler_1.publishPackagesDist)({});
        verifyNpmDistTag(runCommandMock, 'lts-v2-next');
    });
    it('should throw an error if process.env.NPM_TOKEN not defined', async () => {
        setupTest({});
        delete process.env.NPM_TOKEN;
        await expect((0, handler_1.publishPackagesDist)({})).rejects.toThrow('Environment variable "NPM_TOKEN" not set! Abort publishing to NPM.');
    });
    it('should throw error if dist directory not found', async () => {
        setupTest({
            distDirectoryExists: false,
            npmDistTags: {
                next: '3.0.0-0',
                latest: '2.0.0',
            },
            projects: {
                core: {
                    distRoot: 'dist/libs/components/core',
                },
            },
            version: '2.0.0-rc.0',
        });
        await expect((0, handler_1.publishPackagesDist)({})).rejects.toThrow(`Path '${(0, path_1.join)(process.cwd(), 'dist/libs/components/core')}' does not exist. Did you run 'skyux-dev create-packages-dist'?`);
    });
    it("should set tag to 'lts-v*' for major versions older than the 'latest'", async () => {
        const { runCommandMock } = setupTest({
            distDirectoryExists: true,
            npmDistTags: {
                next: '6.0.0-beta.9',
                latest: '6.14.1',
            },
            projects: {
                core: {
                    distRoot: 'dist/libs/components/core',
                },
            },
            version: '7.0.0-alpha.0',
        });
        await (0, handler_1.publishPackagesDist)({
            dryRun: true,
        });
        expect(runCommandMock.mock.lastCall[1]).toEqual([
            'publish',
            '--access',
            'public',
            '--tag',
            'next',
            '--dry-run',
        ]);
    });
});
