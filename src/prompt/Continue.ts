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
                    you: *completed text*
                    user: *add new info*
                    you: *completed text with added info*
                    user: *question related to text*
                    you: *completed text with answer to the question*
                    `.replaceAll('    ', '').trim()}
                ],
                getPrompt: () => `Continue:`,
                group: 'continue'
            }
        ]
    }
}
