import {LogseqToChatgptConverter} from "./LogseqToChatgptConverter";
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;


logseq.Editor.getBlock = jest.fn().mockImplementation(async (blockRefUUID, opts = {includeChildren: false}) => {
    switch (blockRefUUID) {
        case '642146e4-bae3-47cf-world':
            return { content: 'World', children: [] };
        case '642146e4-bae3-nested-hello-world':
            return { content: '\n\nTitle ((642146e4-bae3-47cf-world))\nI am not title.', children: [] };
        case 'hello-world-with-children':
            return { content: 'Title ((642146e4-bae3-47cf-world))', children: [
                    { content: '\n\nChildren 1',  children: []},
                    { content: '\n\nChildren 2',  children: [{ content: '\n\nSub-Children 1'}]}
                ]};
        case 'hello-world-with-children2':
            return { content: 'Title\n((642146e4-bae3-47cf-world))', children: [
                    { content: '\n\nChildren 1',  children: [{ content: '\n\nSub-Children 1\nSome more text'}]},
                    { content: '\n\nChildren 2',  children: []}
                ]};
        default:
            throw new Error("UUID not found");
    }
});

describe('block ref tests', () => {
    test('basic block ref', async () => {
        expect(await LogseqToChatgptConverter.convert("Hello ((642146e4-bae3-47cf-world))")).toEqual("Hello World");
    });
    test('basic block ref with other links', async () => {
        expect(await LogseqToChatgptConverter.convert(`Hello ((642146e4-bae3-47cf-world)) 
        [Google](http://www.google.com) [Renamed Block Ref](((642146e4-bae3-47cf-world))) a`)).toEqual(`Hello World 
        [Google](http://www.google.com) [Renamed Block Ref](((642146e4-bae3-47cf-world))) a`);
    });
    test('nested basic block ref (with new line at start)', async () => {
        expect(await LogseqToChatgptConverter.convert("Hello ((642146e4-bae3-nested-hello-world))")).toEqual("Hello Title World");
    });
    test('invalid block ref', async () => {
        expect(await LogseqToChatgptConverter.convert("((invalid-ref))")).toEqual("");
    });
});
describe('block embed tests', () => {
    test('basic block embed', async () => {
        expect(await LogseqToChatgptConverter.convert("Hello {{embed ((642146e4-bae3-47cf-world))}}")).toEqual("Hello \nWorld\n");
    });
    test('basic block embed 2', async () => {
        expect(await LogseqToChatgptConverter.convert("Hello \n{{embed ((642146e4-bae3-47cf-world))}}")).toEqual("Hello \nWorld\n");
    });
});

describe('block embed + block ref tests', () => {
    test('basic block embed + block ref', async () => {
        expect(await LogseqToChatgptConverter.convert("Hello \n{{embed ((642146e4-bae3-nested-hello-world))}}")).toEqual("Hello \nTitle World\nI am not title.\n");
    });
});

describe('property removal tests', () => {
    test('basic block ref', async () => {
        expect(await LogseqToChatgptConverter.convert("speaker::user\nHello ((642146e4-bae3-47cf-world))")).toEqual("Hello World");
    });
    test('basic block embed', async () => {
        expect(await LogseqToChatgptConverter.convert("speaker::user\nHello \n{{embed ((642146e4-bae3-47cf-world))}}")).toEqual("Hello \nWorld\n");
    });
});

describe('block embed with children tests', () => {
    test('basic block embed with children', async () => {
        expect(await LogseqToChatgptConverter.convert("Hello\n{{embed ((hello-world-with-children))}}")).toEqual("Hello\n- Title World\n  - Children 1\n  - Children 2\n    - Sub-Children 1\n");
    });
    test('basic block embed with children 2', async () => {
        expect(await LogseqToChatgptConverter.convert("Hello\nWorld\n{{embed ((hello-world-with-children2))}}")).toEqual("Hello\nWorld\n- Title\n  World\n  - Children 1\n    - Sub-Children 1\n      Some more text\n  - Children 2\n");
    });
});

export {};
