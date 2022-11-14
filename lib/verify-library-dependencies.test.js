"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const verify_library_dependencies_1 = require("./verify-library-dependencies");
jest.mock('fs-extra');
describe('verify-library-dependencies', () => {
    function setupTest(options) {
        fs_extra_1.readJson.mockImplementation((filePath) => {
            return (0, path_1.basename)(filePath) === 'package.json'
                ? options.projectPackageJson
                : {};
        });
        const spies = {
            logger: jest.spyOn(console, 'log'),
            errorLogger: jest.spyOn(console, 'error'),
        };
        return { spies };
    }
    afterEach(() => {
        jest.resetAllMocks();
        jest.resetModules();
    });
    it('should pass if workspace has installed lowest minor version supported by library peer dependency', async () => {
        const { spies } = setupTest({
            projectPackageJson: {
                peerDependencies: {
                    'mock-peer': '^1.0.0',
                },
            },
        });
        await (0, verify_library_dependencies_1.verifyLibraryDependencies)({
            'my-lib': {
                root: 'projects/my-lib',
            },
        }, {
            dependencies: {
                'mock-peer': '1.0.0',
            },
        });
        expect(spies.logger).toHaveBeenCalledWith(' ✔ Done validating dependencies. OK.');
    });
    it('should throw an error if installed version is greater than minimum library peer dependency', async () => {
        const { spies } = setupTest({
            projectPackageJson: {
                peerDependencies: {
                    'mock-peer': '^1.0.0',
                },
            },
        });
        await expect((0, verify_library_dependencies_1.verifyLibraryDependencies)({
            'my-lib': {
                root: 'projects/my-lib',
            },
        }, {
            dependencies: {
                'mock-peer': '2.0.0', // <-- invalid version installed
            },
        })).rejects.toThrow('Errors found with library dependencies.');
        expect(spies.errorLogger).toHaveBeenCalledWith(' ✘ The version (2.0.0) of the package "mock-peer" in the "dependencies" section ' +
            "of 'package.json' does not meet the minimum version requirements of the range " +
            'defined in the "peerDependencies" section of \'projects/my-lib/package.json\' ' +
            '(wanted "mock-peer@^1.0.0"). Either increase the minimum supported version ' +
            "in 'projects/my-lib/package.json' to (^2.0.0), or downgrade the version " +
            "installed in the root 'package.json' to (1.0.0).");
    });
    it('should throw an error if workspace uses a SemVer range character for a package version', async () => {
        const { spies } = setupTest({
            projectPackageJson: {
                peerDependencies: {
                    'mock-peer': '^1.0.0',
                },
            },
        });
        await expect((0, verify_library_dependencies_1.verifyLibraryDependencies)({
            'my-lib': {
                root: 'projects/my-lib',
            },
        }, {
            dependencies: {
                'mock-peer': '~1.0.0', // <-- range character used
            },
        })).rejects.toThrow('Errors found with library dependencies.');
        expect(spies.errorLogger).toHaveBeenCalledWith(' ✘ The version listed in the workspace \'package.json\' for "mock-peer@~1.0.0" ' +
            'must be set to a specific version (without a SemVer range character), and set ' +
            'to the minimum version satisfied by the range defined in the ' +
            '"peerDependencies" section of \'projects/my-lib/package.json\' ' +
            '(wanted "^1.0.0"). To address this problem, set "mock-peer" to (1.0.0) in ' +
            "the workspace 'package.json'.");
    });
    it('should throw an error if a peer dependency is not listed in the workspace package.json', async () => {
        const { spies } = setupTest({
            projectPackageJson: {
                peerDependencies: {
                    'mock-peer': '^1.0.0',
                },
            },
        });
        await expect((0, verify_library_dependencies_1.verifyLibraryDependencies)({
            'my-lib': {
                root: 'projects/my-lib',
            },
        }, {
            dependencies: {}, // <-- peer dependency not listed
        })).rejects.toThrow('Errors found with library dependencies.');
        expect(spies.errorLogger).toHaveBeenCalledWith(' ✘ The package "mock-peer" listed in the "peerDependencies" section of ' +
            "'projects/my-lib/package.json' was not found in the root 'package.json' " +
            '"dependencies" section. Install the package at the root level and try again.');
    });
    it('should throw an error if a library dependency is not listed in the workspace package.json', async () => {
        const { spies } = setupTest({
            projectPackageJson: {
                dependencies: {
                    'mock-dep': '1.0.0',
                },
            },
        });
        await expect((0, verify_library_dependencies_1.verifyLibraryDependencies)({
            'my-lib': {
                root: 'projects/my-lib',
            },
        }, {
            dependencies: {}, // <-- dependency not listed
        })).rejects.toThrow('Errors found with library dependencies.');
        expect(spies.errorLogger).toHaveBeenCalledWith(' ✘ The package "mock-dep" listed in the "dependencies" section of ' +
            "'projects/my-lib/package.json' was not found in the root 'package.json' " +
            '"dependencies" section. Install the package at the root level and try again.');
    });
    it('should ignore packages that live in the monorepo', async () => {
        const { spies } = setupTest({
            projectPackageJson: {
                peerDependencies: {
                    '@skyux/core': 'VERSION_PLACEHOLDER',
                },
            },
        });
        await (0, verify_library_dependencies_1.verifyLibraryDependencies)({
            core: {
                root: 'projects/core',
                npmName: '@skyux/core',
            },
        }, {});
        expect(spies.logger).toHaveBeenCalledWith(' ✔ Done validating dependencies. OK.');
    });
    describe('multiple supported versions (e.g. "^1 || ^2")', () => {
        it('should pass if workspace has installed one of the lowest minor version supported by library peer dependency', async () => {
            const { spies } = setupTest({
                projectPackageJson: {
                    peerDependencies: {
                        'mock-peer': '^1.0.0 || ^2.0.0',
                    },
                },
            });
            await (0, verify_library_dependencies_1.verifyLibraryDependencies)({
                'my-lib': {
                    root: 'projects/my-lib',
                },
            }, {
                dependencies: {
                    'mock-peer': '2.0.0',
                },
            });
            expect(spies.logger).toHaveBeenCalledWith(' ✔ Done validating dependencies. OK.');
        });
        it('should throw an error if installed version does not satisfy library peer dependency', async () => {
            const { spies } = setupTest({
                projectPackageJson: {
                    peerDependencies: {
                        'mock-peer': '^1.0.0 || ^2.0.0',
                    },
                },
            });
            await expect((0, verify_library_dependencies_1.verifyLibraryDependencies)({
                'my-lib': {
                    root: 'projects/my-lib',
                },
            }, {
                dependencies: {
                    'mock-peer': '2.1.0', // <-- invalid version installed
                },
            })).rejects.toThrow('Errors found with library dependencies.');
            expect(spies.errorLogger).toHaveBeenCalledWith(' ✘ The version (2.1.0) of the package "mock-peer" in the "dependencies" ' +
                "section of 'package.json' does not meet the minimum version requirements " +
                'of the range defined in the "peerDependencies" section of ' +
                '\'projects/my-lib/package.json\' (wanted "mock-peer@^1.0.0 || ^2.0.0"). ' +
                'Either increase the minimum supported version in ' +
                "'projects/my-lib/package.json' to (^2.1.0), or downgrade the version " +
                "installed in the root 'package.json' to (1.0.0).");
        });
    });
});
