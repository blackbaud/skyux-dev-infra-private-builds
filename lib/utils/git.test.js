"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const fs_extra_1 = require("fs-extra");
const os = __importStar(require("os"));
const path_1 = require("path");
const git_1 = require("./git");
describe('git', () => {
    const tempRepos = [];
    function tempRepoName() {
        const tempRepo = (0, path_1.join)(os.tmpdir(), `temp-repo-${Math.floor(Math.random() * 10e8)}`);
        tempRepos.push(tempRepo);
        return tempRepo;
    }
    async function addRepoContent(repo) {
        (0, fs_extra_1.writeFileSync)((0, path_1.join)(repo, 'README.md'), 'This is a temporary repository.');
        await (0, git_1.addAll)({ workingDirectory: repo });
        await (0, git_1.setCommitter)({ workingDirectory: repo });
        (0, child_process_1.spawnSync)('git', ['commit', '-m', 'Initial commit'], {
            cwd: repo,
            stdio: 'ignore',
        });
        await (0, git_1.unsetCommitter)({ workingDirectory: repo });
    }
    function initRepo(repo) {
        (0, child_process_1.spawnSync)('git', ['init', '-q', '-b', 'main', repo], { stdio: 'ignore' });
    }
    afterAll(async () => {
        return Promise.all(tempRepos.map((repo) => (0, fs_extra_1.rm)(repo, { recursive: true, force: true })));
    });
    it('should add and remove files', async () => {
        // Set up a temporary repository.
        const startPath = process.cwd();
        const repo = tempRepoName();
        initRepo(repo);
        await addRepoContent(repo);
        expect(await (0, git_1.isClean)({ workingDirectory: repo })).toBe(true);
        // Add a file and commit.
        (0, fs_extra_1.writeFileSync)((0, path_1.join)(repo, 'file.txt'), 'hello');
        process.chdir(repo);
        await (0, git_1.addAll)();
        process.chdir(startPath);
        expect(await (0, git_1.isClean)({ workingDirectory: repo })).toBe(false);
        await (0, git_1.setCommitter)({ workingDirectory: repo });
        await (0, git_1.commit)({ workingDirectory: repo, message: 'Add file' });
        expect(await (0, git_1.isClean)({ workingDirectory: repo })).toBe(true);
        // Remove the file and commit.
        await (0, git_1.remove)({ workingDirectory: repo, paths: ['file.txt'] });
        expect(await (0, git_1.isClean)({ workingDirectory: repo })).toBe(false);
        await (0, git_1.commit)({ workingDirectory: repo, message: 'Remove file' });
        expect(await (0, git_1.isClean)({ workingDirectory: repo })).toBe(true);
        // Switch to a new branch.
        await (0, git_1.checkoutNewBranch)('test', { workingDirectory: repo });
        expect(await (0, git_1.getCurrentBranch)({ workingDirectory: repo })).toBe('test');
        expect(await (0, git_1.getLastCommit)({ workingDirectory: repo })).toBeTruthy();
        // Run through some error cases.
        process.chdir(repo);
        try {
            await (0, git_1.checkoutNewBranch)('main');
            fail('Expected an error to be thrown');
        }
        catch (e) {
            expect(e.message).toBe('The branch "main" already exists. Aborting.');
            expect(await (0, git_1.getCurrentBranch)()).toBe('test');
        }
        try {
            await (0, git_1.commit)({ message: '' });
            fail('Expected an error to be thrown');
        }
        catch (e) {
            expect(e.message).toBe('No commit message.');
        }
        try {
            await (0, git_1.getRemoteUrl)();
            fail('Expected an error to be thrown');
        }
        catch (e) {
            expect(e.message).toBe('Could not determine a remote in the repository.');
        }
        process.chdir(startPath);
        // Create an empty commit.
        const lastCommit = await (0, git_1.getLastCommit)({ workingDirectory: repo });
        await (0, git_1.commit)({
            workingDirectory: repo,
            message: 'Test commit',
            allowEmpty: true,
        });
        expect(await (0, git_1.getLastCommit)({ workingDirectory: repo })).not.toBe(lastCommit);
    });
    it('should handle remote repositories', async () => {
        // Set up a temporary repository.
        const startPath = process.cwd();
        const repo = tempRepoName();
        initRepo(repo);
        await addRepoContent(repo);
        // Add a clone and a bare clone.
        const clone = tempRepoName();
        const bare = tempRepoName();
        (0, child_process_1.spawnSync)('git', ['clone', '-q', '--bare', '--no-hardlinks', repo, bare], {
            stdio: 'ignore',
        });
        (0, child_process_1.spawnSync)('git', ['clone', '-q', '-b', 'main', '--no-hardlinks', bare, clone], {
            stdio: 'ignore',
        });
        (0, child_process_1.spawnSync)('git', ['-C', repo, 'remote', 'add', 'origin', bare], {
            stdio: 'ignore',
        });
        (0, child_process_1.spawnSync)('git', ['-C', repo, 'branch', '-u', 'origin', 'main'], {
            stdio: 'ignore',
        });
        // Update a file on the origin and fetch from the clone.
        (0, fs_extra_1.writeFileSync)((0, path_1.join)(repo, 'README.md'), 'This is a temporary repository. Updated.');
        await (0, git_1.setCommitter)({ workingDirectory: repo });
        await (0, git_1.commit)({
            workingDirectory: repo,
            message: 'Update README',
            paths: ['README.md'],
        });
        expect(await (0, git_1.isClean)({ workingDirectory: repo })).toBe(true);
        await expect((0, git_1.push)({ workingDirectory: repo })).resolves.toBeUndefined();
        await expect((0, git_1.fetchAll)({ workingDirectory: clone }).then(() => true)).resolves.toBeTruthy();
        process.chdir(clone);
        await expect((0, git_1.fetchAll)().then(() => true)).resolves.toBeTruthy();
        expect(await (0, git_1.isClean)({ compareAgainstRemote: true })).toBe(false);
        process.chdir(startPath);
        // Check that the clone is up-to-date.
        expect(await (0, git_1.isClean)({ workingDirectory: clone, compareAgainstRemote: true })).toBe(false);
        (0, child_process_1.spawnSync)('git', ['-C', clone, 'merge', 'origin/main'], {
            stdio: 'ignore',
        });
        expect(await (0, git_1.isClean)({ workingDirectory: clone, compareAgainstRemote: true })).toBe(true);
        // Make changes to the clone and push to the bare clone.
        expect((0, fs_1.readFileSync)((0, path_1.join)(clone, 'README.md'), 'utf8')).toBe('This is a temporary repository. Updated.');
        (0, fs_extra_1.writeFileSync)((0, path_1.join)(clone, 'README.md'), 'This is a temporary repository. Updated remotely.');
        process.chdir(clone);
        await (0, git_1.setCommitter)();
        process.chdir(startPath);
        await (0, git_1.commit)({
            workingDirectory: clone,
            message: 'Update README remotely',
            paths: ['README.md'],
        });
        await expect((0, git_1.fetchAll)({ workingDirectory: clone }).then(() => true)).resolves.toBeTruthy();
        await expect((0, git_1.push)({ workingDirectory: clone, remote: 'origin', branch: 'main' })).resolves.toBeUndefined();
        await (0, git_1.pull)({ workingDirectory: repo });
        expect(await (0, git_1.isClean)({ workingDirectory: clone, compareAgainstRemote: true })).toBe(true);
        // Push to the bare clone using the default upstream.
        (0, fs_extra_1.writeFileSync)((0, path_1.join)(clone, 'README.md'), 'This is a temporary repository. Updated remotely x2.');
        await (0, git_1.commit)({
            workingDirectory: clone,
            message: 'Update README remotely without config',
            paths: ['README.md'],
        });
        await (0, git_1.pull)({ workingDirectory: repo, rebase: true });
        process.chdir(clone);
        await (0, git_1.pull)();
        await expect((0, git_1.push)()).resolves.toBeUndefined();
        process.chdir(startPath);
        // Verify that the changes were pushed.
        const remoteUrl = await (0, git_1.getRemoteUrl)({ workingDirectory: clone });
        expect(remoteUrl).toBeTruthy();
        const lastCommit = await (0, git_1.getLastCommit)({ workingDirectory: clone });
        process.chdir(clone);
        const lastCommitPwd = await (0, git_1.getLastCommit)();
        await (0, git_1.unsetCommitter)();
        process.chdir(startPath);
        expect(lastCommit).toBe(lastCommitPwd);
    });
});
