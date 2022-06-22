"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const get_publishable_projects_1 = require("./get-publishable-projects");
jest.mock('fs-extra');
describe('get-publishable-projects', () => {
    function setupTest(mockAngularJson) {
        fs_extra_1.readJson.mockImplementation((filePath) => {
            const fileName = (0, path_1.basename)(filePath);
            switch (fileName) {
                case 'angular.json':
                    return mockAngularJson;
                default:
                    return { name: 'MOCK_PACKAGE_NAME' };
            }
        });
    }
    afterEach(() => {
        jest.resetAllMocks();
        jest.resetModules();
    });
    it("should return projects assigned the 'npm' tag", async () => {
        setupTest({
            projects: {
                foo: {
                    root: 'libs/components/foo',
                    tags: ['component', 'npm'],
                    architect: {
                        build: {
                            options: {
                                outputPath: 'dist/libs/components/foo',
                            },
                        },
                    },
                },
                bar: {
                    root: 'libs/sdk/bar',
                    tags: ['sdk', 'npm'],
                    architect: {
                        build: {
                            outputs: ['dist/libs/sdk/bar'],
                            options: {},
                        },
                    },
                },
                baz: {
                    root: '/',
                    architect: {},
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
