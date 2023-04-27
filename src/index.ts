import '@logseq/libs'
import {LSPluginBaseInfo} from '@logseq/libs/dist/LSPlugin'
import {addSettingsToLogseq} from "./settings";
import {AutoFlowFormatter} from "./core/service/AutoFlowFormatter";
import {LogseqProxy} from "./logseq/LogseqProxy";
import {AskChatgptBtn} from "./core/view/AskChatgptBtn";
import {BulletIconsInjector} from "./core/view/BulletIconsInjector";
import {ChatgptPageListInjector} from "./core/view/ChatgptPageListInjector";
import {DWIMCommandsInjector} from "./core/view/DWIMCommandsInjector";

// --- Register UI Elements Onload ---
async function main(baseInfo: LSPluginBaseInfo) {
    window.parent.ChatGPT = {};
    await addSettingsToLogseq();
    LogseqProxy.init();
    DWIMCommandsInjector.init();
    ChatgptPageListInjector.init();
    AskChatgptBtn.init();
    BulletIconsInjector.init();
    AutoFlowFormatter.init();
    console.log("ChatGPT plugin loaded on window:", window.parent);
}

// Bootstrap
logseq.ready(main).catch(console.error)
