import {LogseqToChatgptConverter} from "./LogseqToChatgptConverter";
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;


logseq.Editor.getBlock = jest.fn().mockImplementation(async (blockRefUUID) => {
    switch (blockRefUUID) {
        case '642146e4-bae3-47cf-world':
            return { content: 'World' };
        case '642146e4-bae3-nested-hello-world':
            return { content: '\n\nTitle ((642146e4-bae3-47cf-world))\nI am not title.' };
        default:
            throw new Error("UUID not found");
    }
});

describe('block ref tests', () => {
    test('basic block ref', async () => {
        expect(await LogseqToChatgptConverter.convert("Hello ((642146e4-bae3-47cf-world))")).toMatch("Hello World");
    });
    test('basic block ref with other links', async () => {
        expect(await LogseqToChatgptConverter.convert(`Hello ((642146e4-bae3-47cf-world)) 
        [Google](http://www.google.com) [Renamed Block Ref](((642146e4-bae3-47cf-world))) a`)).toMatch(`Hello World 
        [Google](http://www.google.com) [Renamed Block Ref](((642146e4-bae3-47cf-world))) a`);
    });
    test('nested basic block ref (with new line at start)', async () => {
        expect(await LogseqToChatgptConverter.convert("Hello ((642146e4-bae3-nested-hello-world))")).toMatch("Hello Title World");
    });
    test('invalid block ref', async () => {
        expect(await LogseqToChatgptConverter.convert("((invalid-ref))")).toMatch("");
    });
});
describe('block embed tests', () => {
    test('basic block embed', async () => {
        expect(await LogseqToChatgptConverter.convert("Hello {{embed ((642146e4-bae3-47cf-world))}}")).toMatch("Hello \n------\nWorld\n------\n");
    });
    test('basic block embed 2', async () => {
        expect(await LogseqToChatgptConverter.convert("Hello \n{{embed ((642146e4-bae3-47cf-world))}}")).toMatch("Hello \n------\nWorld\n------\n");
    });
});

describe('block embed + block ref tests', () => {
    test('basic block embed + block ref', async () => {
        expect(await LogseqToChatgptConverter.convert("Hello \n{{embed ((642146e4-bae3-nested-hello-world))}}")).toMatch("Hello \n------\nTitle World\nI am not title.\n------\n");
    });
});

describe('property removal tests', () => {
    test('basic block ref', async () => {
        expect(await LogseqToChatgptConverter.convert("speaker::user\nHello ((642146e4-bae3-47cf-world))")).toMatch("Hello World");
    });
    test('basic block embed', async () => {
        expect(await LogseqToChatgptConverter.convert("speaker::user\nHello \n{{embed ((642146e4-bae3-47cf-world))}}")).toMatch("Hello \n------\nWorld\n------\n");
    });
});


export {};
