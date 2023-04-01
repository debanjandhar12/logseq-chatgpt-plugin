import {Prompt} from "../types/Prompt";

export class Fix {
    public static getPrompts() : Prompt[] {
        return [
            {
                name: 'Fix Grammar',
                required_input: 'block(s)',
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
