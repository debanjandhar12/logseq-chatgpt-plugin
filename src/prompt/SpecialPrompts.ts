import {Prompt, PromptVisibility} from "../types/Prompt";
import Mustache from "mustache";

/**
 * This constains a list of prompts that are handled seperately by the Command Prompt Selector.
 * Please dont use this file as a reference to create your own prompt.
 */

export class SpecialPrompts {
    public static getPrompts() : Prompt[] {
        return [
            {
                name: `Custom: {{userInput}}`,
                isVisibleInCommandPrompt: PromptVisibility.Blocks,
                getPromptMessage: (userInput, invokeState) =>
                    Mustache.render(`{{userInput}}:{{selectedBlocksList}}`,{userInput,
                        selectedBlocksList: invokeState.selectedBlocks.map(b => `{{embed ((${b.uuid}))}}`).join('\n')}),
                group: 'custom'
            },
            {
                name: `Create empty ChatGPT Page`,
                isVisibleInCommandPrompt: PromptVisibility.NoInput,
                getPromptMessage: (userInput, invokeState) => ``,
                group: ''
            }
        ]
    }
}
