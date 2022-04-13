"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testAffected = void 0;
/**
 * - Runs all Karma unit tests for affected projects in a single browser instance.
 * - BrowserStack also executes this file to run all Karma tests in various browsers.
 * - Non-Karma tests are executed normally using `nx affected:test`.
 */
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const spawn_1 = require("../utils/spawn");
const CWD = process.cwd();
// Always ignore these projects for test.
const IGNORE_PROJECTS = ['ci'];
const TEST_ENTRY_FILE = (0, path_1.join)(CWD, '__test-affected.ts');
const TEST_TSCONFIG_FILE = (0, path_1.join)(CWD, '__tsconfig.test-affected.json');
async function getAngularJson() {
    return (0, fs_extra_1.readJson)((0, path_1.join)(CWD, 'angular.json'));
}
/**
 * Returns affected projects for a given architect target.
 * @param {string} target One of build, test, lint, etc.
 * @returns An array of project names.
 */
async function getAffectedProjects(target) {
    const affectedStr = await (0, spawn_1.getCommandOutput)('npx', [
        'nx',
        'print-affected',
        `--target=${target}`,
        '--select=tasks.target.project',
    ]);
    if (!affectedStr) {
        return [];
    }
    return affectedStr
        .split(', ')
        .filter((project) => !project.endsWith('-testing') && !IGNORE_PROJECTS.includes(project));
}
async function getUnaffectedProjects(affectedProjects, angularJson) {
    return Object.keys(angularJson.projects).filter((project) => !affectedProjects.includes(project) && !project.endsWith('-testing'));
}
async function getAffectedProjectsForTest(angularJson, onlyComponents) {
    const projects = await getAffectedProjects('test');
    const karma = [];
    const jest = [];
    projects.forEach((project) => {
        if (!onlyComponents ||
            (onlyComponents &&
                angularJson.projects[project].projectType === 'library')) {
            if (angularJson.projects[project].architect.test.builder ===
                '@angular-devkit/build-angular:karma') {
                karma.push(project);
            }
            else {
                jest.push(project);
            }
        }
    });
    return {
        karma,
        jest,
    };
}
async function createTempTestingFiles(karmaProjects, angularJson) {
    let entryContents = `import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

declare const require: {
  context(path: string, deep?: boolean, filter?: RegExp): {
    keys(): string[];
    <T>(id: string): T;
  };
};

// Fix for crossvent "global is not defined" error. The crossvent library
// is used by Dragula, which in turn is used by multiple SKY UX components.
// See: https://github.com/bevacqua/dragula/issues/602
(window as any).global = window;

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
  { teardown: { destroyAfterEach: true }},
);
`;
    // Generate a 'require.context' RegExp that includes only the affected projects.
    entryContents += `
const context = require.context('./', true, /(apps|libs)\\/(.+\\/)?(${karmaProjects.join('|')})\\/src\\/.+\\.spec\\.ts$/);
context.keys().map(context);
`;
    await (0, fs_extra_1.writeFile)(TEST_ENTRY_FILE, entryContents);
    const tsconfig = {
        extends: './tsconfig.base.json',
        compilerOptions: {
            declaration: true,
            declarationMap: true,
            inlineSources: true,
            outDir: './dist/out-tsc',
            types: ['jasmine', 'node'],
        },
        files: ['./__test-affected.ts'],
        include: ['**/*.d.ts'],
        angularCompilerOptions: {
            compilationMode: 'partial',
        },
    };
    // Add affected projects' files to tsconfig 'include' field.
    for (const project of karmaProjects) {
        tsconfig.include.push(`${angularJson.projects[project].root}/**/*.spec.ts`);
    }
    await (0, fs_extra_1.writeJson)(TEST_TSCONFIG_FILE, tsconfig, { spaces: 2 });
}
function removeTempTestingFiles() {
    if ((0, fs_extra_1.existsSync)(TEST_ENTRY_FILE)) {
        (0, fs_extra_1.removeSync)(TEST_ENTRY_FILE);
    }
    if ((0, fs_extra_1.existsSync)(TEST_TSCONFIG_FILE)) {
        (0, fs_extra_1.removeSync)(TEST_TSCONFIG_FILE);
    }
}
function getCodeCoverageExcludes(affectedProjects, angularJson) {
    return ['**/fixtures/**', '*.fixture.ts'].concat(Object.keys(angularJson.projects)
        .filter((projectName) => !IGNORE_PROJECTS.includes(projectName) &&
        !affectedProjects.includes(projectName) &&
        !projectName.endsWith('-testing'))
        .map((projectName) => `${angularJson.projects[projectName].root}/**/*`));
}
async function runKarmaTests(affectedProjects, angularJson, config) {
    const npxArgs = [
        'nx',
        'run',
        'ci:test-affected',
        `--codeCoverage=${config.codeCoverage}`,
    ];
    if (config.codeCoverage) {
        npxArgs.push(`--codeCoverageExclude=${getCodeCoverageExcludes(affectedProjects, angularJson).join(',')}`);
    }
    if (config.karmaConfig) {
        npxArgs.push(`--karmaConfig=${config.karmaConfig}`);
    }
    await (0, spawn_1.runCommand)('npx', npxArgs, {
        env: { ...process.env, NX_CLOUD_DISTRIBUTED_EXECUTION: 'false' },
    });
}
function logProjectsArray(message, projects) {
    if (projects.length > 0) {
        console.log(`${message}
 - ${projects.join('\n - ')}
`);
    }
}
process.on('SIGINT', () => process.exit());
process.on('uncaughtException', () => process.exit());
process.on('exit', () => removeTempTestingFiles());
async function testAffected(options) {
    const codeCoverage = options.codeCoverage;
    const karmaConfig = options.karmaConfig;
    // Only run tests against component libraries?
    const onlyComponents = options.onlyComponents === true;
    const angularJson = await getAngularJson();
    const affectedProjects = await getAffectedProjectsForTest(angularJson, onlyComponents);
    if (affectedProjects.karma.length === 0 &&
        affectedProjects.jest.length === 0) {
        console.log('No affected projects. Aborting tests.');
        process.exit(0);
    }
    if (affectedProjects.karma.length > 0) {
        const unaffectedProjects = await getUnaffectedProjects(affectedProjects.karma.concat(affectedProjects.jest), angularJson);
        logProjectsArray('Running Karma tests for the following affected projects:', affectedProjects.karma);
        logProjectsArray('Ignoring the following projects:', unaffectedProjects);
        await createTempTestingFiles(affectedProjects.karma, angularJson);
        await runKarmaTests(affectedProjects.karma, angularJson, {
            codeCoverage,
            karmaConfig,
        });
    }
    // Run non-Karma tests normally, using Nx CLI.
    if (!onlyComponents && affectedProjects.jest.length > 0) {
        logProjectsArray('Running non-Karma tests for the following projects:', affectedProjects.jest);
        await (0, spawn_1.runCommand)('npx', [
            'nx',
            'run-many',
            '--target=test',
            `--projects=${affectedProjects.jest.join(',')}`,
            `--codeCoverage=${codeCoverage}`,
            '--silent',
            '--runInBand',
        ]);
    }
    // Run posttest steps.
    await (0, spawn_1.runCommand)('npx', [
        'nx',
        'affected',
        '--target=posttest',
        `--exclude=${IGNORE_PROJECTS.join(',')}`,
    ], {
        env: { ...process.env, NX_CLOUD_DISTRIBUTED_EXECUTION: 'false' },
    });
    console.log('Library tests completed successfully.');
}
exports.testAffected = testAffected;
