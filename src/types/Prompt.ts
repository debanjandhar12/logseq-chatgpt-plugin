import { Message } from "chatgpt-wrapper";

export type Prompt = {
    // The name of the prompt
    name: string;
    // The type of input selection required for the prompt to be displayed in the command palette
    required_input: 'block(s)' | 'block' | 'blocks' | 'none';
    // A function that returns a string. A block with this string followed by input selection embed(s) is added to the editor
    getPrompt: () => string;
    // An optional function that returns an array of `Message` objects.
    // These messages are prepended (not visible to the user) before sending the block(s) to the API
    getPromptPrefixMessages?: () => Message[];
    // An optional string that represents the group to which the prompt belongs
    group?: string;
}
