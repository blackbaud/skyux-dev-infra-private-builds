#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const cli_1 = require("../lib/check-lib-dependencies/cli");
const cli_2 = require("../lib/check-lib-missing-peers/cli");
const cli_3 = require("../lib/check-lib-resources/cli");
const cli_4 = require("../lib/cherry-pick/cli");
const cli_5 = require("../lib/create-lib-resources/cli");
const cli_6 = require("../lib/create-packages-dist/cli");
const cli_7 = require("../lib/e2e-workflow/cli");
const cli_8 = require("../lib/github-pages/cli");
const cli_9 = require("../lib/github-pr-comment/cli");
const cli_10 = require("../lib/migrate/cli");
const cli_11 = require("../lib/pristine-commit/cli");
const cli_12 = require("../lib/publish-packages-dist/cli");
const cli_13 = require("../lib/publish-storybook/cli");
const cli_14 = require("../lib/workflow/cli");
const parser = (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
    .command(cli_1.CheckLibraryDependenciesModule)
    .command(cli_2.CheckLibraryMissingPeersModule)
    .command(cli_3.CheckLibraryResourcesModule)
    .command(cli_4.CherryPickModule)
    .command(cli_5.CreateLibraryResourcesModule)
    .command(cli_6.CreatePackagesDistModule)
    .command(cli_7.E2eWorkflowModule)
    .command(cli_8.GithubPagesMirrorModule)
    .command(cli_8.GithubPagesRemoveOldPrsModule)
    .command(cli_8.GithubPagesPublishModule)
    .command(cli_9.GithubPrCommentModule)
    .command(cli_10.MigrateModule)
    .command(cli_11.PristineCommitModule)
    .command(cli_12.PublishPackagesDistModule)
    .command(cli_13.PublishStorybookModule)
    .command(cli_14.WorkflowModule)
    .help()
    .strict()
    .demandCommand(1, 'Provide a command (or type --help to see a list of commands).')
    .fail(false);
(async () => {
    try {
        await parser.parse();
    }
    catch (err) {
        console.error(`\n[!] ${err.message}\n`, err);
        process.exit(1);
    }
})();
