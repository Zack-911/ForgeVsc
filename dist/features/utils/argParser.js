"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTopLevelArgs = getTopLevelArgs;
function getTopLevelArgs(argString) {
    let args = [];
    let current = "";
    let depth = 0;
    for (let i = 0; i < argString.length; i++) {
        const char = argString[i];
        if (char === "[") {
            depth++;
            current += char;
        }
        else if (char === "]") {
            depth--;
            current += char;
        }
        else if (char === ";" && depth === 0) {
            args.push(current);
            current = "";
        }
        else {
            current += char;
        }
    }
    if (current.length > 0) {
        args.push(current);
    }
    return args;
}
