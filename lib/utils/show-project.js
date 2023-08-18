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
exports.showProject = exports.showAllProjects = void 0;
const spawn_1 = require("./spawn");
const cache = {};
/**
 * Try three approaches for getting the NX workspace graph:
 *  1. Use the local cache from an NX workspace, taking advantage of the NX daemon if available.
 *  2. Create the project graph in the same process via the @nx/devkit package.
 *  3. Call `npx nx graph --file=stdout` in a child process and read the output.
 */
async function showAllProjects(options) {
    const command = options?.getCommandOutput || spawn_1.getCommandOutput;
    if (Object.keys(cache).length === 0) {
        let graph;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await Promise.resolve().then(() => __importStar(require('@nx/devkit'))).then(async (devkit) => {
            try {
                graph = devkit.readCachedProjectGraph();
            }
            catch (e) {
                graph = await devkit.createProjectGraphAsync();
            }
            if (graph) {
                return Promise.resolve();
            }
            else {
                return Promise.reject();
            }
        })
            .catch(async () => {
            graph = await command('npx', ['nx', 'graph', '--file=stdout']).then((json) => JSON.parse(json).graph);
        });
        Object.keys(graph.nodes).forEach((projectName) => {
            cache[projectName] = graph.nodes[projectName].data;
        });
    }
    return cache;
}
exports.showAllProjects = showAllProjects;
async function showProject(projectName, options) {
    const projects = await showAllProjects(options);
    if (!projects[projectName]) {
        return Promise.reject(`Project '${projectName}' not found.`);
    }
    else {
        return projects[projectName];
    }
}
exports.showProject = showProject;
