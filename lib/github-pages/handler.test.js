"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs_extra_1 = require("fs-extra");
const os_1 = __importDefault(require("os"));
const path_1 = require("path");
const yargs_1 = __importDefault(require("yargs"));
const git_1 = require("../utils/git");
const cli_1 = require("./cli");
const handler_1 = require("./handler");
describe('github-pages', () => {
    it('should show help', async () => {
        // Check that the help is correct, dropping the "bin" prefix because that varies with the test environment.
        expect(await (0, yargs_1.default)([`${cli_1.GithubPagesMirrorModule.command}`])
            .scriptName('skyux-dev')
            .command(cli_1.GithubPagesMirrorModule)
            .getHelp()).toMatchSnapshot();
        expect(await (0, yargs_1.default)([`${cli_1.GithubPagesPublishModule.command}`])
            .scriptName('skyux-dev')
            .command(cli_1.GithubPagesPublishModule)
            .getHelp()).toMatchSnapshot();
        expect(await (0, yargs_1.default)([`${cli_1.GithubPagesRemoveOldPrsModule.command}`])
            .scriptName('skyux-dev')
            .command(cli_1.GithubPagesRemoveOldPrsModule)
            .getHelp()).toMatchSnapshot();
    });
    describe('mirror', () => {
        const tempRepos = [];
        function tempRepoName() {
            const tempRepo = (0, path_1.join)(os_1.default.tmpdir(), `mirror-repo-${Math.floor(Math.random() * 10e8)}`);
            tempRepos.push(tempRepo);
            return tempRepo;
        }
        async function addRepoContent(repo) {
            (0, fs_extra_1.writeFileSync)((0, path_1.join)(repo, 'README.md'), 'This is a temporary repository.');
            (0, child_process_1.spawnSync)('git', ['add', '.'], { cwd: repo, stdio: 'ignore' });
            await (0, git_1.setCommitter)({ workingDirectory: repo });
            (0, child_process_1.spawnSync)('git', ['commit', '-m', 'Initial commit'], {
                cwd: repo,
                stdio: 'ignore',
            });
        }
        function initRepo(repo) {
            (0, child_process_1.spawnSync)('git', ['init', '-q', repo, '-b', 'main'], { stdio: 'ignore' });
        }
        afterAll(async () => {
            return Promise.all(tempRepos.map((repo) => (0, fs_extra_1.rm)(repo, { recursive: true, force: true })));
        });
        it('should mirror the github pages', async () => {
            // Set up a temporary repository.
            const repo = tempRepoName();
            initRepo(repo);
            await addRepoContent(repo);
            expect(await (0, git_1.isClean)({ workingDirectory: repo })).toBe(true);
            (0, fs_extra_1.mkdirpSync)((0, path_1.join)(repo, 'preview-123'));
            (0, fs_extra_1.writeFileSync)((0, path_1.join)(repo, 'preview-123/file1.txt'), 'hello');
            (0, fs_extra_1.writeFileSync)((0, path_1.join)(repo, 'preview-123/file2.txt'), 'world');
            (0, fs_extra_1.writeFileSync)((0, path_1.join)(repo, 'preview-123/file3.txt'), 'changeme');
            await (0, git_1.addAll)({ workingDirectory: repo });
            await (0, git_1.commit)({ workingDirectory: repo, message: 'Starting commit' });
            // Set up a temporary directory to act as the build output.
            const build = tempRepoName();
            (0, fs_extra_1.mkdirpSync)((0, path_1.join)(build, 'public'));
            (0, fs_extra_1.writeFileSync)((0, path_1.join)(build, 'public/file2.txt'), 'world');
            (0, fs_extra_1.writeFileSync)((0, path_1.join)(build, 'public/file3.txt'), 'hello!');
            (0, fs_extra_1.writeFileSync)((0, path_1.join)(build, 'public/file4.txt'), 'additional file');
            // Run the mirroring process, both to an existing and a new subpath.
            await (0, handler_1.githubPagesMirror)({
                workingDirectory: repo,
                fromPath: (0, path_1.join)(build, 'public'),
                toPath: 'preview-123',
            });
            await (0, handler_1.githubPagesMirror)({
                workingDirectory: repo,
                fromPath: (0, path_1.join)(build, 'public'),
                toPath: 'sub-path/preview-123',
            });
            const status = (0, child_process_1.spawnSync)('git', ['status', '-s'], {
                cwd: repo,
                stdio: 'pipe',
            });
            expect(status.stdout.toString()).toMatchSnapshot();
            const diff = (0, child_process_1.spawnSync)('git', ['diff', '--cached'], {
                cwd: repo,
                stdio: 'pipe',
            });
            expect(diff.stdout.toString()).toMatchSnapshot();
        });
        it('should handle errors', async () => {
            try {
                await (0, handler_1.githubPagesMirror)({
                    workingDirectory: '',
                    fromPath: (0, path_1.join)(__dirname, `not/a/real/path`),
                    toPath: '',
                });
                fail('Expected an error');
            }
            catch (e) {
                expect(e.message).toContain('does not exist');
            }
        });
    });
});
