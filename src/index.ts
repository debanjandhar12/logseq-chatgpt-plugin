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
import {ShowChatGPTPageListInjector} from "./core/ShowChatGPTPageListInjector";
import {ChatgptPageFromPrompt} from "./core/ChatgptPageFromPrompt";

// --- Register UI Elements Onload ---
function main(baseInfo: LSPluginBaseInfo) {
    addSettingsToLogseq();
    LogseqProxy.init();
    AutoFlowFormatter.init();
    AskChatGPTHandler.init();
    BulletIconsInjector.init();
    ShowChatGPTPageListInjector.init();
    ChatgptPageFromPrompt.init();
    console.log("ChatGPT plugin loaded on window:", window.parent);
}

// Bootstrap
logseq.ready(main).catch(console.error)
