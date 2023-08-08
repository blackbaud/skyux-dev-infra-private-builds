"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const get_project_names_1 = require("./get-project-names");
jest.mock('../utils/spawn', () => ({
    getCommandOutput: jest.fn().mockReturnValue(Promise.resolve('')),
}));
describe('get-project-names', () => {
    it('should getProjectNames', async () => {
        const result = await (0, get_project_names_1.getProjectNames)('build', 'app', 'affected', {
            getCommandOutput: jest
                .fn()
                .mockReturnValue(Promise.resolve('project1, project2')),
        });
        expect(result).toEqual(['project1', 'project2']);
        const resultAll = await (0, get_project_names_1.getProjectNames)(['build'], 'app', 'all', {
            getCommandOutput: jest
                .fn()
                .mockReturnValue(Promise.resolve('project1, project2')),
        });
        expect(resultAll).toEqual(['project1', 'project2']);
    });
});
