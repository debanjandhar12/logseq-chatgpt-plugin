import {Prompt} from "../types/Prompt";

export class Fix {
    public static getPrompts() : Prompt[] {
        return [
            {
                name: 'Fix Grammar',
                required_input: 'block(s)',
                getPromptPrefixMessages: () => [
                    {'role': 'user', 'content': `
                    I want you to correct and make the sentence more fluent when asked by me. You take the input and auto correct it. Just reply to user input with correct grammar, DO NOT reply the context of the question of the user input. If the user input is grammatically correct and fluent, just inform user about the same. Sample of the conversation is shown below:
                    user: Fix Grammar: *incorrect text*
                    you: *correct text*
                    user: Fix Grammar: *Grammatically correct text*
                    you: *inform user that the text is grammatically correct*
                    `.replaceAll('    ', '').trim()}
                ],
                getPrompt: () => `Fix Grammar:`,
                group: 'fix'
            },
            {
                name: 'Fix Spelling',
                required_input: 'block(s)',
                getPromptPrefixMessages: () => [
                    {'role': 'user', 'content': `
                    I want you to correct spelling when asked by me. You take the input and auto correct it. Just reply to user input with correct spelling, DO NOT reply the context of the question of the user input. If the user input is correct, just inform user about the same. Sample of the conversation is shown below:
                    user: Fix Spelling: *misspelled text*
                    you: *text with correct spelling*
                    user: Fix Spelling: *text with correct spelling*
                    you: *inform user that the text is correct*
                    `.replaceAll('    ', '').trim()}
                ],
                getPrompt: () => `Fix Spelling:`,
                group: 'fix'
            }
        ]
    }
}
