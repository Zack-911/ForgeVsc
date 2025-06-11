"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseExpressionIncremental = parseExpressionIncremental;
const parser_1 = require("./parser");
function parseExpressionIncremental(oldText, newText, oldAST = []) {
    if (oldText === newText)
        return oldAST;
    const changeStart = findFirstChangeIndex(oldText, newText);
    const changeEnd = findLastChangeIndex(oldText, newText);
    if (changeStart === -1 || changeEnd === -1) {
        return (0, parser_1.parseExpression)(newText);
    }
    const newAST = [];
    for (const func of oldAST) {
        if (func.rangeInBlock.end < changeStart ||
            func.rangeInBlock.start > changeEnd) {
            newAST.push(func);
        }
    }
    try {
        const reparseText = newText.slice(changeStart, changeEnd);
        const reparseResult = (0, parser_1.parseExpression)(reparseText);
        for (const fn of reparseResult) {
            fn.rangeInBlock.start += changeStart;
            fn.rangeInBlock.end += changeStart;
        }
        return [...newAST, ...reparseResult].sort((a, b) => a.rangeInBlock.start - b.rangeInBlock.start);
    }
    catch {
        return (0, parser_1.parseExpression)(newText);
    }
}
function findFirstChangeIndex(oldText, newText) {
    const len = Math.min(oldText.length, newText.length);
    for (let i = 0; i < len; i++) {
        if (oldText[i] !== newText[i])
            return i;
    }
    return oldText.length !== newText.length ? len : -1;
}
function findLastChangeIndex(oldText, newText) {
    let i = oldText.length - 1;
    let j = newText.length - 1;
    while (i >= 0 && j >= 0 && oldText[i] === newText[j]) {
        i--;
        j--;
    }
    return Math.max(i + 1, j + 1);
}
