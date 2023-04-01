import moment from "moment/moment";
import {SelectCommandPrompt} from "../ui/SelectCommandPrompt";
import {AskChatGPTHandler} from "./AskChatGPTHandler";
import {getAllPrompts} from "../prompt/getAllPrompts";

/**
 * This file injects and handles the "Ask ChatGPT" block option. Once clicked, it shows the prompt selector to user.
 * Thereafter, when the user selects a prompt, the page is created and executed.
 * This file also manages the "Ask ChatGPT" command palette item.
 */
export class ChatgptPageFromPrompt {
    static init() {
        logseq.Editor.registerBlockContextMenuItem("Ask ChatGPT", async (block) => {
            await logseq.Editor.selectBlock(block.uuid);
            await ChatgptPageFromPrompt.createChatGPTPageAndGoToItWithPrompt();
        });
        logseq.App.registerCommandPalette({
            key: `logseq-chatgpt-plugin-ask-chatgpt-${logseq.baseInfo.id}`,
            label: `Ask ChatGPT`,
        }, async () => {
            const blocks = await logseq.Editor.getSelectedBlocks();
            const page = await logseq.Editor.getCurrentPage();
            if (page?.properties?.type == "ChatGPT" && (blocks == null || blocks.length == 0))
                await AskChatGPTHandler.askChatGPTWrapper();
            else if (blocks == null || blocks.length == 0)
                await ChatgptPageFromPrompt.createChatGPTPageAndGoToIt();
            else
                await ChatgptPageFromPrompt.createChatGPTPageAndGoToItWithPrompt();
        });
        logseq.App.registerCommandPalette({
            key: `logseq-chatgpt-plugin-create-chatgpt-page-${logseq.baseInfo.id}`,
            label: `Create ChatGPT Page`,
        }, async () => {
            const blocks = await logseq.Editor.getSelectedBlocks();
            if (blocks == null || blocks.length == 0)
                await ChatgptPageFromPrompt.createChatGPTPageAndGoToIt();
            else
                await ChatgptPageFromPrompt.createChatGPTPageAndGoToItWithPrompt();
        });
    }

    public static async createChatGPTPageAndGoToIt(pageName: string = "", prompt: string = "") {
        pageName = pageName || "chatgpt__" + moment().format('YYYY-MM-DD HH:mm:ss');
        await logseq.Editor.createPage(pageName,
            {'type': 'ChatGPT', 'chatgpt-flow': 'alternating'}, {format: "markdown"});
        if (prompt != "")
            await logseq.Editor.insertBlock(pageName, `speaker:: [[user]]\n${prompt}`);
    }

    private static async createChatGPTPageAndGoToItWithPrompt() {
        const blocks = await logseq.Editor.getSelectedBlocks();
        console.log(blocks);
        const selectedPrompt = await SelectCommandPrompt(getAllPrompts(), "Select a prompt", true);
        if (!selectedPrompt) return;
        let prompt = selectedPrompt.getPrompt() || "";
        for (const block of blocks) {
            if (block.parent && blocks.find(b => b.id == block.parent?.id)) continue;
            prompt += `\n{{embed ((${block.uuid}))}}`;
        }
        await ChatgptPageFromPrompt.createChatGPTPageAndGoToIt("", prompt);
        try {
            await AskChatGPTHandler.askChatGPTWrapper();
        } catch (e) { console.log(e); };
    }
}
