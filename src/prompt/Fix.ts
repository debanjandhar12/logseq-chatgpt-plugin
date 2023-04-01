import {Prompt} from "../types/Prompt";

export class Fix {
    public static getPrompts() : Prompt[] {
        return [
            {
                name: 'Fix Grammar',
                required_input: 'block(s)',
                getPromptPrefixMessages: () => [
                    {'role': 'user', 'content': `
                    You correct and make the sentence more fluent only when asked by user. You take all the user input and auto correct it. Just reply to user input with correct grammar, DO NOT reply the context of the question of the user input. If the user input is grammatically correct and fluent, just inform user about the same. Sample of the conversation will show below:
                    user: Fix Grammar: *incorrect text*
                    you: *correct text*
                    user: Fix Grammar: *Grammatically correct text*
                    you: *inform user that the text is grammatically correct*
                    `.trim()}
                ],
                getPrompt: () => `Fix Grammar:`,
                group: 'fix'
            },
            {
                name: 'Fix Spelling',
                required_input: 'block(s)',
                getPrompt: () => `Fix Spelling:`,
                group: 'fix'
            }
        ]
    }
}
