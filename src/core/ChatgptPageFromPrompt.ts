import moment from "moment/moment";
import {SelectCommandPrompt} from "../ui/SelectCommandPrompt";
import {AskChatgptBtnController} from "./AskChatgptBtnController";
import {getAllPrompts} from "../prompt/getAllPrompts";
import {Prompt} from "../types/Prompt";
import _ from "lodash";
import {Confirm} from "../ui/Confirm";

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
                keybinding: {
                    binding: logseq.settings?.ASK_CHATGPT_SHORTCUT || null
                }
            }, async () => {
            const blocks = await logseq.Editor.getSelectedBlocks();
            const page = await logseq.Editor.getCurrentPage();
            if (page?.properties?.type == "ChatGPT" && (blocks == null || blocks.length == 0)) {
                await AskChatgptBtnController.askChatGPTWrapper();
            }
            else if (blocks == null || blocks.length == 0) {
                if (await Confirm("This will create a new empty ChatGPT page. Continue?"))
                    await ChatgptPageFromPrompt.createChatGPTPageAndGoToIt();
                // else do nothing
            }
            else {
                await ChatgptPageFromPrompt.createChatGPTPageAndGoToItWithPrompt();
            }
        });
        logseq.App.registerCommandPalette({
            key: `logseq-chatgpt-plugin-create-chatgpt-page-${logseq.baseInfo.id}`,
            label: `Create ChatGPT Page`,
            keybinding: {
                binding: logseq.settings?.CREATE_CHATGPT_PAGE_SHORTCUT || null
            }
        }, async () => {
            const blocks = await logseq.Editor.getSelectedBlocks();
            if (blocks == null || blocks.length == 0)
                await ChatgptPageFromPrompt.createChatGPTPageAndGoToIt();
            else
                await ChatgptPageFromPrompt.createChatGPTPageAndGoToItWithPrompt();
        });
    }

    public static async createChatGPTPageAndGoToIt(pageName: string = "", additionalPageProps= {}, firstBlockContent = "") {
        pageName = pageName || "chatgpt__" + moment().format('YYYY-MM-DD HH:mm:ss');
        const pageProperties = {
            'type': 'ChatGPT',
            'chatgpt-flow': 'alternating',
            ...additionalPageProps
        }
        await logseq.Editor.createPage(pageName, pageProperties, {format: "markdown"});
        if (firstBlockContent != "")
            await logseq.Editor.insertBlock(pageName, `speaker:: [[user]]\n${firstBlockContent}`);
    }

    private static async createChatGPTPageAndGoToItWithPrompt() {
        let blocks = await logseq.Editor.getSelectedBlocks();
        blocks = _.uniqBy(blocks, b => b.id);

        const selectedPrompt = await SelectCommandPrompt(getAllPrompts(), "Select a prompt", true);
        if (!selectedPrompt) return;

        // Construct additional page props and first block content
        const additionalPageProps = {};
        additionalPageProps['chatgpt-prompt'] = selectedPrompt.name;
        if (selectedPrompt.required_input.includes("block"))
            additionalPageProps['chatgpt-prompt-source'] = "";
        let firstBlockContent = selectedPrompt.getPrompt() || "";
        for (const block of blocks) {
            if (block.parent && blocks.find(b => b.id == block.parent?.id)) continue;   // Skip child blocks

            firstBlockContent += `\n{{embed ((${block.uuid}))}}`;
            if (selectedPrompt.required_input.includes("block"))
                additionalPageProps['chatgpt-prompt-source'] += `((${block.uuid}))`;
        }
        await ChatgptPageFromPrompt.createChatGPTPageAndGoToIt("", additionalPageProps, firstBlockContent);

        // Call the askChatGPTWrapper
        try {
            await AskChatgptBtnController.askChatGPTWrapper();
        } catch (e) { console.log(e); };
    }
}
