import { TextEncoder, TextDecoder } from 'util';
import {removePropsFromBlockContent} from "./removePropsFromBlockContent";
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

describe('test with no properties', () => {
    test('basic markdown with no properties', () => {
        expect(removePropsFromBlockContent("Hello **World**!")).toMatch("Hello **World**!");
    });
});

describe('tests with properties', () => {
    test('single prop in first line', () => {
        expect(removePropsFromBlockContent("speaker::[[user]]\nHello **World**!")).toEqual("Hello **World**!");
    });
    test('single prop in second line', () => {
        expect(removePropsFromBlockContent("# Hello **World**!\nspeaker::[[user]]")).toEqual("# Hello **World**!");
    });
    test('single prop in second line with other content than header', () => {
        expect(removePropsFromBlockContent("# Hello **World**!\nspeaker::[[user]]\nHello\nWorld")).toEqual("# Hello **World**!\nHello\nWorld");
    });
    test('multiple prop in first line', () => {
        expect(removePropsFromBlockContent("speaker::[[user]]\ntype::[[chat]]\nHello **World**!")).toEqual("Hello **World**!");
    });
    test('multiple prop in second line', () => {
        expect(removePropsFromBlockContent("# Hello **World**!\nspeaker::[[user]]\ntype::[[chat]]")).toEqual("# Hello **World**!");
    });
    test('multiple prop in second line with other content than header', () => {
        expect(removePropsFromBlockContent("# Hello **World**!\nspeaker::[[user]]\ntype::[[chat]]\nHello\nWorld")).toEqual("# Hello **World**!\nHello\nWorld");
    });
});

describe('edge cases', () => {
    test('single prop in first line with empty lines at start', () => {
        expect(removePropsFromBlockContent("\n\n\n \n\nspeaker::[[user]]\nHello **World**!")).toEqual("Hello **World**!");
    });
});
