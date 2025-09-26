"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAndPushTag = exports.doesThisRefExist = exports.doesThisTagExist = exports.getReleaseTags = exports.getCommitsToFile = exports.getDiffNumbersForStagedChanges = exports.resetFilesToCommit = exports.getPackageVersionForCommit = exports.getContentAtCommit = exports.unsetCommitter = exports.setCommitter = exports.push = exports.mergeTheirChanges = exports.commit = exports.isAzureDevOps = exports.isGitHub = exports.getRemoteUrl = exports.getLastCommit = exports.isClean = exports.getCurrentBranch = exports.pull = exports.fetchAll = exports.checkoutNewBranch = exports.remove = exports.addAll = void 0;
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
exports.checkoutNewBranch = checkoutNewBranch;
async function fetchAll(config) {
    const options = {
        workingDirectory: process.cwd(),
        ...(config || {}),
    };
    return (0, spawn_1.getCommandOutput)('git', ['-C', options.workingDirectory, 'fetch', '--all', '--tags'], {}, { logCommand: options.logCommand });
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
    const porcelainStatus = await (0, spawn_1.getCommandOutput)('git', ['-C', options.workingDirectory, 'status', '--porcelain'], {}, { logCommand: options.logCommand });
    let isClean = !porcelainStatus.trim();
    if (isClean && options.compareAgainstRemote) {
        const status = await (0, spawn_1.getCommandOutput)('git', ['-C', options.workingDirectory, 'status'], {}, { logCommand: options.logCommand });
        isClean = status.includes('Your branch is up to date');
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
async function isGitHub(config) {
    const remoteUrl = await getRemoteUrl(config);
    const url = new URL(remoteUrl);
    return url.hostname.toLowerCase() === 'github.com';
}
exports.isGitHub = isGitHub;
async function isAzureDevOps(config) {
    const remoteUrl = await getRemoteUrl(config);
    const url = new URL(remoteUrl);
    return (url.hostname.toLowerCase() === 'dev.azure.com' ||
        url.hostname.toLowerCase().endsWith('.visualstudio.com'));
}
exports.isAzureDevOps = isAzureDevOps;
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
exports.mergeTheirChanges = mergeTheirChanges;
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
exports.getContentAtCommit = getContentAtCommit;
async function getPackageVersionForCommit(commit, config) {
    return await getContentAtCommit('package.json', commit, config)
        .then((content) => {
        const { version } = JSON.parse(content);
        return version;
    })
        .catch(() => undefined);
}
exports.getPackageVersionForCommit = getPackageVersionForCommit;
async function resetFilesToCommit(fileNames, commit, config) {
    const options = {
        workingDirectory: process.cwd(),
        ...(config || {}),
    };
    await (0, spawn_1.runCommand)('git', ['-C', options.workingDirectory, 'checkout', commit, '--', ...fileNames], {}, config);
}
exports.resetFilesToCommit = resetFilesToCommit;
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
exports.getDiffNumbersForStagedChanges = getDiffNumbersForStagedChanges;
async function getCommitsToFile(pattern, branch, fileName, config) {
    return await (0, spawn_1.getCommandOutput)('git', ['log', `--grep=${pattern}`, '--format=%H', `${branch}`, '--', fileName], {}, config).then((output) => (output || '').split('\n').filter((line) => line));
}
exports.getCommitsToFile = getCommitsToFile;
async function getReleaseTags(config) {
    const releaseTags = await (0, spawn_1.getCommandOutput)('git', ['tag', '-l', '--format=%(objectname) %(refname:strip=2)', 'v*'], {}, config).then((output) => (output || '').split('\n').filter((line) => line));
    return Object.fromEntries(releaseTags.map((tag) => tag.split(' ')));
}
exports.getReleaseTags = getReleaseTags;
async function doesThisTagExist(tag, config) {
    const options = {
        workingDirectory: process.cwd(),
        ...(config || {}),
    };
    const tags = await (0, spawn_1.getCommandOutput)('git', ['-C', options.workingDirectory, 'tag', '-l', tag], {}, options).then((output) => (output || '').split('\n').filter((line) => line));
    return tags.includes(tag);
}
exports.doesThisTagExist = doesThisTagExist;
async function doesThisRefExist(ref, config) {
    const options = {
        workingDirectory: process.cwd(),
        ...(config || {}),
    };
    return await (0, spawn_1.getCommandOutput)('git', ['-C', options.workingDirectory, 'show-ref', '--hash', '--', ref], {}, options)
        .then((output) => !!(output || '').trim())
        .catch(() => false);
}
exports.doesThisRefExist = doesThisRefExist;
async function createAndPushTag(tag, commit, remote, options) {
    await (0, spawn_1.runCommand)('git', ['tag', tag, commit], {}, {
        logCommand: options.logCommand,
    });
    await (0, spawn_1.runCommand)('git', ['push', remote, tag], {}, {
        logCommand: options.logCommand,
    });
}
exports.createAndPushTag = createAndPushTag;
