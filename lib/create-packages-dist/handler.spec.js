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
const path_1 = require("path");
describe('create-packages-dist', () => {
    const defaultProjectsConfig = {
        core: {
            distRoot: 'dist/libs/components/core',
            root: '',
            targets: {},
        },
        indicators: {
            distRoot: 'dist/libs/components/indicators',
            root: '',
            targets: {
                postbuild: {},
            },
        },
    };
    let originalProcessEnv;
    async function setupTest(options) {
        const settings = {
            ...{
                version: '6.0.0',
            },
            ...options,
        };
        jest.resetAllMocks();
        jest.resetModules();
        originalProcessEnv = process.env;
        process.env = {
            NPM_TOKEN: 'foobar-token',
        };
        jest.mock('../utils/npm');
        const runCommandMock = jest.fn();
        jest.mock('../utils/spawn', () => ({
            runCommand: runCommandMock,
        }));
        jest.spyOn(console, 'log').mockImplementation(() => {
            return;
        });
        jest.spyOn(console, 'warn').mockImplementation(() => {
            return;
        });
        jest.mock('../get-publishable-projects', () => {
            return {
                getPublishableProjects: jest.fn().mockReturnValue(settings.projects),
            };
        });
        jest.mock('../create-packages-dist/filter-projects-by-target', () => ({
            filterProjectsByTarget: jest.fn((projects, target) => {
                if (target === 'postbuild') {
                    return ['indicators'];
                }
                else {
                    return projects;
                }
            }),
        }));
        const emptyDirMock = jest.fn();
        jest.mock('fs-extra', () => ({
            emptyDir: emptyDirMock,
            existsSync: jest.fn(),
            readFile: jest.fn().mockReturnValue({
                toString: () => {
                    return '{}';
                },
            }),
            readJson: jest.fn((filePath) => {
                const fileName = (0, path_1.basename)(filePath);
                if (fileName === 'package.json') {
                    return {
                        name: '@skyux',
                        version: settings.version,
                        dependencies: [],
                    };
                }
                if (fileName === 'project.json') {
                    const pathFragments = filePath.replace(/(\/|\\)/g, '/').split('/');
                    const projectName = pathFragments[pathFragments.length - 2];
                    return defaultProjectsConfig[projectName];
                }
                if (fileName === 'workspace.json') {
                    throw new Error('File not found');
                }
                return {};
            }),
            writeFile: jest.fn(),
            writeJson: jest.fn(),
        }));
        return {
            emptyDirMock,
            runCommandMock,
        };
    }
    afterEach(() => {
        process.env = originalProcessEnv;
    });
    it('should only create the dist for certain projects if a project list is specified', async () => {
        const { emptyDirMock, runCommandMock } = await setupTest({
            projects: defaultProjectsConfig,
        });
        await Promise.resolve().then(() => __importStar(require('./handler'))).then((m) => m.createPackagesDist({ projects: ['indicators'] }));
        expect(emptyDirMock).toHaveBeenCalledTimes(1);
        expect(runCommandMock).toHaveBeenCalledWith('npx', [
            'nx',
            'run-many',
            '--target=build',
            '--projects=indicators',
            '--parallel',
        ], {
            stdio: 'inherit',
        });
        expect(runCommandMock).toHaveBeenCalledWith('npx', [
            'nx',
            'run-many',
            '--target=postbuild',
            '--projects=indicators',
            '--parallel',
        ], {
            stdio: 'inherit',
            env: { ...process.env, NX_CLOUD_DISTRIBUTED_EXECUTION: 'false' },
        });
    });
    it('should create the dist all projects if a project list is not specified', async () => {
        const { emptyDirMock, runCommandMock } = await setupTest({
            projects: defaultProjectsConfig,
        });
        await Promise.resolve().then(() => __importStar(require('./handler'))).then((m) => m.createPackagesDist({}));
        expect(emptyDirMock).toHaveBeenCalledTimes(1);
        expect(runCommandMock).toHaveBeenCalledWith('npx', [
            'nx',
            'run-many',
            '--target=build',
            '--projects=core,indicators',
            '--parallel',
        ], {
            stdio: 'inherit',
        });
        expect(runCommandMock).toHaveBeenCalledWith('npx', [
            'nx',
            'run-many',
            '--target=postbuild',
            '--projects=indicators',
            '--parallel',
        ], {
            stdio: 'inherit',
            env: { ...process.env, NX_CLOUD_DISTRIBUTED_EXECUTION: 'false' },
        });
    });
});
