"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const get_publishable_projects_1 = require("./get-publishable-projects");
jest.mock('fs-extra');
jest.mock('./get-project-names/get-project-names', () => ({
    getProjectNames: jest
        .fn()
        .mockReturnValue(Promise.resolve(['foo', 'bar', 'baz'])),
}));
jest.mock('./get-projects-paths/get-projects-paths', () => ({
    getProjectsPaths: jest.fn().mockReturnValue(Promise.resolve({
        foo: 'libs/components/foo',
        bar: 'libs/sdk/bar',
        baz: 'libs/sdk/baz',
    })),
}));
describe('get-publishable-projects', () => {
    function setupTest(config) {
        fs_extra_1.readJson.mockImplementation((filePath) => {
            const fileName = (0, path_1.basename)(filePath);
            const projectKey = filePath
                .replace((0, path_1.join)(process.cwd()), '')
                .replace(fileName, '')
                .replace(/^\//, '')
                .replace(/\/$/, '');
            switch (fileName) {
                case 'workspace.json':
                    throw new Error(`Should not rely on workspace.json`);
                case 'package.json':
                    return { name: 'MOCK_PACKAGE_NAME' };
                case 'project.json':
                    return config.projectJson[projectKey];
            }
        });
    }
    afterEach(() => {
        jest.resetAllMocks();
        jest.resetModules();
    });
    it("should return projects assigned the 'npm' tag", async () => {
        setupTest({
            projectJson: {
                'libs/components/foo': {
                    sourceRoot: 'libs/components/foo/src',
                    tags: ['component', 'npm'],
                    targets: {
                        build: {
                            options: {
                                outputPath: '{workspaceRoot}/dist/{projectRoot}',
                            },
                        },
                    },
                },
                'libs/sdk/bar': {
                    sourceRoot: 'libs/sdk/bar/src',
                    tags: ['sdk', 'npm'],
                    targets: {
                        build: {
                            outputs: ['dist/libs/sdk/bar'],
                            options: {},
                        },
                    },
                },
                'libs/sdk/baz': {
                    sourceRoot: '/',
                    targets: {},
                },
            },
        });
        const projects = await (0, get_publishable_projects_1.getPublishableProjects)();
        expect(projects).toEqual({
            bar: {
                distRoot: 'dist/libs/sdk/bar',
                npmName: 'MOCK_PACKAGE_NAME',
                root: 'libs/sdk/bar',
            },
            foo: {
                distRoot: 'dist/libs/components/foo',
                npmName: 'MOCK_PACKAGE_NAME',
                root: 'libs/components/foo',
            },
        });
    });
});
