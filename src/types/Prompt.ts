import {BaseChatMessage} from "langchain/schema";
import {Tool} from "langchain/dist/tools/base";
import { BlockEntity } from "@logseq/libs/dist/LSPlugin.user";

/**
 * Prompts work in two phases:
 * - Phase 1: Prompt is displayed to used in command prompt and upon selection,
 *   Chatgpt page representing the prompt is created.
 * - Phase 2: Prompt is run. While running, getPromptPrefixMessages is appended at the
 *   start of message history.
 */
export type Prompt = {
    // -- Fields for Phase 1 --
    name: string; // The name of the prompt (displayed in command prompt)
    isVisibleInCommandPrompt?: (invokeState?: LogseqPromptInvocationState) => boolean;
    tools? : Tool[]; // An option array of Tools that can be used by the prompt. Please avoid unless needed as it changes executor from simple call to agent call.
    getPromptMessage: (input? : string, invokeState?: LogseqPromptInvocationState) => string; // The return value of the function is appended when chatgpt page is created.
    group: string;  // A misc string that represents the group to which the prompt belongs

    // -- Fields for Phase 2 --
    getPromptPrefixMessages?: () => BaseChatMessage[];
    promptPrefixMessagesLength?: number; // The length of getPromptPrefixMessages (filled automatically)
}

export type LogseqPromptInvocationState = {
    selectedBlocks?: BlockEntity[]
}

export class PromptVisibility {
    static Blocks = (invokeState) => {
        return invokeState.selectedBlocks && invokeState.selectedBlocks.length > 0;
    }
    static SingleBlock = (invokeState) => {
        return invokeState.selectedBlocks && invokeState.selectedBlocks.length == 1;
    }

    static NoInput = (invokeState) => {
        return !invokeState.selectedBlocks || invokeState.selectedBlocks.length == 0;
    }
}