import {Prompt, PromptVisibility} from "../types/Prompt";
import {UserChatMessage} from "../langchain/schema/UserChatMessage";
import Mustache from "mustache";

export class AutoComplete {
    public static getPrompts() : Prompt[] {
        return [
            {
                name: 'Continue',
                isVisibleInCommandPrompt: PromptVisibility.Blocks,
                getPromptPrefixMessages: () => [
                    new UserChatMessage(`I want you to act as a Autocomplete tool. You take the input and complete it factually. DO NOT reply the context in the next reply only. Sample of the conversation is shown below:
                    user: Continue: *text*
                    you: *rest of text*
                    user: *add new info*
                    you: *repeat entire text with added info*
                    `.replaceAll('    ', '').trim())
                ],
                getPromptMessage: (userInput, invokeState) =>
                    Mustache.render(`Continue:\n{{selectedBlocksList}}`,{
                        selectedBlocksList: invokeState.selectedBlocks.map(b => `{{embed ((${b.uuid}))}}`).join('\n')}),
                group: 'auto-complete'
            },
            {
                name: 'Fill in the blank',
                isVisibleInCommandPrompt: PromptVisibility.Blocks,
                getPromptPrefixMessages: () => [
                    new UserChatMessage(`I want you to act as a Fill in the blank tool. You take the input and fill the blanks as marked factually. DO NOT reply the context.`)
                ],
                getPromptMessage: (userInput, invokeState) =>
                    Mustache.render(`Fill in the Blank:{{selectedBlocksList}}`,{
                        selectedBlocksList: invokeState.selectedBlocks.map(b => `\n{{embed ((${b.uuid}))}}`)}),
                group: 'auto-complete'
            }
        ]
    }
}
