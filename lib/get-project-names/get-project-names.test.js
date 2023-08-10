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
                expect(args.slice(0, 2)).toEqual(['nx', 'show']);
                if (args[2] === 'projects') {
                    return Promise.resolve(`project1\nproject2\nproject3`);
                }
                else if (args[2] === 'project') {
                    return Promise.resolve(JSON.stringify({
                        projectType: args[3] !== 'project3' ? 'application' : 'library',
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
