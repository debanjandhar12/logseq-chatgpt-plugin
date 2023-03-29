import {ChatGPTPageList} from "../ui/ChatGPTPageList";
import registerSideNavBarItem, {unregisterSideNavBarItem} from "../logseq/registerSideNavBarItem";
import {ICON_18} from "../utils/constants";

export class ShowChatGPTPageListInjector {
    static init() {
        let showChatGPTPageList = function () {
            ChatGPTPageList();
        }
        logseq.App.registerCommandPalette({
            key: `logseq-chatgpt-plugin-command-palette-${logseq.baseInfo.id}`,
            label: `Show ChatGPT Page List`,
            keybinding: {
                binding: "mod+shift+g" // key `g` for chatGpt
            },
        }, showChatGPTPageList);
        registerSideNavBarItem("ChatGPT", ICON_18, showChatGPTPageList);
        logseq.beforeunload(async () => {
            unregisterSideNavBarItem("ChatGPT");
        });
    }
}
