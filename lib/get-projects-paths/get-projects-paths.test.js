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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const os_1 = __importDefault(require("os"));
const get_projects_paths_1 = require("./get-projects-paths");
describe('get-projects-paths', () => {
    it('should getProjectsPaths', async () => {
        let tempFile = '';
        const result = await (0, get_projects_paths_1.getProjectsPaths)(['project1', 'project2'], {
            runCommand: (command, args) => {
                expect(command).toEqual('npx');
                expect(args.slice(0, 2)).toEqual(['nx', 'graph']);
                expect(args[2].startsWith('--file=')).toBeTruthy();
                tempFile = args[2].split('=')[1];
                expect(tempFile.startsWith(os_1.default.tmpdir())).toBeTruthy();
                fs.writeFileSync(tempFile, JSON.stringify({
                    graph: {
                        nodes: {
                            project1: {
                                data: {
                                    root: 'libs/project1',
                                },
                            },
                            project2: {
                                data: {
                                    root: 'libs/project2',
                                },
                            },
                        },
                    },
                }));
                return Promise.resolve();
            },
        });
        expect(result).toEqual({
            project1: 'libs/project1',
            project2: 'libs/project2',
        });
        expect(fs.existsSync(tempFile)).toBeFalsy();
    });
});
