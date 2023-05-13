import {AskChatgptBtn} from "./AskChatgptBtn";
import { createChatgptPageWithPrompt } from "../service/createChatgptPage";

/**
 * This file injects several DWIM commands into logseq, mainly for calling chatgpt and chatgpt page creation.
 */
export class DWIMCommandsInjector {
    static init() {
        logseq.Editor.registerBlockContextMenuItem("Ask ChatGPT", async (block) => {
            await logseq.Editor.selectBlock(block.uuid);
            await createChatgptPageWithPrompt();
        });
        logseq.App.registerCommand(`logseq-chatgpt-plugin-ask-chatgpt-${logseq.baseInfo.id}`, {
            key: `logseq-chatgpt-plugin-ask-chatgpt-${logseq.baseInfo.id}`,
            label: `Ask ChatGPT`,
            keybinding: {
                binding: logseq.settings?.ASK_CHATGPT_SHORTCUT || null
            },
            palette: true
        }, async () => {
            const page = await logseq.Editor.getCurrentPage();
            if (page?.properties?.type == "ChatGPT") {
                await AskChatgptBtn.askChatGPTWrapper();
            }
            else {
                let editingStatus = await logseq.Editor.checkEditing();
                if (editingStatus)
                    await logseq.Editor.selectBlock(editingStatus as string);
                await createChatgptPageWithPrompt();
            }
        });
        logseq.App.registerCommand(`logseq-chatgpt-plugin-create-chatgpt-page-${logseq.baseInfo.id}`, {
            key: `logseq-chatgpt-plugin-create-chatgpt-page-${logseq.baseInfo.id}`,
            label: `Create ChatGPT Page`,
            keybinding: {
                binding: logseq.settings?.CREATE_CHATGPT_PAGE_SHORTCUT || null
            },
            palette: true
        }, async () => {
            let editingStatus = await logseq.Editor.checkEditing();
            if (editingStatus)
                await logseq.Editor.selectBlock(editingStatus as string);
            await createChatgptPageWithPrompt();
        });
    }
}
