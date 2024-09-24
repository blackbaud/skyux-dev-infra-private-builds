"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCommand = exports.getCommandOutput = void 0;
const cross_spawn_1 = __importDefault(require("cross-spawn"));
const CWD = process.cwd();
async function getCommandOutput(command, args = [], spawnOptions = {}, commandOptions = {}) {
    spawnOptions = {
        ...spawnOptions,
        ...{
            stdio: 'pipe', // <-- required to get output
        },
    };
    return runCommand(command, args, spawnOptions, commandOptions).then((output) => output);
}
exports.getCommandOutput = getCommandOutput;
/**
 * Executes a given command in a cross-platform child process.
 * If spawnOptions.stdio is set to 'pipe', the promise will return the command's output as a string.
 */
async function runCommand(command, args = [], spawnOptions = {}, commandOptions = {}) {
    spawnOptions = {
        ...{
            stdio: 'inherit',
            cwd: CWD,
        },
        ...spawnOptions,
    };
    return new Promise((resolve, reject) => {
        if (commandOptions.logCommand) {
            console.log(` `);
            console.log(`# ${command} ${args.map((x) => ` \\\n    "${x}"`).join('')}`);
            console.log(` `);
        }
        const child = (0, cross_spawn_1.default)(command, args, spawnOptions);
        let output = '';
        if (child.stdout) {
            child.stdout.on('data', (x) => (output += x.toString()));
        }
        let error = '';
        if (child.stderr) {
            child.stderr.on('data', (x) => (error += x.toString()));
        }
        child.on('error', (error) => reject(error));
        child.on('exit', (code) => {
            if (code === 0) {
                if (output) {
                    resolve(output.trim());
                }
                else {
                    resolve();
                }
            }
            else {
                console.debug(`Error running command: ${command} ${args.join(' ')}`);
                reject(new Error(error));
            }
        });
    });
}
exports.runCommand = runCommand;
