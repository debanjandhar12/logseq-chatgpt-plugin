import {SettingSchemaDesc} from '@logseq/libs/dist/LSPlugin';
import {LogseqProxy} from "./logseq/LogseqProxy";

export const addSettingsToLogseq = async () => {
    const settingsTemplate: SettingSchemaDesc[] = [
        {
            key: "heading1",
            title: "🤖 OPENAI Settings",
            description: "",
            type: "heading",
            default: null,
        },
        {
            key: "OPENAI_API_KEY",
            type: 'string',
            title: "OpenAI API Key",
            description: "Enter your OpenAI API Key here. Visit https://platform.openai.com/account/api-keys to get one.",
            default: ""
        },
        {
            key: "heading2",
            title: "🦾 ChatGPT Settings",
            description: "",
            type: "heading",
            default: null,
        },
        {
            key: "CHATGPT_MODEL",
            type: 'enum',
            enumChoices: ["gpt-3.5-turbo", "gpt-4", "gpt-4-32k"],
            enumPicker: "select",
            title: "ChatGPT Model",
            description: "",
            default: "gpt-3.5-turbo",
        },
        {
            key: "CHATGPT_SYSTEM_PROMPT",
            type: 'string',
            title: "ChatGPT System Prompt",
            description: "Enter the system prompt for ChatGPT. Visit https://platform.openai.com/docs/guides/chat for more information.",
            default: "You are a assistant who replies using markdown. Current date: {{today}}"
        },
        {
            key: "CHATGPT_MAX_TOKENS",
            type: 'number',
            title: "ChatGPT Max Tokens",
            description: "Enter the maximum number of tokens for ChatGPT. See https://platform.openai.com/docs/guides/chat for more information.",
            default: 1000
        },
        {
            key: "heading3",
            title: "🎨 UI Settings",
            description: "",
            type: "heading",
            default: null,
        },
        {
            key: "SHOW_CHATGPT_PAGE_LIST_IN_SIDE_NAVBAR",
            type: 'boolean',
            description: "Show Chatgpt Page List in side navbar",
            title: "",
            default: true
        },
        {
            key: "heading4",
            title: "⌨️ UI Shortcuts",
            description: "",
            type: "heading",
            default: null,
        },
        {
            key: "SHOW_CHATGPT_PAGE_LIST_SHORTCUT",
            type: 'string',
            title: "Show ChatGPT Page List Shortcut (restart required after changes):",
            description: "",
            default: "mod+shift+l"
        }
    ];
    await LogseqProxy.Settings.useSettingsSchema(settingsTemplate);
    await logseq.provideStyle(`
        [data-id="${logseq.baseInfo.id}"] .cp__plugins-settings-inner code {
          display: none;
        }
        [data-id="${logseq.baseInfo.id}"] .cp__plugins-settings-inner .as-toggle h2 {
            display: none;
        }
    `);
};
