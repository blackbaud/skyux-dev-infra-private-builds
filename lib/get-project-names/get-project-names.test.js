"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const get_project_names_1 = require("./get-project-names");
jest.mock('../utils/spawn', () => ({
    getCommandOutput: jest.fn().mockReturnValue(Promise.resolve('')),
}));
describe('get-project-names', () => {
    it('should getProjectNames', async () => {
        const result = await (0, get_project_names_1.getProjectNames)('build', 'app', 'affected', {
            getCommandOutput: jest.fn((command, args) => {
                expect(command).toEqual('npx');
                expect(args[0]).toEqual('nx');
                if (args.slice(1, 3).join(' ') === 'show projects') {
                    return Promise.resolve(`project1\nproject2\nproject3`);
                }
                else if (args[1] === 'graph') {
                    return Promise.resolve(JSON.stringify({
                        graph: {
                            nodes: {
                                project1: {
                                    data: {
                                        projectType: 'application',
                                    },
                                },
                                project2: {
                                    data: {
                                        projectType: 'application',
                                    },
                                },
                                project3: {
                                    data: {
                                        projectType: 'library',
                                    },
                                },
                            },
                        },
                    }));
                }
                else {
                    throw new Error(`Unexpected command ${command} ${args.join(' ')}`);
                }
            }),
        });
        expect(result).toEqual(['project1', 'project2']);
        const resultAll = await (0, get_project_names_1.getProjectNames)(['build'], 'all', 'all', {
            getCommandOutput: jest
                .fn()
                .mockReturnValue(Promise.resolve(`project1\nproject2`)),
        });
        expect(resultAll).toEqual(['project1', 'project2']);
    });
});
