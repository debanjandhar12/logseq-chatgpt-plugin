/**
 * This ensures that the conversation flow is formatted correctly for ChatGPT pages.
 * For example, when the flow is alternating, the blocks in page should be alternating between user and assistant.
 * Currently, only the alternating flow is supported.
 */
import {PageEntity, PageIdentity} from "@logseq/libs/dist/LSPlugin";
import {LogseqProxy} from "../logseq/LogseqProxy";
import getUUIDFromBlock from "../logseq/getUUIDFromBlock";
import {isChatGPTPage} from "../utils/isChatGPTPage";
import {removePropsFromBlockContent} from "../adapter/removePropsFromBlockContent";

export class AutoFlowFormatter {
    static init() {
        LogseqProxy.DB.registerDBChangeListener(async ({blocks, txData, txMeta}) => {
            const pages = new Set();
            for (let block of blocks) {
                if (block.originalName && (block.properties?.type == "ChatGPT" || block.properties?.type == "[[ChatGPT]]"))
                    pages.add(block.originalName);
            }
            pages.forEach((pageName: PageIdentity) => {
                this.enforceFlowFormat(pageName);
            });
        });

        LogseqProxy.App.registerPageHeadActionsSlottedListener(async (e) => {
            const page = await logseq.Editor.getCurrentPage();
            if (isChatGPTPage(page as PageEntity)) {
                await this.enforceFlowFormat(page.originalName);
                await attachAdditionalListenersOnChatGPTPageLoad();
            }
        });

        const attachAdditionalListenersOnChatGPTPageLoad = async () => {
            window.parent.document.getElementsByClassName("add-button-link-wrap")[0].addEventListener("click", async () => {
                const page = await logseq.Editor.getCurrentPage();
                await this.enforceFlowFormat(page.originalName);
            });
        }
    }

    public static async enforceFlowFormat(pageName: PageIdentity, force = false) {
        let page = await logseq.Editor.getPage(pageName);
        if (!isChatGPTPage(page)) return;

        // Ensure that the first block has no speaker, and the second block has a speaker user and the third block has a speaker assistant, and fourth block has a speaker user, and so on.
        let pageBlocks = await logseq.Editor.getPageBlocksTree(pageName);
        let stack = [];
        for (let i = 1; i < pageBlocks.length; i++)
            stack.push(pageBlocks[i]);
        stack = stack.reverse();
        let lastSpeaker = "assistant";
        while (stack.length > 0) {
            let block = stack.pop();
            let currentSpeaker = lastSpeaker == "assistant" ? "user" : "assistant";
            if (block.properties?.speaker != currentSpeaker && (!(currentSpeaker == "assistant" && removePropsFromBlockContent(block.content).trim() == "") || force == true)) {
                await LogseqProxy.Editor.upsertBlockProperty(getUUIDFromBlock(block), "speaker", `[[${currentSpeaker}]]`);
            }
            lastSpeaker = currentSpeaker;
            if (block.children)
                stack.push(...block.children);
        }
    }
}
