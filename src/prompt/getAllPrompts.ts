/**
 * This file collects and returns all the prompts.
 * Please ensure that the name field is always unique.
 */
import {Translate} from "./Translate";
import {Continue} from "./Continue";
import {Fix} from "./Fix";
import {Summarize} from "./Summarize";
import {Prompt} from "../types/Prompt";

export function getAllPrompts() : Prompt[] {
    return [
        ...Continue.getPrompts(),
        ...Fix.getPrompts(),
        ...Summarize.getPrompts(),
        ...Translate.getPrompts()
    ];
}
