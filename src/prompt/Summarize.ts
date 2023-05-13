import {Prompt, PromptVisibility} from "../types/Prompt";
import Mustache from "mustache";

export class Summarize {
    public static getPrompts() : Prompt[] {
        return [
            {
                name: 'Summarize',
                isVisibleInCommandPrompt: PromptVisibility.Blocks,
                getPromptMessage: (userInput, invokeState) =>
                    Mustache.render(`Summarize:\n{{selectedBlocksList}}`,{
                        selectedBlocksList: invokeState.selectedBlocks.map(b => `{{embed ((${b.uuid}))}}`).join('\n')}),
                group: 'summarize'
            },
            {
                name: 'Summarize in three lines',
                isVisibleInCommandPrompt: PromptVisibility.Blocks,
                getPromptMessage: (userInput, invokeState) =>
                    Mustache.render(`Summarize in three lines:\n{{selectedBlocksList}}`,{
                        selectedBlocksList: invokeState.selectedBlocks.map(b => `{{embed ((${b.uuid}))}}`).join('\n')}),
                group: 'summarize'
            }
        ]
    }
}
