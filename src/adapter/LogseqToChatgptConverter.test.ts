import { test, describe, expect, vi } from 'vitest'
import {LogseqToChatgptConverter} from "./LogseqToChatgptConverter";
import { TextEncoder, TextDecoder } from 'util';
import {ILSPluginUser} from "@logseq/libs/dist/LSPlugin";
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.logseq = {
    // @ts-ignore
    Editor: {
        getBlock: vi.fn().mockImplementation(async (blockRefUUID, opts = {includeChildren: false}) => {
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
                case 'image-pdf-highlighting':
                    return { content: '[:span]', page: {originalName: 'hls__C Programing'}, uuid: 'image-pdf-highlighting',
                        properties: {lsType: 'annotation', hlType: 'area', hlStamp: '1111', hlPage: '1'},
                        children: []};
                default:
                    throw new Error("UUID not found");
            }
        })
    }
}
describe('basic rendering test', () => {
    test('basic text', async () => {
        expect(await LogseqToChatgptConverter.convert("Hello\nWorld")).toEqual("Hello\nWorld");
    });
    test('text containing hiccups', async () => {
        expect(await LogseqToChatgptConverter.convert("[:span]")).toEqual("[:span]");
    });
    test('text containing html', async () => {
        expect(await LogseqToChatgptConverter.convert("<span>Hello</span>")).toEqual("<span>Hello</span>");
    })
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
        expect(await LogseqToChatgptConverter.convert("Hello {{embed ((642146e4-bae3-47cf-world))}}")).toEqual("Hello \nWorld");
    });
    test('basic block embed 2', async () => {
        expect(await LogseqToChatgptConverter.convert("Hello \n{{embed ((642146e4-bae3-47cf-world))}}")).toEqual("Hello \nWorld");
    });
});

describe('block embed + block ref tests', () => {
    test('basic block embed + block ref', async () => {
        expect(await LogseqToChatgptConverter.convert("Hello \n{{embed ((642146e4-bae3-nested-hello-world))}}")).toEqual("Hello \nTitle World\nI am not title.");
    });
});

describe('property removal tests', () => {
    test('basic block ref', async () => {
        expect(await LogseqToChatgptConverter.convert("speaker::user\nHello ((642146e4-bae3-47cf-world))")).toEqual("Hello World");
    });
    test('basic block embed', async () => {
        expect(await LogseqToChatgptConverter.convert("speaker::user\nHello \n{{embed ((642146e4-bae3-47cf-world))}}")).toEqual("Hello \nWorld");
    });
});

describe('block embed with children tests', () => {
    test('basic block embed with children', async () => {
        expect(await LogseqToChatgptConverter.convert("Hello\n{{embed ((hello-world-with-children))}}")).toEqual("Hello\n- Title World\n  - Children 1\n  - Children 2\n    - Sub-Children 1");
    });
    test('basic block embed with children 2', async () => {
        expect(await LogseqToChatgptConverter.convert("Hello\nWorld\n{{embed ((hello-world-with-children2))}}")).toEqual("Hello\nWorld\n- Title\n  World\n  - Children 1\n    - Sub-Children 1\n      Some more text\n  - Children 2");
    });
});

describe('pdf image test', () => {
    test('pdf image ref', async () => {
        expect(await LogseqToChatgptConverter.convert("((image-pdf-highlighting))")).toEqual("![](../assets/C Programing/1_image-pdf-highlighting_1111.png)");
    });
    test('pdf image embed', async () => {
        expect(await LogseqToChatgptConverter.convert("{{embed ((image-pdf-highlighting))}}")).toEqual("![](../assets/C Programing/1_image-pdf-highlighting_1111.png)");
    });
});

describe('list of block embed test', () => {
    test('basic list test', async () => {
        expect(await LogseqToChatgptConverter.convert("{{embed [[Hello]]}}\n{{embed ((642146e4-bae3-47cf-world))}}\n{{embed ((642146e4-bae3-47cf-world))}}")).toEqual("{{embed [[Hello]]}}\n- World\n- World");
    });
    // test('basic list test 2', async () => {
    //     expect(await LogseqToChatgptConverter.convert("{{embed ((642146e4-bae3-47cf-world))}} {{embed ((642146e4-bae3-47cf-world))}}")).toEqual("- World\n- World");
    // });
});

export {};
