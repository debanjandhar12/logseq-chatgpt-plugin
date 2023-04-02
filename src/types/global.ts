import {LSPluginUser} from "@logseq/libs/dist/LSPlugin.user";

export {};
declare global {
    interface Window {
        ReactDOM: any;
        ChatGPT: any;
        scrollFixForChatGPTPlugin: any;
    }
}
