"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs"));
const cli_1 = require("./cli");
const handler_1 = require("./handler");
describe('e2e-workflow', () => {
    it('should show help', async () => {
        // Check that the help is correct, dropping the "bin" prefix because that varies with the test environment.
        expect(await (0, yargs_1.default)([`${cli_1.E2eWorkflowModule.command}`])
            .scriptName('skyux-dev')
            .command(cli_1.E2eWorkflowModule)
            .getHelp()).toMatchSnapshot();
    });
    it('should get e2e workflow for pr', async () => {
        const logSpy = jest.spyOn(console, 'log');
        const getCommandOutput = jest
            .fn()
            .mockReturnValue(Promise.resolve('project1, project2'));
        await (0, handler_1.getE2eWorkflow)({
            workflowTrigger: 'pull_request',
            pr: 123,
            getCommandOutput,
        });
        expect(getCommandOutput).toHaveBeenCalled();
        expect(getCommandOutput.mock.lastCall[1].includes('--all')).toBeFalsy();
        expect(logSpy.mock.lastCall).toMatchSnapshot();
        expect(logSpy.mock.lastCall[0]).not.toContain(`\n`); // Make sure the JSON is on one line.
    });
    it('should get e2e workflow for pr with no storybooks', async () => {
        const logSpy = jest.spyOn(console, 'log');
        const getCommandOutput = jest.fn().mockReturnValue(Promise.resolve(''));
        await (0, handler_1.getE2eWorkflow)({
            workflowTrigger: 'pull_request',
            pr: 123,
            getCommandOutput,
        });
        expect(getCommandOutput).toHaveBeenCalled();
        expect(getCommandOutput.mock.lastCall[1].includes('--all')).toBeFalsy();
        expect(logSpy.mock.lastCall).toMatchSnapshot();
        expect(logSpy.mock.lastCall[0]).not.toContain(`\n`); // Make sure the JSON is on one line.
    });
    it('should get e2e workflow for branch', async () => {
        const logSpy = jest.spyOn(console, 'log');
        const getCommandOutput = jest
            .fn()
            .mockReturnValue(Promise.resolve('project1, project2, project3'));
        await (0, handler_1.getE2eWorkflow)({
            workflowTrigger: 'push',
            branch: 'main',
            getCommandOutput,
        });
        expect(getCommandOutput).toHaveBeenCalled();
        expect(getCommandOutput.mock.lastCall[1].includes('--all')).toBeTruthy();
        expect(logSpy.mock.lastCall).toMatchSnapshot();
        expect(logSpy.mock.lastCall[0]).not.toContain(`\n`); // Make sure the JSON is on one line.
    });
    it('should throw errors', async () => {
        jest.spyOn(console, 'log');
        const getCommandOutput = jest.fn();
        await expect((0, handler_1.getE2eWorkflow)({
            workflowTrigger: 'push',
            branch: '',
            getCommandOutput,
        })).rejects.toThrowError('--branch is required for push triggers');
        await expect((0, handler_1.getE2eWorkflow)({
            workflowTrigger: 'pull_request',
            getCommandOutput,
        })).rejects.toThrowError('--pr is required for pull_request triggers');
        expect(getCommandOutput).not.toHaveBeenCalled();
    });
    it('should get the pr number', () => {
        expect((0, cli_1.getPrNumber)('2345')).toBe(2345);
        expect((0, cli_1.getPrNumber)('refs/pull/2345/merge')).toBe(2345);
        expect((0, cli_1.getPrNumber)(undefined)).toBe(0);
        expect((0, cli_1.getPrNumber)('')).toBe(0);
    });
    it('should get the workflow event', () => {
        // This method is make sure the event works with type checking.
        expect((0, cli_1.getWorkflowEvent)('pull_request')).toBe('pull_request');
        expect((0, cli_1.getWorkflowEvent)('push')).toBe('push');
    });
});
