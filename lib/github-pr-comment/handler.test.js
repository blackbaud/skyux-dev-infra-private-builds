"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const os_1 = __importDefault(require("os"));
const path_1 = require("path");
const yargs_1 = __importDefault(require("yargs"));
const cli_1 = require("./cli");
const handler_1 = require("./handler");
describe('github-pr-comment', () => {
    let client;
    beforeEach(() => {
        client = {
            defaults: {
                headers: {
                    common: {},
                    options: {},
                    head: {},
                    get: {},
                    post: {},
                    put: {},
                    patch: {},
                    delete: {},
                },
            },
            get: jest.fn(),
            head: jest.fn(),
            post: jest.fn(),
            patch: jest.fn(),
            delete: jest.fn(),
            put: jest.fn(),
            request: jest.fn(),
            options: jest.fn(),
        };
    });
    it('should show help', async () => {
        // Check that the help is correct, dropping the "bin" prefix because that varies with the test environment.
        expect(await (0, yargs_1.default)([`${cli_1.GithubPrCommentModule.command}`])
            .scriptName('skyux-dev')
            .command(cli_1.GithubPrCommentModule)
            .getHelp()).toMatchSnapshot();
    });
    it('should add a comment to a PR', async () => {
        const httpClient = {
            ...client,
            get: jest.fn().mockReturnValue(Promise.resolve({
                data: [
                    {
                        id: 123456789,
                        body: 'prefix comment',
                    },
                ],
            })),
            post: jest.fn().mockReturnValue(Promise.resolve()),
        };
        await (0, handler_1.addOrUpdateGithubPrCommentHandler)({
            pr: 123,
            startsWith: 'prefix',
            fullComment: 'prefix comment updated',
            token: 'token',
            httpClient: httpClient,
        });
        expect(httpClient.patch).toHaveBeenCalledWith('https://api.github.com/repos/blackbaud/skyux/issues/comments/123456789', { body: 'prefix comment updated' });
        const commentFile = (0, path_1.join)(os_1.default.tmpdir(), 'pr-comment-test.md');
        (0, fs_extra_1.writeFileSync)(commentFile, 'other comment updated');
        await (0, handler_1.addOrUpdateGithubPrCommentHandler)({
            pr: 123,
            startsWith: 'other',
            commentFile,
            token: 'token',
            httpClient: httpClient,
        });
        expect(httpClient.post).toHaveBeenCalledWith('https://api.github.com/repos/blackbaud/skyux/issues/123/comments', { body: 'other comment updated' });
        (0, fs_extra_1.rmSync)(commentFile);
    });
    it('should handle errors', async () => {
        try {
            await (0, handler_1.addOrUpdateGithubPrCommentHandler)({
                pr: 123,
                startsWith: 'prefix',
                fullComment: '',
                token: 'token',
                httpClient: client,
            });
        }
        catch (e) {
            expect(e.message).toEqual('No comment specified');
        }
        const commentFile = (0, path_1.join)(__dirname, './test-data/comment.txt');
        try {
            await (0, handler_1.addOrUpdateGithubPrCommentHandler)({
                pr: 123,
                startsWith: 'prefix',
                commentFile,
                token: 'token',
                httpClient: client,
            });
        }
        catch (e) {
            expect(e.message).toEqual(`File "${commentFile}" does not exist`);
        }
    });
});
