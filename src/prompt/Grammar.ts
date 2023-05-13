import {Prompt, PromptVisibility} from "../types/Prompt";
import {UserChatMessage} from "../langchain/schema/UserChatMessage";
import Mustache from "mustache";

export class Grammar {
    public static getPrompts() : Prompt[] {
        return [
            {
                name: 'Fix Grammar',
                isVisibleInCommandPrompt: PromptVisibility.Blocks,
                getPromptPrefixMessages: () => [
                    new UserChatMessage(`
                    I want you to correct and make the sentence more fluent when asked by me. You take the input and auto correct it. Just reply to user input with correct grammar, DO NOT reply the context of the question of the user input. If the user input is grammatically correct and fluent, just inform user about the same. Sample of the conversation is shown below:
                    user: Fix grammar: *incorrect text*
                    you: *correct text*
                    user: Fix grammar: *Grammatically correct text*
                    you: *inform user that the text is grammatically correct*
                    `.replaceAll('    ', '').trim())
                ],
                getPromptMessage: (userInput, invokeState) =>
                    Mustache.render(`Fix grammar:\n{{selectedBlocksList}}`,{
                        selectedBlocksList: invokeState.selectedBlocks.map(b => `{{embed ((${b.uuid}))}}`).join('\n')}),
                group: 'grammar'
            }
        ]
    }
}
