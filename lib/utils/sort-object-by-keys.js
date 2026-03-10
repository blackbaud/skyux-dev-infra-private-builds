"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortObjectByKeys = sortObjectByKeys;
function sortObjectByKeys(obj) {
    if (!obj) {
        return;
    }
    return Object.keys(obj)
        .sort()
        .reduce((item, key) => {
        item[key] = obj[key];
        return item;
    }, {});
}
