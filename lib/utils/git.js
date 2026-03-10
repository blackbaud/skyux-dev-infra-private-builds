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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.addAll = addAll;
exports.remove = remove;
exports.checkoutNewBranch = checkoutNewBranch;
exports.fetchAll = fetchAll;
exports.pull = pull;
exports.getCurrentBranch = getCurrentBranch;
exports.isClean = isClean;
exports.getLastCommit = getLastCommit;
exports.getRemoteUrl = getRemoteUrl;
exports.isGitHub = isGitHub;
exports.isAzureDevOps = isAzureDevOps;
exports.commit = commit;
exports.mergeTheirChanges = mergeTheirChanges;
exports.push = push;
exports.setCommitter = setCommitter;
exports.unsetCommitter = unsetCommitter;
exports.getContentAtCommit = getContentAtCommit;
exports.getPackageVersionForCommit = getPackageVersionForCommit;
exports.resetFilesToCommit = resetFilesToCommit;
exports.getDiffNumbersForStagedChanges = getDiffNumbersForStagedChanges;
exports.getCommitsToFile = getCommitsToFile;
exports.getUniDiff = getUniDiff;
exports.applyUniDiff = applyUniDiff;
exports.getReleaseTags = getReleaseTags;
exports.doesThisTagExist = doesThisTagExist;
exports.doesThisRefExist = doesThisRefExist;
exports.createAndPushTag = createAndPushTag;
const node_fs_1 = require("node:fs");
const node_os_1 = require("node:os");
const node_path_1 = require("node:path");
const spawn_1 = require("./spawn");
async function addAll(config) {
    const options = {
        workingDirectory: process.cwd(),
        paths: ['.'],
        ...(config || {}),
    };
    await (0, spawn_1.runCommand)('git', ['-C', options.workingDirectory, 'add', '--all', ...options.paths], {}, { logCommand: options.logCommand });
}
async function remove(config) {
    const options = {
        workingDirectory: process.cwd(),
        paths: [],
        ...config,
    };
    if (options.paths.length > 0) {
        await (0, spawn_1.runCommand)('git', ['-C', options.workingDirectory, 'rm', '--force', '--', ...options.paths], {}, { logCommand: options.logCommand });
    }
}
async function checkoutNewBranch(branch, config) {
    const options = {
        workingDirectory: process.cwd(),
        force: false,
        fromBranch: 'HEAD',
        ...(config || {}),
    };
    const result = await (0, spawn_1.getCommandOutput)('git', ['-C', options.workingDirectory, 'branch', '--list', branch], {}, { logCommand: options.logCommand });
    if (result && !options.force) {
        throw new Error(`The branch "${branch}" already exists. Aborting.`);
    }
    await (0, spawn_1.runCommand)('git', [
        '-C',
        options.workingDirectory,
        'checkout',
        options.force ? '-B' : '-b',
        branch,
        '--no-track',
        options.fromBranch,
    ], {}, { logCommand: options.logCommand });
}
async function fetchAll(config) {
    const options = {
        workingDirectory: process.cwd(),
        ...(config || {}),
    };
    return (0, spawn_1.getCommandOutput)('git', ['-C', options.workingDirectory, 'fetch', '--all', '--tags'], {}, { logCommand: options.logCommand });
}
async function pull(config) {
    const options = {
        workingDirectory: process.cwd(),
        branch: 'main',
        remote: 'origin',
        rebase: false,
        ...(config || {}),
    };
    return (0, spawn_1.getCommandOutput)('git', [
        '-C',
        options.workingDirectory,
        'pull',
        options.rebase ? '--rebase=true' : '--ff-only',
        options.remote,
        options.branch,
    ], {}, { logCommand: options.logCommand });
}
async function getCurrentBranch(config) {
    const options = {
        workingDirectory: process.cwd(),
        ...(config || {}),
    };
    return (0, spawn_1.getCommandOutput)('git', ['-C', options.workingDirectory, 'branch', '--show-current'], {}, { logCommand: options.logCommand });
}
async function isClean(config) {
    let options = {
        compareAgainstRemote: false,
        workingDirectory: process.cwd(),
    };
    if (config) {
        options = { ...options, ...config };
    }
    // Fetch any upstream changes before getting the status.
    if (options.compareAgainstRemote) {
        await fetchAll(options);
    }
    const porcelainStatus = await (0, spawn_1.getCommandOutput)('git', ['-C', options.workingDirectory, 'status', '--porcelain'], {}, { logCommand: options.logCommand });
    let isClean = !porcelainStatus.trim();
    if (isClean && options.compareAgainstRemote) {
        const status = await (0, spawn_1.getCommandOutput)('git', ['-C', options.workingDirectory, 'status'], {}, { logCommand: options.logCommand });
        isClean = status.includes('Your branch is up to date');
    }
    return isClean;
}
async function getLastCommit(config) {
    const options = {
        workingDirectory: process.cwd(),
        ...(config || {}),
    };
    return (0, spawn_1.getCommandOutput)('git', ['-C', options.workingDirectory, 'rev-parse', 'HEAD'], {}, { logCommand: options.logCommand });
}
async function getRemoteUrl(config) {
    const options = {
        workingDirectory: process.cwd(),
        ...(config || {}),
    };
    const remote = (await (0, spawn_1.getCommandOutput)('git', ['-C', options.workingDirectory, 'remote'], {}, { logCommand: options.logCommand })) || '';
    const remotes = remote.split('\n').filter((r) => r);
    if (remotes.length === 0 || remotes.length > 1) {
        throw new Error(`Could not determine a remote in the repository.`);
    }
    return (0, spawn_1.getCommandOutput)('git', ['-C', options.workingDirectory, 'remote', 'get-url', remotes[0]], {}, { logCommand: options.logCommand });
}
async function isGitHub(config) {
    const remoteUrl = await getRemoteUrl(config);
    const url = new URL(remoteUrl);
    return url.hostname.toLowerCase() === 'github.com';
}
async function isAzureDevOps(config) {
    const remoteUrl = await getRemoteUrl(config);
    const url = new URL(remoteUrl);
    return (url.hostname.toLowerCase() === 'dev.azure.com' ||
        url.hostname.toLowerCase().endsWith('.visualstudio.com'));
}
async function commit(config) {
    const options = {
        workingDirectory: process.cwd(),
        message: '',
        paths: [],
        allowEmpty: false,
        ...config,
    };
    if (!options.message) {
        throw new Error('No commit message.');
    }
    if (options.paths.length === 0) {
        const args = [
            '-C',
            options.workingDirectory,
            'commit',
            '-m',
            options.message,
        ];
        if (options.allowEmpty) {
            args.push('--allow-empty');
        }
        await (0, spawn_1.runCommand)('git', args, {}, { logCommand: options.logCommand });
    }
    else {
        await (0, spawn_1.runCommand)('git', [
            '-C',
            options.workingDirectory,
            'commit',
            '-m',
            options.message,
            '--',
            ...options.paths,
        ], {}, { logCommand: options.logCommand });
    }
}
async function mergeTheirChanges(branch, config) {
    const options = {
        workingDirectory: process.cwd(),
        logCommand: false,
        ...config,
    };
    await (0, spawn_1.runCommand)('git', [
        '-C',
        options.workingDirectory,
        'merge',
        '-X',
        'theirs',
        '--no-edit',
        branch,
    ], {}, { logCommand: options.logCommand });
}
async function push(config) {
    const options = {
        workingDirectory: process.cwd(),
        branch: 'main',
        remote: 'origin',
        ...(config || {}),
    };
    await (0, spawn_1.runCommand)('git', ['-C', options.workingDirectory, 'push', options.remote, options.branch], {}, { logCommand: options.logCommand });
}
async function setCommitter(config) {
    const options = {
        name: 'Blackbaud Sky Build User',
        email: 'sky-build-user@blackbaud.com',
        workingDirectory: process.cwd(),
        ...(config || {}),
    };
    await (0, spawn_1.runCommand)('git', ['-C', options.workingDirectory, 'config', 'user.name', options.name], {}, { logCommand: options.logCommand });
    await (0, spawn_1.runCommand)('git', ['-C', options.workingDirectory, 'config', 'user.email', options.email], {}, { logCommand: options.logCommand });
}
async function unsetCommitter(config) {
    const options = {
        workingDirectory: process.cwd(),
        ...(config || {}),
    };
    await (0, spawn_1.runCommand)('git', ['-C', options.workingDirectory, 'config', '--remove-section', 'user'], {}, { logCommand: options.logCommand });
}
async function getContentAtCommit(filePath, commit, config) {
    const options = {
        workingDirectory: process.cwd(),
        ...(config || {}),
    };
    return (0, spawn_1.getCommandOutput)('git', [
        '-C',
        options.workingDirectory,
        'cat-file',
        'blob',
        `${commit}:${filePath}`,
    ], {}, { logCommand: options.logCommand });
}
async function getPackageVersionForCommit(commit, config) {
    return await getContentAtCommit('package.json', commit, config)
        .then((content) => {
        const { version } = JSON.parse(content);
        return version;
    })
        .catch(() => undefined);
}
async function resetFilesToCommit(fileNames, commit, config) {
    const options = {
        workingDirectory: process.cwd(),
        ...(config || {}),
    };
    await (0, spawn_1.runCommand)('git', ['-C', options.workingDirectory, 'checkout', commit, '--', ...fileNames], {}, config);
}
async function getDiffNumbersForStagedChanges(fileNames, baseBranch, config) {
    const options = {
        workingDirectory: process.cwd(),
        logCommand: false,
        ...(config || {}),
    };
    const numStats = await (0, spawn_1.getCommandOutput)('git', [
        '-C',
        options.workingDirectory,
        'diff',
        '--cached',
        '--no-color',
        '--numstat',
        baseBranch,
        '--',
        ...fileNames,
    ], {}, config);
    let [added, removed] = [0, 0];
    (numStats || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .forEach((numStat) => {
        const [lineAdded, lineRemoved] = numStat
            .trim()
            .split(/\s+/)
            .map(parseInt);
        added += lineAdded;
        removed += lineRemoved;
    });
    return { added, removed };
}
async function getCommitsToFile(pattern, branch, fileName, config) {
    const options = {
        workingDirectory: process.cwd(),
        ...(config || {}),
    };
    return await (0, spawn_1.getCommandOutput)('git', [
        '-C',
        options.workingDirectory,
        'log',
        `--grep=${pattern}`,
        '--format=%H',
        `${branch}`,
        '--',
        fileName,
    ], {}, { logCommand: options.logCommand }).then((output) => (output || '').split('\n').filter((line) => line));
}
async function getUniDiff(range, fileName, config) {
    const options = {
        workingDirectory: process.cwd(),
        ...(config || {}),
    };
    return await (0, spawn_1.getCommandOutput)('git', [
        '-C',
        options.workingDirectory,
        'diff',
        range,
        '--patch',
        '--unified=0',
        '--',
        fileName,
    ], {}, { logCommand: options.logCommand });
}
async function applyUniDiff(patch, config) {
    // Short-circuit if patch is empty or only whitespace
    if (patch.trim() === '') {
        return;
    }
    const options = {
        workingDirectory: process.cwd(),
        ...(config || {}),
    };
    // Create a temporary directory and file to hold the patch
    const tempDir = (0, node_fs_1.mkdtempSync)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'git-patch-'));
    const patchFile = (0, node_path_1.join)(tempDir, 'patch.diff');
    try {
        // Ensure the patch ends with a newline
        const patchContent = patch.endsWith('\n') ? patch : patch + '\n';
        // Write the patch to a temporary file
        (0, node_fs_1.writeFileSync)(patchFile, patchContent);
        // Apply the patch from the file
        await (0, spawn_1.runCommand)('git', ['-C', options.workingDirectory, 'apply', '--unidiff-zero', patchFile], {}, { logCommand: options.logCommand });
    }
    finally {
        // Clean up the temporary file and directory
        const { rmSync } = await Promise.resolve().then(() => __importStar(require('node:fs')));
        rmSync(tempDir, { recursive: true, force: true });
    }
}
async function getReleaseTags(tagPrefix = 'v', config) {
    const releaseTags = await (0, spawn_1.getCommandOutput)('git', [
        'tag',
        '-l',
        '--sort=-committerdate',
        '--format=%(objectname) %(refname:strip=2)',
        `${tagPrefix}*`,
    ], {}, config).then((output) => (output || '').split('\n').filter((line) => line));
    return Object.fromEntries(releaseTags.map((tag) => tag.split(' ')));
}
async function doesThisTagExist(tag, config) {
    const options = {
        workingDirectory: process.cwd(),
        ...(config || {}),
    };
    const tags = await (0, spawn_1.getCommandOutput)('git', ['-C', options.workingDirectory, 'tag', '-l', tag], {}, options).then((output) => (output || '').split('\n').filter((line) => line));
    return tags.includes(tag);
}
async function doesThisRefExist(ref, config) {
    const options = {
        workingDirectory: process.cwd(),
        ...(config || {}),
    };
    return await (0, spawn_1.getCommandOutput)('git', ['-C', options.workingDirectory, 'show-ref', '--hash', '--', ref], {}, options)
        .then((output) => !!(output || '').trim())
        .catch(() => false);
}
async function createAndPushTag(tag, commit, remote, options) {
    await (0, spawn_1.runCommand)('git', ['tag', tag, commit], {}, {
        logCommand: options.logCommand,
    });
    await (0, spawn_1.runCommand)('git', ['push', remote, tag], {}, {
        logCommand: options.logCommand,
    });
}
