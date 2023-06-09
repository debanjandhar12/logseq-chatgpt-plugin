/**
 * This file collects and returns all the prompts.
 * Please ensure that the name field is always unique.
 */
import {Translate} from "./Translate";
import {Basic} from "./Basic";
import {Prompt} from "../types/Prompt";
import {Flashcard} from "./Flashcard";
import getMessageArrayTokenCount from "../utils/getMessageArrayTokenCount";
import {Task} from "./Task";
import {SpecialPrompts} from "./SpecialPrompts";
import {WebBrowser} from "./WebBrowser";
import {UserDefinedPrompt} from "./UserDefinedPrompt";
import {ZapierNLA} from "./ZapierNLA";

export async function getAllPrompts() : Promise<Prompt[]> {
    let prompts : Prompt[] = [
        ...Basic.getPrompts(),
        ...(await Task.getPrompts()),
        ...Flashcard.getPrompts(),
        ...WebBrowser.getPrompts(),
        ...(await ZapierNLA.getPrompts()),
        ...(await UserDefinedPrompt.getPrompts()),
        ...Translate.getPrompts(),
        ...SpecialPrompts.getPrompts()
    ];
    for (let prompt of prompts) {
        if (prompt.getPromptPrefixMessages) {
            prompt.promptPrefixMessagesLength = await getMessageArrayTokenCount(prompt.getPromptPrefixMessages());
        }
        if (prompt.isVisibleInCommandPrompt) {  // Handle logseq.settings.ENABLE_LANGCHAIN_TOOL_PROMPTS
            let oldIsVisibleInCommandPrompt = prompt.isVisibleInCommandPrompt;
            prompt.isVisibleInCommandPrompt = (invokeState) => {
                if (logseq.settings.ENABLE_LANGCHAIN_TOOL_PROMPTS == false &&
                    prompt.tools && prompt.tools.length > 0) {
                    return false;
                }
                return oldIsVisibleInCommandPrompt(invokeState);
            }
        }
    }
    return prompts;
}
