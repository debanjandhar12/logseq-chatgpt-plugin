import {BaseChatMessage} from "langchain/schema";
import {Tool} from "langchain/dist/tools/base";

export type Prompt = {
    // The name of the prompt
    name: string;
    // The type of input selection required for the prompt to be displayed in the command palette
    required_input: 'block(s)' | 'block' | 'blocks' | 'none';
    // An array of Tools that can be used by the prompt. Setting this attribute changes execution from
    // simple chatgpt call to agent call (multiple chatgpt calls).
    tools? : Tool[];
    // A function that returns a string. A block with this string followed by input selection embed(s) is added to the editor
    getPrompt: (input? : string) => string;
    // An optional function that returns an array of `Message` objects.
    // These messages are prepended (not visible to the user) before sending the block(s) to the API
    getPromptPrefixMessages?: () => BaseChatMessage[];
    // The length of getPromptPrefixMessages (calculated automatically)
    promptPrefixMessagesLength?: number;
    // An optional string that represents the group to which the prompt belongs
    group?: string;
}
