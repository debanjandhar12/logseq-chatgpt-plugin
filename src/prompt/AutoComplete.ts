import {Prompt} from "../types/Prompt";
import {UserChatMessage} from "../langchain/schema/UserChatMessage";

export class AutoComplete {
    public static getPrompts() : Prompt[] {
        return [
            {
                name: 'Continue',
                required_input: 'block(s)',
                getPromptPrefixMessages: () => [
                    new UserChatMessage(`I want you to act as a Autocomplete tool. You take the input and complete it factually. DO NOT reply the context in the next reply only. Sample of the conversation is shown below:
                    user: Continue: *text*
                    you: *rest of text*
                    user: *add new info*
                    you: *repeat entire text with added info*
                    `.replaceAll('    ', '').trim())
                ],
                getPrompt: () => `Continue:`,
                group: 'auto-complete'
            },
            {
                name: 'Fill in the blank',
                required_input: 'block(s)',
                getPromptPrefixMessages: () => [
                    new UserChatMessage(`I want you to act as a Fill in the blank tool. You take the input and fill the blanks as marked factually. DO NOT reply the context.`)
                ],
                getPrompt: () => `Fill in the blank:`,
                group: 'auto-complete'
            }
        ]
    }
}
