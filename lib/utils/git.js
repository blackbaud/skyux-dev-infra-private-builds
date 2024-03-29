"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unsetCommitter = exports.setCommitter = exports.push = exports.commit = exports.getRemoteUrl = exports.getLastCommit = exports.isClean = exports.getCurrentBranch = exports.pull = exports.fetchAll = exports.checkoutNewBranch = exports.remove = exports.addAll = void 0;
const spawn_1 = require("./spawn");
async function addAll(config) {
    const options = {
        workingDirectory: process.cwd(),
        paths: ['.'],
        ...(config || {}),
    };
    await (0, spawn_1.runCommand)('git', ['-C', options.workingDirectory, 'add', '--all', ...options.paths], {}, { logCommand: options.logCommand });
}
exports.addAll = addAll;
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
exports.remove = remove;
async function checkoutNewBranch(branch, config) {
    const options = {
        workingDirectory: process.cwd(),
        ...(config || {}),
    };
    const result = await (0, spawn_1.getCommandOutput)('git', ['-C', options.workingDirectory, 'branch', '--list', branch], {}, { logCommand: options.logCommand });
    if (result) {
        throw new Error(`The branch "${branch}" already exists. Aborting.`);
    }
    await (0, spawn_1.runCommand)('git', ['-C', options.workingDirectory, 'checkout', '-b', branch], {}, { logCommand: options.logCommand });
}
exports.checkoutNewBranch = checkoutNewBranch;
async function fetchAll(config) {
    const options = {
        workingDirectory: process.cwd(),
        ...(config || {}),
    };
    return (0, spawn_1.getCommandOutput)('git', ['-C', options.workingDirectory, 'fetch', '--all'], {}, { logCommand: options.logCommand });
}
exports.fetchAll = fetchAll;
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
exports.pull = pull;
async function getCurrentBranch(config) {
    const options = {
        workingDirectory: process.cwd(),
        ...(config || {}),
    };
    return (0, spawn_1.getCommandOutput)('git', ['-C', options.workingDirectory, 'branch', '--show-current'], {}, { logCommand: options.logCommand });
}
exports.getCurrentBranch = getCurrentBranch;
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
    const result = await (0, spawn_1.getCommandOutput)('git', ['-C', options.workingDirectory, 'status'], {}, { logCommand: options.logCommand });
    let isClean = result.includes('nothing to commit, working tree clean');
    if (isClean && options.compareAgainstRemote) {
        isClean = result.includes('Your branch is up to date');
    }
    return isClean;
}
exports.isClean = isClean;
async function getLastCommit(config) {
    const options = {
        workingDirectory: process.cwd(),
        ...(config || {}),
    };
    return (0, spawn_1.getCommandOutput)('git', ['-C', options.workingDirectory, 'rev-parse', 'HEAD'], {}, { logCommand: options.logCommand });
}
exports.getLastCommit = getLastCommit;
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
exports.getRemoteUrl = getRemoteUrl;
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
exports.commit = commit;
async function push(config) {
    const options = {
        workingDirectory: process.cwd(),
        branch: 'main',
        remote: 'origin',
        ...(config || {}),
    };
    await (0, spawn_1.runCommand)('git', ['-C', options.workingDirectory, 'push', options.remote, options.branch], {}, { logCommand: options.logCommand });
}
exports.push = push;
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
exports.setCommitter = setCommitter;
async function unsetCommitter(config) {
    const options = {
        workingDirectory: process.cwd(),
        ...(config || {}),
    };
    await (0, spawn_1.runCommand)('git', ['-C', options.workingDirectory, 'config', '--remove-section', 'user'], {}, { logCommand: options.logCommand });
}
exports.unsetCommitter = unsetCommitter;
