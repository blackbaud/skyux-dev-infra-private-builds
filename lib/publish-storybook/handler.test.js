"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const fs_extra_1 = require("fs-extra");
const os_1 = __importDefault(require("os"));
const path_1 = require("path");
const yargs_1 = __importDefault(require("yargs"));
const git_1 = require("../utils/git");
const spawn_1 = require("../utils/spawn");
const cli_1 = require("./cli");
const handler_1 = require("./handler");
describe('publish-storybook', () => {
    it('should show help', async () => {
        // Check that the help is correct, dropping the "bin" prefix because that varies with the test environment.
        expect(await (0, yargs_1.default)([`${cli_1.PublishStorybookModule.command}`])
            .scriptName('skyux-dev')
            .command(cli_1.PublishStorybookModule)
            .getHelp()).toMatchSnapshot();
    });
    describe('handler', () => {
        // Create a temporary repository for the test.
        async function setupMockEnvironment(scenario) {
            // Randomly generate a name for the temporary repository.
            const dir = (0, path_1.join)(os_1.default.tmpdir(), `publish-storybook-${Math.floor(Math.random() * 10e8)}`);
            // Add some content to the temporary repository to stand in for the monorepo and build artifacts.
            let storybooksBuildPath;
            if (scenario === 'pr') {
                // Archives from the build-storybook tasks are retrieved to dist/storybooks.
                storybooksBuildPath = 'storybooks';
            }
            else {
                // Archives from the build-storybook tasks are retrieved to dist/storybooks/branch.
                storybooksBuildPath = 'storybooks/main';
            }
            (0, fs_extra_1.mkdirpSync)((0, path_1.join)(dir, `dist/${storybooksBuildPath}/storybook-build1`));
            (0, fs_extra_1.writeFileSync)((0, path_1.join)(dir, `dist/${storybooksBuildPath}/storybook-build1/index.html`), 'Hello World!');
            (0, fs_extra_1.mkdirpSync)((0, path_1.join)(dir, `dist/${storybooksBuildPath}/storybook-build2`));
            (0, fs_extra_1.writeFileSync)((0, path_1.join)(dir, `dist/${storybooksBuildPath}/storybook-build2/index.html`), 'Hello World!');
            // Storybook composition is always built to dist/storybook.
            (0, fs_extra_1.mkdirpSync)((0, path_1.join)(dir, 'dist/storybook'));
            (0, fs_extra_1.writeFileSync)((0, path_1.join)(dir, 'dist/storybook/index.html'), 'Hello World!');
            // Files that would be generated by pr-comment schematic.
            (0, fs_extra_1.writeFileSync)((0, path_1.join)(dir, 'dist/pr_comment.md'), 'Hello World!');
            (0, fs_extra_1.writeFileSync)((0, path_1.join)(dir, 'dist/README.md'), 'Hello World!');
            // Content for the monorepo.
            (0, fs_extra_1.writeFileSync)((0, path_1.join)(dir, 'README.md'), 'Hello World!');
            (0, fs_extra_1.writeFileSync)((0, path_1.join)(dir, '.gitignore'), [
                '*.log',
                'dist',
                'node_modules',
                'skyux-pr-preview',
                'skyux-storybook',
            ].join('\n'));
            // Create a repository to use for the GitHub Pages remote.
            (0, fs_extra_1.mkdirpSync)((0, path_1.join)(dir, 'dist/storybook-repo-origin'));
            (0, fs_extra_1.writeFileSync)((0, path_1.join)(dir, 'dist/storybook-repo-origin/index.html'), 'Hello World!');
            // Initialize git in both the monorepo and GitHub Pages repositories.
            await Promise.all([
                ...[(0, path_1.join)(dir, 'dist/storybook-repo-origin'), dir].map((gitDir) => {
                    (0, child_process_1.spawnSync)('git', ['init', '-b', 'main'], {
                        cwd: gitDir,
                        stdio: 'ignore',
                    });
                    return (0, git_1.setCommitter)({ workingDirectory: gitDir }).then(() => (0, git_1.addAll)({ workingDirectory: gitDir }).then(() => (0, git_1.commit)({ workingDirectory: gitDir, message: 'Initial commit' })));
                }),
            ]);
            // Convert the GitHub Pages remote to a bare repository and clone it.
            (0, fs_1.renameSync)((0, path_1.join)(dir, 'dist/storybook-repo-origin/.git'), (0, path_1.join)(dir, 'dist/storybook-repo-origin.git'));
            (0, child_process_1.spawnSync)('git', ['config', '--bool', 'core.bare', 'true'], {
                cwd: (0, path_1.join)(dir, 'dist/storybook-repo-origin.git'),
                stdio: 'ignore',
            });
            const remote = scenario === 'pr' ? 'skyux-pr-preview' : 'skyux-storybook';
            (0, child_process_1.spawnSync)('git', ['clone', '--no-hardlinks', 'dist/storybook-repo-origin.git', remote], { cwd: dir, stdio: 'ignore' });
            // Return the path to the temporary directory.
            return dir;
        }
        function cleanupMockEnvironment(dir) {
            (0, fs_extra_1.rmSync)(dir, { recursive: true, force: true });
        }
        function createHttpClient() {
            return {
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
        }
        it('should publish storybook for pr', async () => {
            const dir = await setupMockEnvironment('pr');
            const startDir = process.cwd();
            process.chdir(dir);
            const httpClient = createHttpClient();
            httpClient.get = jest.fn().mockImplementation(async (url) => {
                if (url.endsWith('/pages/builds')) {
                    const lastCommit = await (0, git_1.getLastCommit)({
                        workingDirectory: (0, path_1.join)(dir, 'skyux-pr-preview'),
                    });
                    return {
                        status: 200,
                        data: [
                            {
                                commit: lastCommit,
                            },
                        ],
                    };
                }
                else if (url.endsWith('/comments')) {
                    return {
                        status: 200,
                        data: [
                            {
                                id: 12345,
                                body: '[Storybook preview]',
                            },
                        ],
                    };
                }
                else {
                    return {
                        status: 200,
                    };
                }
            });
            // No ownerSlashRepo and not a GitHub remote.
            await expect((0, handler_1.publishStorybook)({
                workingDirectory: (0, path_1.join)(dir, 'skyux-pr-preview'),
                pr: 123,
                token: '',
                runCommand: jest.fn(),
                httpClient: createHttpClient(),
                wait: false,
            })).rejects.toThrowError(/^Invalid remote URL: /);
            try {
                await expect((0, handler_1.publishStorybook)({
                    workingDirectory: (0, path_1.join)(dir, 'skyux-pr-preview'),
                    pr: 123,
                    token: 'abc',
                    runCommand: jest.fn(),
                    httpClient: httpClient,
                    wait: false,
                    ownerSlashRepo: 'owner/repo',
                }).then(() => true)).resolves.toBeTruthy();
                expect(httpClient.get.mock.calls).toMatchSnapshot();
                expect(httpClient.patch.mock.calls).toMatchSnapshot();
                const files = await (0, spawn_1.getCommandOutput)('git', ['ls-tree', '--full-tree', '-r', 'HEAD'], {
                    cwd: (0, path_1.join)(dir, 'dist/storybook-repo-origin.git'),
                });
                expect(files).toMatchSnapshot();
                // Add apps.
                (0, fs_extra_1.mkdirpSync)((0, path_1.join)(dir, 'dist/apps/app-1'));
                (0, fs_extra_1.writeFileSync)((0, path_1.join)(dir, 'dist/apps/app-1/index.html'), 'App 1 World!');
                (0, fs_extra_1.mkdirpSync)((0, path_1.join)(dir, 'dist/apps/app-2'));
                (0, fs_extra_1.writeFileSync)((0, path_1.join)(dir, 'dist/apps/app-2/index.html'), 'App 2 World!');
                await expect((0, handler_1.publishStorybook)({
                    workingDirectory: (0, path_1.join)(dir, 'skyux-pr-preview'),
                    pr: 123,
                    token: 'abc',
                    runCommand: jest.fn(),
                    httpClient: httpClient,
                    wait: false,
                    ownerSlashRepo: 'owner/repo',
                }).then(() => true)).resolves.toBeTruthy();
                const filesWithApps = await (0, spawn_1.getCommandOutput)('git', ['ls-tree', '--full-tree', '-r', 'HEAD'], {
                    cwd: (0, path_1.join)(dir, 'dist/storybook-repo-origin.git'),
                });
                expect(filesWithApps).toMatchSnapshot();
            }
            finally {
                process.chdir(startDir);
                cleanupMockEnvironment(dir);
            }
        });
        it('should publish storybook for branch', async () => {
            const dir = await setupMockEnvironment('branch');
            const startDir = process.cwd();
            process.chdir(dir);
            const httpClient = createHttpClient();
            httpClient.get = jest.fn().mockImplementation(async (url) => {
                if (url.endsWith('/pages/builds')) {
                    const lastCommit = await (0, git_1.getLastCommit)({
                        workingDirectory: (0, path_1.join)(dir, 'skyux-storybook'),
                    });
                    return {
                        status: 200,
                        data: [
                            {
                                commit: lastCommit,
                            },
                        ],
                    };
                }
                else if (url.endsWith('/comments')) {
                    return {
                        status: 200,
                        data: [],
                    };
                }
                else {
                    return {
                        status: 200,
                    };
                }
            });
            try {
                await expect((0, handler_1.publishStorybook)({
                    workingDirectory: (0, path_1.join)(dir, 'skyux-storybook'),
                    branch: 'main',
                    token: 'abc',
                    runCommand: jest.fn(),
                    httpClient: httpClient,
                    wait: false,
                    ownerSlashRepo: 'owner/repo',
                }).then(() => true)).resolves.toBeTruthy();
                const files = await (0, spawn_1.getCommandOutput)('git', ['ls-tree', '--full-tree', '-r', 'HEAD'], {
                    cwd: (0, path_1.join)(dir, 'dist/storybook-repo-origin.git'),
                });
                expect(files).toMatchSnapshot();
                // Run it again to test the no-op case.
                await expect((0, handler_1.publishStorybook)({
                    workingDirectory: (0, path_1.join)(dir, 'skyux-storybook'),
                    branch: 'main',
                    token: 'abc',
                    runCommand: jest.fn(),
                    httpClient: httpClient,
                    wait: false,
                    ownerSlashRepo: 'owner/repo',
                }).then(() => true)).resolves.toBeTruthy();
            }
            finally {
                process.chdir(startDir);
                cleanupMockEnvironment(dir);
            }
        });
        it('should throw an error', async () => {
            await expect((0, handler_1.publishStorybook)({
                workingDirectory: '',
                token: '',
                runCommand: jest.fn(),
                httpClient: createHttpClient(),
                wait: false,
            })).rejects.toThrowError('Either "pr" or "branch" must be specified');
        });
    });
});