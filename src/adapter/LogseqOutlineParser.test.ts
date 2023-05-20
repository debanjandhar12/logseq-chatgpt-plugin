import { test, describe, expect } from 'vitest'
import {LogseqOutlineParser} from "./LogseqOutlineParser";
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

describe('basic tests', () => {
    test('single item', () => {
        expect(LogseqOutlineParser.parse("* Hello\n  World")).toMatchObject([{content: 'Hello\nWorld', children: []}]);
    });
    test('multiple items', () => {
        expect(LogseqOutlineParser.parse("* Hello\n  World\n* Oh\n  Good")).toMatchObject([{content: 'Hello\nWorld', children: []}, {content: 'Oh\nGood', children: []}]);
    });
    test('multiple nested items', () => {
        expect(LogseqOutlineParser.parse("* Hello\n  World\n  * Oh\n   Good")).toMatchObject([{content: 'Hello\nWorld', children: [{content: 'Oh\nGood', children: []}]}]);
    });
});

describe('deeply nested tests', () => {
    test('deeply nested test', () => {
        expect(LogseqOutlineParser.parse("* Hello\n  World\n  * Oh\n   * Oh2")).toMatchObject([{content: 'Hello\nWorld', children: [{content: 'Oh', children: [{content: 'Oh2', children: []}]}]}]);
        // Please fix the bellow case. That is how logseq behaves:
        // expect(LogseqOutlineParser.parse("* Hello\n  World\n  * Oh\n * Oh2")).toMatchObject([{content: 'Hello\nWorld', children: [{content: 'Oh', children: []}]}, {content: 'Oh2', children: []}]);
    });
    test('deeply nested test2', () => {
        expect(LogseqOutlineParser.parse("* Hello\n  World\n  * Oh\n   * Oh2\n* Hello2\n  World2\n  * Oh2\n   * Oh22")).toMatchObject([{content: 'Hello\nWorld', children: [{content: 'Oh', children: [{content: 'Oh2', children: []}]}]}, {content: 'Hello2\nWorld2', children: [{content: 'Oh2', children: [{content: 'Oh22', children: []}]}]}]);
    });
});
