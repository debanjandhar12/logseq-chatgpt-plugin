import {Prompt} from "../types/Prompt";

export class Continue {
    public static getPrompts() : Prompt[] {
        return [
            {
                name: 'Continue',
                required_input: 'block(s)',
                getPromptPrefixMessages: () => [
                    {'role': 'user', 'content': `I want you to act as a Autocomplete tool. You take the input complete it factually. DO NOT reply the context of the question of the user input. Sample of the conversation will show below:
                    user: Continue: *text*
                    you: *text with completion*
                    user: add *new info*
                    you: *text with completion and new info*
                    `.trim()}
                ],
                getPrompt: () => `Continue:`,
                group: 'continue'
            }
        ]
    }
}
