import {Prompt} from "../types/Prompt";

export class Continue {
    public static getPrompts() : Prompt[] {
        return [
            {
                name: 'Continue',
                required_input: 'block(s)',
                getPromptPrefixMessages: () => [
                    {'role': 'user', 'content': `I want you to act as a Autocomplete tool. You take the input and complete it factually. DO NOT reply the context in the next reply only. Sample of the conversation is shown below:
                    user: Continue: *text*
                    you: *rest of text*
                    user: *add new info*
                    you: *repeat entire text with added info*
                    `.replaceAll('    ', '').trim()}
                ],
                getPrompt: () => `Continue:`,
                group: 'continue'
            }
        ]
    }
}
