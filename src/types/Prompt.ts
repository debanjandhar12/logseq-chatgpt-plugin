import {Message} from "chatgpt-wrapper";

export type Prompt = {
    name: string;
    required_input: 'block(s)' | 'block' | 'blocks' | 'none';
    getPromptPrefixMessages?: () => Message[];
    getPrompt: () => string;
    group?: string;
}
