"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortObjectByKeys = void 0;
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
exports.sortObjectByKeys = sortObjectByKeys;
