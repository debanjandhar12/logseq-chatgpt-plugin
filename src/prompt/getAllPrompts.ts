/**
 * This file collects and returns all the prompts.
 * Please ensure that the name field is always unique.
 */
import {Translate} from "./Translate";
import {AutoComplete} from "./AutoComplete";
import {Fix} from "./Fix";
import {Summarize} from "./Summarize";
import {Prompt} from "../types/Prompt";

export function getAllPrompts() : Prompt[] {
    return [
        ...AutoComplete.getPrompts(),
        ...Fix.getPrompts(),
        ...Summarize.getPrompts(),
        ...Translate.getPrompts()
    ];
}
