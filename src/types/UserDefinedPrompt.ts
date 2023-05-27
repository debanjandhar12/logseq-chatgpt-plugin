export type UserDefinedPrompt = {
    name: string;
    promptVisibility?: 'Blocks' | 'Single Block' | 'No Input';
    tool?: string
        | { type: 'API', apiEndpoint: string, headers, method: 'GET' | 'POST', body, toolDesc: string }
    hiddenPromptMsg: string;
    promptMessage: string;
}