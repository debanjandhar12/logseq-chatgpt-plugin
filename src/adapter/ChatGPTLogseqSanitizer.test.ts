import {ChatGPTLogseqSanitizer} from "./ChatGPTLogseqSanitizer";

describe('basic tests', () => {
    test('basic markdown input string', () => {
        expect(ChatGPTLogseqSanitizer.sanitize("Hello **World**!")).toMatch("Hello **World**!");
    });
    test('basic markdown input string 2', () => {
        const input = '#heading \nThis is some plain text';
        const expectedOutput = '#heading \nThis is some plain text';
        expect(ChatGPTLogseqSanitizer.sanitize(input)).toMatch(expectedOutput);
    });
    test('empty input string', () => {
        expect(ChatGPTLogseqSanitizer.sanitize("")).toMatch("");
    });
});
describe('unicode support tests', () => {
    test('unicode input string', () => {
        expect(ChatGPTLogseqSanitizer.sanitize("Hello **世界**!")).toMatch("Hello **世界**!");
    });
});

describe('list sanitization tests', () => {
    test('basic list conversion', () => {
        const input = `- Main item 1\n- Main item 2`;
        const expected = `* Main item 1\n* Main item 2`;
        expect(ChatGPTLogseqSanitizer.sanitize(input)).toMatch(expected);
    });
    test('basic list conversion 2', () => {
        const input = `Hello **World!**!\n- Main item 1\n- Main item 2\n_This will not get converted:- :)_`;
        const expected = `Hello **World!**!\n* Main item 1\n* Main item 2\n_This will not get converted:- :)_`;
        expect(ChatGPTLogseqSanitizer.sanitize(input)).toMatch(expected);
    });
    test('"nested list conversion', () => {
        const input = `List 1:
        - Main item 1
            - Sub-item A
            - Sub-item B
        - Main item 2`;
        const expected = `List 1:
        * Main item 1
            * Sub-item A
            * Sub-item B
        * Main item 2`;
        expect(ChatGPTLogseqSanitizer.sanitize(input)).toMatch(expected);
    });
    test('"nested nested list conversion', () => {
        const input = `List 1:
        - Main item 1
            - Sub-item A
                - Sub-sub-item 1
                - Sub-sub-item 2
            - Sub-item B
        - Main item 2`;
        const expected = `List 1:
        * Main item 1
            * Sub-item A
                * Sub-sub-item 1
                * Sub-sub-item 2
            * Sub-item B
        * Main item 2`;
        expect(ChatGPTLogseqSanitizer.sanitize(input)).toMatch(expected);
    });
    test('avoid code blocks during list conversion', () => {
        const input = `Not a list:
        \`\`\`
            - Main item 1
              - Sub-item A
              - Sub-item B
        \`\`\`
        An actual list:
        - Main item 1`;
        const expected = `Not a list:
        \`\`\`
            - Main item 1
              - Sub-item A
              - Sub-item B
        \`\`\`
        An actual list:
        * Main item 1`;
        expect(ChatGPTLogseqSanitizer.sanitize(input)).toMatch(expected);
    });
    test('avoid inline code blocks during list conversion', () => {
        const input = `Not a list:
        \`- Main item 1\`
        An actual list:
        - Main item 1`;
        const expected = `Not a list:
        \`- Main item 1\`
        An actual list:
        * Main item 1`;
        expect(ChatGPTLogseqSanitizer.sanitize(input)).toMatch(expected);
    });
    test('avoid bold text during list conversion', () => {
        const input = `Not a list:
        **- Main item 1**`;
        expect(ChatGPTLogseqSanitizer.sanitize(input)).toMatch(input);
    });
    test('avoid header during list conversion', () => {
        const input = `# - Main item 1`;
        expect(ChatGPTLogseqSanitizer.sanitize(input)).toMatch(input);
    });
    test('avoid table during list conversion', () => {
        const input = `| - First word 1 | Second word 1 |
                       |- First word 2 | Second word 2 |`;
        expect(ChatGPTLogseqSanitizer.sanitize(input)).toMatch(input);
    });
});

export {};