import {Prompt} from "../types/Prompt";

export class Continue {
    public static getPrompts() : Prompt[] {
        return [
            {
                name: 'Continue',
                required_input: 'block(s)',
                getPromptPrefixMessages: () => [
                    {'role': 'user', 'content': `I want you to act as a Autocomplete tool. You take the input complete it factually. DO NOT reply the context of the question of the user input. Sample of the conversation is shown below:
                    user: Continue: *text*
                    you: *rest of text*
                    user: *add new info*
                    you: *complete text*
                    user: *question related to text*
                    you: *complete text*
                    `.replaceAll('    ', '').trim()}
                ],
                getPrompt: () => `Continue:`,
                group: 'continue'
            }
        ]
    }
}
