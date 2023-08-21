"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeGlobPattern = void 0;
/**
 * Glob v8 requires patterns only use forward slashes.
 * This function handles the backward slashes used by Windows machines.
 * @see https://github.com/isaacs/node-glob#windows
 */
function normalizeGlobPattern(pattern) {
    return pattern.replace(/\\/g, '/');
}
exports.normalizeGlobPattern = normalizeGlobPattern;
