"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const spawn_1 = require("./spawn");
describe('spawn', () => {
    it('should handle non-zero exit codes', async () => {
        await expect((0, spawn_1.runCommand)('touch', ['/non/existent/file'], { stdio: 'ignore' })).rejects.toThrow('');
    });
    it('should handle error events', async () => {
        await expect((0, spawn_1.runCommand)('invalidCommandNameThatCannotBeSpawned', undefined, {
            stdio: 'ignore',
        })).rejects.toThrow('');
    });
    it('should getCommandOutput', async () => {
        expect(await (0, spawn_1.getCommandOutput)('date')).toBeTruthy();
    });
});
