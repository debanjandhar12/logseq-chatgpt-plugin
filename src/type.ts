import {LSPluginUser} from "@logseq/libs/dist/LSPlugin.user";

export {};
declare global {
    interface Window {
        ReactDOM: any;
        chatgptPageList_close_action: any;
        scrollFixForChatGPTPlugin: any;
    }
}
