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
exports.getProjectsPaths = void 0;
const fs = __importStar(require("fs"));
const os_1 = __importDefault(require("os"));
const spawn_1 = require("../utils/spawn");
async function getProjectsPaths(projects, options) {
    const tmpFile = os_1.default.tmpdir() + `/projects-graph-${(Math.random() * 1e9).toString(32)}.json`;
    /* istanbul ignore next */
    const command = options?.runCommand || spawn_1.runCommand;
    await command('npx', ['nx', 'graph', `--file=${tmpFile}`]);
    /* istanbul ignore if */
    if (!fs.existsSync(tmpFile)) {
        throw new Error(`Unable to retrieve project graph.`);
    }
    const { graph } = JSON.parse(fs.readFileSync(tmpFile, 'utf8'));
    fs.rmSync(tmpFile);
    const result = {};
    for (const project of projects) {
        const projectNode = graph.nodes[project];
        /* istanbul ignore if */
        if (!projectNode) {
            throw new Error(`Project '${project}' not found.`);
        }
        result[project] = projectNode.data.root;
    }
    return result;
}
exports.getProjectsPaths = getProjectsPaths;
