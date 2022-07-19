"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const github_1 = require("./github");
describe('github utils', () => {
    it('should getBranchBuildStatus', async () => {
        const client = {
            get: () => {
                return Promise.resolve({
                    data: {
                        workflow_runs: [
                            {
                                status: 'completed',
                            },
                        ],
                    },
                });
            },
        };
        const status = await (0, github_1.getBranchBuildStatus)('main', {
            httpClient: client,
        });
        expect(status).toEqual('completed');
    });
    it('should get Github owner/repo', async () => {
        const getRemoteUrl = jest
            .fn()
            .mockImplementationOnce(async () => 'https://github.com/owner/repo.git')
            .mockImplementationOnce(async () => 'https://dev.azure.com/owner/repo.git');
        await expect((0, github_1.getGithubOwnerSlashRepo)('.', { getRemoteUrl })).resolves.toEqual('owner/repo');
        await expect((0, github_1.getGithubOwnerSlashRepo)('.', { getRemoteUrl })).rejects.toThrowError(/^Invalid remote URL: /);
        expect(getRemoteUrl).toHaveBeenCalledTimes(2);
    });
    it('should getOpenPrNumbers', async () => {
        const client = {
            defaults: {
                headers: {
                    common: {},
                },
            },
            get: () => {
                return Promise.resolve({
                    data: [
                        {
                            number: 123,
                        },
                        {
                            number: 456,
                        },
                    ],
                });
            },
        };
        const prNumbers = await (0, github_1.getOpenPrNumbers)({
            httpClient: client,
            token: 'token',
        });
        expect(prNumbers).toEqual(['123', '456']);
    });
    it('should checkGithubPagesPublished', async () => {
        const client = {
            defaults: {
                headers: {
                    common: {},
                },
            },
            get: () => {
                return Promise.resolve({
                    status: 200,
                    data: [
                        {
                            commit: 'SHA',
                        },
                    ],
                });
            },
        };
        const published = await (0, github_1.checkGithubPagesPublished)('blackbaud/skyux', 'SHA', {
            httpClient: client,
            token: 'token',
        });
        expect(published).toEqual(true);
    });
    it('should checkGithubPagesPublished fail', async () => {
        const client = {
            defaults: {
                headers: {
                    common: {},
                },
            },
            get: () => Promise.resolve({ status: 401 }),
        };
        const publishedWithError = await (0, github_1.checkGithubPagesPublished)('blackbaud/skyux', 'SHA', {
            httpClient: client,
            token: 'token',
        });
        expect(publishedWithError).toEqual(false);
        const publishedWithReject = (0, github_1.checkGithubPagesPublished)('blackbaud/skyux', 'SHA', {
            httpClient: {
                ...client,
                get: () => Promise.reject('Error'),
            },
            token: 'token',
        });
        await expect(publishedWithReject).rejects.toEqual('Error');
    });
    it('should addOrUpdateGithubPrComment', async () => {
        const post = jest.fn().mockReturnValue(Promise.resolve());
        const patch = jest.fn().mockReturnValue(Promise.resolve());
        const client = {
            defaults: {
                headers: {
                    common: {},
                },
            },
            get: () => Promise.resolve({
                data: [
                    {
                        id: 123,
                        body: 'comment',
                    },
                ],
            }),
            post,
            patch,
        };
        await (0, github_1.addOrUpdateGithubPrComment)(123, 'comment', 'comment', {
            httpClient: client,
            token: 'token',
        });
        expect(patch).toHaveBeenCalled();
        await (0, github_1.addOrUpdateGithubPrComment)(123, 'other', 'other comment', {
            httpClient: client,
            token: 'token',
        });
        expect(post).toHaveBeenCalled();
    });
    it('should githubPagesWait', async () => {
        let counter = 1;
        const config = {
            httpClient: {
                defaults: {
                    headers: {
                        common: {},
                    },
                },
                get: jest.fn().mockImplementation(async () => {
                    return {
                        status: 200,
                        data: [
                            {
                                commit: `SHA-${counter++}`,
                            },
                        ],
                    };
                }),
            },
            token: 'token',
            commit: jest.fn(),
            push: jest.fn(),
            runCommand: jest.fn(),
            getLastCommit: jest.fn().mockReturnValue('SHA-6'),
            getRemoteUrl: jest
                .fn()
                .mockReturnValue('https://github.com/example/repo.git'),
        };
        await (0, github_1.githubPagesWait)('/path', config);
        expect(config.getLastCommit).toHaveBeenCalledTimes(2);
        expect(config.getRemoteUrl).toHaveBeenCalledTimes(1);
        expect(config.commit).toHaveBeenCalledTimes(1);
        expect(config.push).toHaveBeenCalledTimes(1);
        expect(config.runCommand).toHaveBeenCalledTimes(6);
        await expect((0, github_1.githubPagesWait)('/path', {
            ...config,
            getLastCommit: jest.fn().mockReturnValue('SHA-111'),
        })).rejects.toEqual(`Unable to verify GitHub Pages built.`);
        await expect((0, github_1.githubPagesWait)('/path', {
            ...config,
            getRemoteUrl: jest
                .fn()
                .mockReturnValue('https://dev.azure.com/example/repo.git'),
        })).rejects.toThrowError(`Invalid remote URL: https://dev.azure.com/example/repo.git`);
    });
});
