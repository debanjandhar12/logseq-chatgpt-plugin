import {ChatGPTPageList} from "../../ui/ChatGPTPageList";
import registerSideNavBarItem, {unregisterSideNavBarItem} from "../../logseq/registerSideNavBarItem";
import {GPT_ICON_18} from "../../utils/constants";

export class ChatgptPageListInjector {
    static init() {
        logseq.App.registerCommand(`logseq-chatgpt-plugin-command-palette-${logseq.baseInfo.id}`, {
            key: `logseq-chatgpt-plugin-command-palette-${logseq.baseInfo.id}`,
            label: `Show ChatGPT Page List`,
            keybinding: {
                binding: logseq.settings?.SHOW_CHATGPT_PAGE_LIST_SHORTCUT || null
            },
            palette: true
        }, ChatGPTPageList);
        if(logseq.settings?.SHOW_CHATGPT_PAGE_LIST_IN_SIDE_NAVBAR)
            registerSideNavBarItem("ChatGPT", GPT_ICON_18, ChatGPTPageList);
        logseq.beforeunload(async () => {
            try {
                unregisterSideNavBarItem("ChatGPT");
            } catch (e) { }
        });
    }
}
