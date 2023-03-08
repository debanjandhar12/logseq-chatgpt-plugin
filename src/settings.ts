import {SettingSchemaDesc} from '@logseq/libs/dist/LSPlugin';
import {LogseqProxy} from "./logseq/LogseqProxy";

export const addSettingsToLogseq = () => {
    const settingsTemplate: SettingSchemaDesc[] = [
        {
            key: "OPENAI_API_KEY",
            type: 'string',
            title: "OpenAI API Key",
            description: "Enter your OpenAI API Key here. See https://beta.openai.com/docs/api-reference/authentication to get one for free.",
            default: ""
        },
        {
            key: "CHATGPT_SYSTEM_PROMPT",
            type: 'string',
            title: "ChatGPT System Prompt",
            description: "Enter the system prompt for ChatGPT. See https://beta.openai.com/docs/engines/chatgpt for more information.",
            default: "You are a helpful assistant."
        }
    ];
    LogseqProxy.Settings.useSettingsSchema(settingsTemplate);
};
