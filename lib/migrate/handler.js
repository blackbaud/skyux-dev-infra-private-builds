"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrate = void 0;
const fs_extra_1 = require("fs-extra");
const handler_1 = require("../check-lib-missing-peers/handler");
const git_1 = require("../utils/git");
const package_json_1 = require("../utils/package-json");
const spawn_1 = require("../utils/spawn");
const fix_crossvent_1 = require("./migrations/fix-crossvent");
const fix_eslint_numeric_service_1 = require("./migrations/fix-eslint-numeric-service");
const fix_schematics_test_scaffolding_1 = require("./migrations/fix-schematics-test-scaffolding");
async function removeUnwantedMigrations() {
    const migrationsJson = await (0, fs_extra_1.readJson)('migrations.json');
    migrationsJson.migrations = migrationsJson.migrations.filter((x) => {
        return ![
            'opt-out-testbed-teardown',
            'migration-v13-testbed-teardown',
        ].includes(x.name);
    });
    await (0, fs_extra_1.writeJson)('migrations.json', migrationsJson);
}
async function tryNxCommand(command, args = []) {
    const commonArgs = [
        '--all',
        '--parallel',
        '--max-parallel=5',
        '--exclude=ci',
    ];
    try {
        await (0, spawn_1.runCommand)('npx', [
            'nx',
            'run-many',
            `--target=${command}`,
            ...commonArgs,
            ...args,
        ]);
    }
    catch (err) {
        console.error(` [!] Nx target "${command}" failed.`, err);
    }
}
async function migrate(options) {
    if (!(await (0, git_1.isClean)({ compareAgainstRemote: true }))) {
        throw new Error('Local changes detected. Push or stash the changes and try again.');
    }
    // Ensure migrations are executed against the base branch.
    if ((await (0, git_1.getCurrentBranch)()) !== options.baseBranch) {
        throw new Error(`Migrations can only be triggered on the '${options.baseBranch}' branch. ` +
            'Checkout that branch and try again.');
    }
    if (!(0, fs_extra_1.existsSync)('migrations.json')) {
        await (0, git_1.checkoutNewBranch)(`migrate-nx_${new Date().getTime()}`);
        await (0, spawn_1.runCommand)('npm', ['ci']);
        // Uninstall packages that cause problems during the migration.
        // See: https://github.com/nrwl/nx/issues/3186
        // See: https://github.com/nrwl/nx/issues/9388
        await (0, spawn_1.runCommand)('npm', ['uninstall', '@nrwl/cli', '@nrwl/tao']);
        await (0, spawn_1.runCommand)('npx', ['nx', 'migrate', 'latest']);
        await removeUnwantedMigrations();
        await (0, spawn_1.runCommand)('npx', ['nx', 'migrate', '--run-migrations']);
        await Promise.all([
            (0, fix_crossvent_1.fixCrossvent)(),
            (0, fix_eslint_numeric_service_1.fixEslintNumericService)(),
            (0, fix_schematics_test_scaffolding_1.fixSchematicsTestScaffolding)(),
            (0, package_json_1.hardenPackageJsonDependencies)(),
            (0, handler_1.checkLibraryMissingPeers)({ fix: true }),
        ]);
        await (0, spawn_1.runCommand)('npx', ['prettier', '--write', '.']);
    }
    else {
        console.log('Migration has already been run. Skipping.');
    }
    // Run lint, build, and test.
    await tryNxCommand('lint', ['--silent', '--quiet']);
    await tryNxCommand('build');
    await tryNxCommand('postbuild');
    await tryNxCommand('test', [
        '--codeCoverage=false',
        '--browsers=ChromeHeadless',
    ]);
    await tryNxCommand('posttest');
    console.log('Migration completed.');
}
exports.migrate = migrate;
