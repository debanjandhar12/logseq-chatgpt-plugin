/**
 * This file collects and returns all the prompts.
 */
import {Translate} from "./Translate";
import {Continue} from "./Continue";
import {Fix} from "./Fix";
import {Summarize} from "./Summarize";

export function getAllPrompts() {
    return [
        ...Continue.getPrompts(),
        ...Fix.getPrompts(),
        ...Summarize.getPrompts(),
        ...Translate.getPrompts()
    ];
}
