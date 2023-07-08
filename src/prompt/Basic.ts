import {Prompt, PromptVisibility} from "../types/Prompt";
import {UserMessage} from "../langchain/schema/UserMessage";
import Mustache from "mustache";

export class Basic {
    public static getPrompts() : Prompt[] {
        return [
            {
                name: 'Continue',
                isVisibleInCommandPrompt: PromptVisibility.Blocks,
                getPromptPrefixMessages: () => [
                    new UserMessage(`I want you to act as a Autocomplete tool. You take the input and complete it factually. DO NOT reply the context in the next reply only. Sample of the conversation is shown below:
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
                name: 'Fix Grammar',
                isVisibleInCommandPrompt: PromptVisibility.Blocks,
                getPromptPrefixMessages: () => [
                    new UserMessage(`
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
                group: 'basic'
            },
            {
                name: 'Summarize (Shorten)',
                isVisibleInCommandPrompt: PromptVisibility.Blocks,
                getPromptMessage: (userInput, invokeState) =>
                    Mustache.render(`Summarize (Shorten):\n{{selectedBlocksList}}`,{
                        selectedBlocksList: invokeState.selectedBlocks.map(b => `{{embed ((${b.uuid}))}}`).join('\n')}),
                group: 'basic'
            },
            {
                name: 'Elaborate (Expand)',
                isVisibleInCommandPrompt: PromptVisibility.Blocks,
                getPromptMessage: (userInput, invokeState) =>
                    Mustache.render(`Elaborate (Expand):\n{{selectedBlocksList}}`,{
                        selectedBlocksList: invokeState.selectedBlocks.map(b => `{{embed ((${b.uuid}))}}`).join('\n')}),
                group: 'basic'
            },
            {
                name: 'Fill in the blank',
                isVisibleInCommandPrompt: PromptVisibility.Blocks,
                getPromptPrefixMessages: () => [
                    new UserMessage(`I want you to act as a Fill in the blank tool. You take the input and fill the blanks as marked by user factually. DO NOT reply the context.`)
                ],
                getPromptMessage: (userInput, invokeState) =>
                    Mustache.render(`Fill in the Blank:\n{{selectedBlocksList}}`,{
                        selectedBlocksList: invokeState.selectedBlocks.map(b => `\n{{embed ((${b.uuid}))}}`)}),
                group: 'basic'
            },
            {
                name: 'Create Outline from Block',
                isVisibleInCommandPrompt: PromptVisibility.SingleBlock,
                getPromptPrefixMessages: () => [
                    new UserMessage(`You are a outline generator tool. You take text as input and create an outline document. An outline document contains the text as hierarchical bullet points.
                    DO NOT reply additional statements. Output only hierarchical markdown bullet points. Sample of the conversation is shown below:
                    user: Create Outline from Block: Pokémon is a series of video games developed by Game Freak and published by Nintendo and The Pokémon Company under the Pokémon media franchise.
                    you: 
                    - Pokémon (series of video games)
                     - developed by Game Freak
                     - published by Nintendo and The Pokémon Company
                       - under the Pokémon media franchise
                    `.replaceAll('    ', '').trim())
                ],
                getPromptMessage: (userInput, invokeState) =>
                    Mustache.render(`Fill in the Blank:\n{{selectedBlocksList}}`,{
                        selectedBlocksList: invokeState.selectedBlocks.map(b => `\n{{embed ((${b.uuid}))}}`)}),
                group: 'basic'
            }
        ]
    }
}
