"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const get_projects_paths_1 = require("./get-projects-paths");
describe('get-projects-paths', () => {
    it('should getProjectsPaths', async () => {
        const result = await (0, get_projects_paths_1.getProjectsPaths)(['project1', 'project2'], {
            getCommandOutput: (command, args) => {
                expect(command).toEqual('npx');
                expect(args.slice(0, 3)).toEqual(['nx', 'show', 'project']);
                return Promise.resolve(JSON.stringify({
                    root: `libs/${args[3]}`,
                }));
            },
        });
        expect(result).toEqual({
            project1: 'libs/project1',
            project2: 'libs/project2',
        });
    });
});
