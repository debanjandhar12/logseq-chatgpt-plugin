import '@logseq/libs'
import {LSPluginBaseInfo} from '@logseq/libs/dist/LSPlugin'
import _ from 'lodash';
import {ChatGPTPageList} from "./ui/ChatGPTPageList";
import registerSideNavBarItem, {unregisterSideNavBarItem} from "./logseq/registerSideNavBarItem";
import {ICON_18} from "./utils/constants";
import {addSettingsToLogseq} from "./settings";
import {AutoFlowFormatter} from "./core/AutoFlowFormatter";
import {LogseqProxy} from "./logseq/LogseqProxy";
import {AskChatGPTHandler} from "./core/AskChatGPTHandler";
import {BulletIconsInjector} from "./core/BulletIconsInjector";

// --- Register UI Elements Onload ---
function main(baseInfo: LSPluginBaseInfo) {
    addSettingsToLogseq();
    LogseqProxy.init();
    AutoFlowFormatter.init();
    AskChatGPTHandler.init();
    BulletIconsInjector.init();

    let showChatGPTPageList = function () {
        console.log("Show ChatGPT Page List");
        ChatGPTPageList();
    }
    logseq.App.registerCommandPalette({
        key: `logseq-chatgpt-plugin-command-palette-${baseInfo.id}`,
        label: `Show ChatGPT Page List`,
    }, showChatGPTPageList);
    registerSideNavBarItem("ChatGPT", ICON_18, showChatGPTPageList);
    logseq.beforeunload(async () => {
        unregisterSideNavBarItem("ChatGPT");
    });

    console.log("ChatGPT plugin loaded on window:", window.parent);
}

// Bootstrap
logseq.ready(main).catch(console.error)
