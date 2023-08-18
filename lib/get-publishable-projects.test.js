"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const get_publishable_projects_1 = require("./get-publishable-projects");
const show_project_1 = require("./utils/show-project");
jest.mock('fs-extra');
jest.mock('./get-project-names/get-project-names', () => ({
    getProjectNames: jest
        .fn()
        .mockReturnValue(Promise.resolve(['foo', 'bar', 'baz'])),
}));
jest.mock('./utils/show-project');
describe('get-publishable-projects', () => {
    function setupTest(config) {
        show_project_1.showProject.mockImplementation((projectName) => {
            const projectKey = Object.keys(config.projectJson).find((key) => key.endsWith(`/${projectName}`));
            if (projectKey) {
                return {
                    projectType: 'library',
                    ...(config.projectJson[projectKey] || {}),
                };
            }
            else {
                throw Error(`Unable to show ${projectName}`);
            }
        });
        fs_extra_1.readJson.mockImplementation((filePath) => {
            const fileName = (0, path_1.basename)(filePath);
            switch (fileName) {
                case 'workspace.json':
                    throw new Error(`Should not rely on workspace.json`);
                case 'package.json':
                    return { name: 'MOCK_PACKAGE_NAME' };
                case 'project.json':
                    throw new Error(`Should not rely on project.json`);
                default:
                    throw new Error(`Unexpected file ${filePath}`);
            }
        });
    }
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
