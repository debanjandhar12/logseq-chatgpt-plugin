/**
 * This file collects and returns all the prompts.
 * Please ensure that the name field is always unique.
 */
import {Translate} from "./Translate";
import {AutoComplete} from "./AutoComplete";
import {Fix} from "./Fix";
import {Summarize} from "./Summarize";
import {Prompt} from "../types/Prompt";
import {Flashcard} from "./Flashcard";
import getMessageArrayTokenCount from "../utils/getMessageArrayTokenCount";
import {Task} from "./Task";
import {Custom} from "./Custom";
import {SearchEngine} from "./SearchEngine";
import {Math} from "./Math";

export async function getAllPrompts() : Promise<Prompt[]> {
    let prompts : Prompt[] = [
        ...AutoComplete.getPrompts(),
        ...Fix.getPrompts(),
        ...Summarize.getPrompts(),
        ...(await Task.getPrompts()),
        ...Flashcard.getPrompts(),
        ...SearchEngine.getPrompts(),
        ...Math.getPrompts(),
        ...Translate.getPrompts(),
        ...Custom.getPrompts()
    ];
    prompts.forEach((prompt) => {
        if (prompt.getPromptPrefixMessages) {
            prompt.promptPrefixMessagesLength = getMessageArrayTokenCount(prompt.getPromptPrefixMessages());
        }
    });
    return prompts;
}
