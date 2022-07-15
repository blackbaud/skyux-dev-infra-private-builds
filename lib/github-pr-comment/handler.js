"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addOrUpdateGithubPrCommentHandler = void 0;
const fs_1 = require("fs");
const fs_extra_1 = require("fs-extra");
const github_1 = require("../utils/github");
async function addOrUpdateGithubPrCommentHandler(options) {
    let comment;
    if (options.commentFile) {
        if (!(0, fs_extra_1.existsSync)(options.commentFile)) {
            throw new Error(`File "${options.commentFile}" does not exist`);
        }
        comment = (0, fs_1.readFileSync)(options.commentFile, 'utf8');
    }
    else {
        comment = `${options.fullComment}`;
    }
    if (!comment) {
        throw new Error('No comment specified');
    }
    await (0, github_1.addOrUpdateGithubPrComment)(options.pr, options.startsWith, comment, {
        httpClient: options.httpClient,
        ownerSlashRepo: options.ownerSlashRepo,
    });
}
exports.addOrUpdateGithubPrCommentHandler = addOrUpdateGithubPrCommentHandler;
