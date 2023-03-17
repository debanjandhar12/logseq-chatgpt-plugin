/**
 * This handles the ask chat GPT button event on ChatGPT pages.
 */
import {ICON_16} from "../utils/constants";
import {LogseqProxy} from "../logseq/LogseqProxy";
import {DOMElement} from "react";
import {AutoFlowFormatter} from "./AutoFlowFormatter";
import {ChatGPT, Message, ResBody} from "chatgpt-wrapper";
import {removePropsFromBlockContent} from "../logseq/removePropsFromBlockContent";
import {ChatGPTLogseqSanitizer} from "../adapter/ChatGPTLogseqSanitizer";
import streamToAsyncIterator from "../utils/streamToAsyncIterator";
import Mustache from "mustache";

export class AskChatGPTHandler {
    static inAskingInProgress = false;
    static init() {
        logseq.App.registerUIItem('pagebar', {
            key: `logseq-chatgpt${logseq.baseInfo.id == "logseq-chatgpt"? "" : "-"+logseq.baseInfo.id}`,
            template: String.raw`
              <a class="logseq-chatgpt-callAPI-${logseq.baseInfo.id} flex" 
              style="position: fixed;
                z-index: var(--ls-z-index-level-1) !important;
                right: 16px;
                justify-content: center;
                align-items: center;
                color: var(--ls-alink-color);
                padding: 0.1rem;
                border-radius: .375rem;
                display: none;">
                <span class="ui__icon ti ls-icon-hierarchy" style="height:13px">${ICON_16}</span>
                <span class="flex-1">Ask ChatGPT</span>
              </a>
        `
        });
        LogseqProxy.App.registerPageHeadActionsSlottedListener(async (event) => {
            const button : HTMLButtonElement = window.parent.document.querySelector(`.logseq-chatgpt-callAPI-${logseq.baseInfo.id}`);
            if (button)
                button.classList.add("logseq-chatgpt-callAPI-btn");

            // Show button if current page is a ChatGPT page only
            const page = await logseq.Editor.getCurrentPage();
            if (!(page.originalName && (page.properties?.type == "ChatGPT" || page.properties?.type == "[[ChatGPT]]")))
            {
                button.style.display = "none";
                return;
            }
            button.style.display = "block";

            // Add click event listener to button
            button.addEventListener("click", async () => {
                await AskChatGPTHandler.askChatGPTWrapper();
            });

            // Change color to blue on hover
            button.addEventListener("mouseenter", () => {
                button.style.backgroundColor = "rgba(59,130,246, .4)";
            });
            button.addEventListener("mouseleave", () => {
                button.style.backgroundColor = "rgba(59,130,246, .2)";
            });
            button.style.backgroundColor = "rgba(59,130,246, .2)";

            // Fix opacity of injected button container
            const injectedUIItemContainer : HTMLDivElement = window.parent.document.querySelector(`.injected-ui-item-pagebar[title="logseq-chatgpt${logseq.baseInfo.id == "logseq-chatgpt"? "" : "-"+logseq.baseInfo.id}"]`);
            if (injectedUIItemContainer)
                injectedUIItemContainer.style.opacity = "1";
        });
    }
    public static async askChatGPTWrapper() {
        if (this.inAskingInProgress) return;
        this.inAskingInProgress = true;
        const button : HTMLButtonElement = window.parent.document.querySelector(`.logseq-chatgpt-callAPI-${logseq.baseInfo.id}`);
        const originalButtonContent = button.innerHTML;
        button.innerHTML = "Asking...";
        try {
            await this.askChatGPT();
        } catch (e) {
            if(e.blockUUID) {
                const page = await logseq.Editor.getCurrentPage();
                await logseq.Editor.selectBlock(e.blockUUID);
            }
            await logseq.UI.showMsg(e.message || e, e.type || "error", {timeout: 5000});
            console.log(e);
        }
        this.inAskingInProgress = false;
        button.innerHTML = originalButtonContent;
    }
    private static async askChatGPT() {
        if (logseq.settings.OPENAI_API_KEY.trim() == "")
            throw {message: "OPENAI_API_KEY is empty. Please go to settings and set it.", type: 'warning'};

        const page = await logseq.Editor.getCurrentPage();

        // Collect all messages and find block to insert result
        const messages : Array<Message> = [];
        let resultBlock = null;
        const pageBlocks = await logseq.Editor.getPageBlocksTree(page.originalName);
        let stack = [];
        for (let i = 1; i < pageBlocks.length; i++)
            stack.push(pageBlocks[i]);
        stack = stack.reverse();
        while (stack.length > 0) {
            let block = stack.pop();
            if (block.properties?.speaker != "user" && removePropsFromBlockContent(block.content).trim() == "")
                { stack.push(block); break; }
            messages.push(<Message>{
                role: String(block.properties?.speaker) || "assistant",
                content: removePropsFromBlockContent(block.content).trim()
            });
            if (block.children)
                stack.push(...block.children);
        }
        console.log("stack",stack);
        if (stack.length > 0) {
            resultBlock = stack.pop();
        }
        else if (messages.length != 0 && messages[messages.length-1].role == "user" && messages[messages.length-1].content.trim() != "") {
            // @ts-ignore
            resultBlock = await window.parent.logseq.api.insert_block(page.originalName, "", {isPageBlock: true, sibling: true});
        }
        console.log("resultBlock",resultBlock);
        console.log("messages",messages);

        // Check if messages list is valid
        if (pageBlocks.length == 1 || messages.length == 0)
            throw {message: "No messages. Please write a messages to the page.", type: 'warning'};
        else if (messages[messages.length-1].role != "user")
            throw {message: "Last message is not from user", type: 'warning'};
        else if (messages[messages.length-1].content.trim() == "")
            throw {message: "User message cannot be empty", type: 'warning', blockUUID: pageBlocks[messages.length].uuid};

        // Add the system message after processing via mustache if set
        if (logseq.settings.CHATGPT_SYSTEM_PROMPT) {
            messages.unshift({role: "system", content:
                    Mustache.render(logseq.settings.CHATGPT_SYSTEM_PROMPT,
                        {page, timestamp: Date.now(), today: new Date().toISOString().split('T')[0]})});
        }

        // Call ChatGPT API
        const chat = new ChatGPT({
            API_KEY: logseq.settings.OPENAI_API_KEY
        });
        let chatResponse = "", finishReason = null, lastChunk = null;
        const responseStream = await chat.stream({
            model: 'gpt-3.5-turbo',
            stream: true,
            messages: messages,
            max_tokens: logseq.settings.CHATGPT_MAX_TOKENS || 1000,
        });
        console.log("responseStream",responseStream);
        await this.iterateChatGptResponseStream(responseStream, async (responseChunk) => {
            chatResponse += responseChunk.choices[0].delta?.content || "";
            finishReason = responseChunk.choices[0].finish_reason;
            if (finishReason && finishReason.toLowerCase() == "stop")
                lastChunk = responseChunk;
            await logseq.Editor.updateBlock(resultBlock.uuid, "speaker:: [[assistant]]\n"+ChatGPTLogseqSanitizer.sanitize(chatResponse.trim()), {properties: {}});
        });
        console.log("lastChunk",lastChunk);
        await logseq.Editor.exitEditingMode(false);
        await logseq.Editor.selectBlock(resultBlock.uuid);

        if (finishReason && finishReason.trim().toLowerCase() == "length")
            await logseq.UI.showMsg("ChatGPT stopped early because of max_tokens limit. Please increase it in settings.", "warning", {timeout: 5000});
        else if (finishReason && finishReason.toLowerCase() != "stop")
            await logseq.UI.showMsg(`ChatGPT stopped early because of ${finishReason}.`, "warning", {timeout: 5000});
    }

    private static async iterateChatGptResponseStream(responseStream: NodeJS.ReadableStream, callback: (chunk: ResBody & {choices: [{delta: any, finish_reason: null | 'stop' | 'length' | 'content_filter'}]}) => void) {
        const responseAsyncIterator = streamToAsyncIterator(responseStream);
        console.log(responseAsyncIterator);
        // chatResponse += resObj.choices[0].message.content;
        for await (const responseStream of responseAsyncIterator) {
            const responseTxt = new TextDecoder().decode(responseStream, {stream: true});
            const chunks = responseTxt.split('\n'); // ReadableStream can contain multiple chunks
            for (let chunk of chunks) {
                console.log(chunk);
                try {
                    if (chunk.match(/^data:\s*\[DONE\]/i))  // end of stream
                        break;
                    if (chunk.length === 0) continue;
                    if (chunk.startsWith('data:')) chunk = chunk.slice(5);
                    let chunkObj = JSON.parse(chunk);
                    await callback(chunkObj);
                } catch (e) {
                    console.log("Error during message clean:");
                    console.log(chunk);
                    console.log(e);
                    continue;
                }
            }
        }
    }
}
