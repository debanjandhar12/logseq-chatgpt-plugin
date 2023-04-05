/**
 * This handles the ask chat GPT button event on ChatGPT pages.
 */
import {ICON_16} from "../utils/constants";
import {LogseqProxy} from "../logseq/LogseqProxy";
import {ChatGPT, Message, ResBody} from "chatgpt-wrapper";
import {removePropsFromBlockContent} from "../adapter/removePropsFromBlockContent";
import {ChatgptToLogseqSanitizer} from "../adapter/ChatgptToLogseqSanitizer";
import streamToAsyncIterator from "../utils/streamToAsyncIterator";
import Mustache from "mustache";
import {LogseqToChatgptConverter} from "../adapter/LogseqToChatgptConverter";
import getMessageArrayTokenCount from "../utils/getMessageArrayTokenCount";
import {getAllPrompts} from "../prompt/getAllPrompts";
import {ActionableNotification} from "../ui/ActionableNotification";

export class AskChatGPTHandler {
    static inAskingInProgress = false;
    static chatResponseIterator = null;

    static init() {
        logseq.App.registerUIItem('pagebar', {
            key: `logseq-chatgpt${logseq.baseInfo.id == "logseq-chatgpt" ? "" : "-" + logseq.baseInfo.id}`,
            template: String.raw`
              <a class="logseq-chatgpt-callAPI-${logseq.baseInfo.id} flex" 
              style="position: absolute;
                z-index: var(--ls-z-index-level-1) !important;
                right: 16px;
                justify-content: center;
                align-items: center;
                color: var(--ls-alink-color);
                padding: 0.1rem;
                border-radius: .375rem;
                transition: 0s;
                display: none;">
                <span class="ui__icon ti ls-icon-hierarchy" style="height:13px">${ICON_16}</span>
                <span class="flex-1">Ask ChatGPT</span>
              </a>
        `
        });
        LogseqProxy.App.registerPageHeadActionsSlottedListener(async (event) => {
            // - Cancel the previous chat response stream if any -
            if (this.inAskingInProgress && this.chatResponseIterator)
                this.chatResponseIterator.return();

            // - Add button to page head -
            const button: HTMLButtonElement = window.parent.document.querySelector(`.logseq-chatgpt-callAPI-${logseq.baseInfo.id}`);
            if (button)
                button.classList.add("logseq-chatgpt-callAPI-btn");

            // Show button if current page is a ChatGPT page only
            const page = await logseq.Editor.getCurrentPage();
            if (!(page.originalName && (page.properties?.type == "ChatGPT" || page.properties?.type == "[[ChatGPT]]"))) {
                button.style.display = "none";
                if (window.scrollFixForChatGPTPlugin)
                    window.parent.document.getElementById("main-content-container").removeEventListener("scroll", window.scrollFixForChatGPTPlugin);
                return;
            }
            button.style.display = "block";

            // Add click event listener to button
            button.addEventListener("click", async () => {
                await AskChatGPTHandler.askChatGPTWrapper();
            });

            // Change color to blue on hover
            button.addEventListener("mouseenter", () => {
                button.style.backgroundColor = "rgba(59,130,246, .8)";
            });
            button.addEventListener("mouseleave", () => {
                button.style.backgroundColor = "rgba(59,130,246, .4)";
            });
            button.style.backgroundColor = "rgba(59,130,246, .4)";

            // Fix opacity of injected button container
            const injectedUIItemContainer: HTMLDivElement = window.parent.document.querySelector(`.injected-ui-item-pagebar[title="logseq-chatgpt${logseq.baseInfo.id == "logseq-chatgpt" ? "" : "-" + logseq.baseInfo.id}"]`);
            if (injectedUIItemContainer)
                injectedUIItemContainer.style.opacity = "1";

            // Fix position of button on scroll
            window.parent.document.getElementById("main-content-container").addEventListener("scroll", window.scrollFixForChatGPTPlugin = () => {
                (window.parent.document.getElementsByClassName(`logseq-chatgpt-callAPI-${logseq.baseInfo.id}`)[0] as HTMLAnchorElement).style.top = `${Math.max(10, window.parent.document.getElementById("main-content-container").scrollTop - 70)}px`;
            });
            window.scrollFixForChatGPTPlugin();
        });
    }

    public static async askChatGPTWrapper() {
        if (this.inAskingInProgress) return;
        this.inAskingInProgress = true;
        const button: HTMLButtonElement = window.parent.document.querySelector(`.logseq-chatgpt-callAPI-${logseq.baseInfo.id}`);
        const originalButtonContent = button.innerHTML;
        button.innerHTML = "Asking...";
        try {
            await logseq.provideStyle({ // Disable commands modal
                key: "hide-commands",
                style: `
                .absolute-modal[data-modal-name=commands], .absolute-modal[data-modal-name=block-commands] {
                    display: none;
                }`
            });
            await this.askChatGPT();
        } catch (e) {
            if (e.blockUUID) {
                const page = await logseq.Editor.getCurrentPage();
                await logseq.Editor.selectBlock(e.blockUUID);
            }
            let errorMsg = e.message || e.toString();
            errorMsg = errorMsg.replace(/^Request error: /, "");
            if (!errorMsg.includes("This readable stream reader has been released and cannot be used to read"))
                await logseq.UI.showMsg(errorMsg, e.type || "error", {timeout: 5000});
            if (e.blockUUID)
                await logseq.Editor.selectBlock(e.blockUUID);
            console.log(e);
        } finally {
            this.inAskingInProgress = false;
            button.innerHTML = originalButtonContent;
            await logseq.provideStyle({  // Enable commands modal back
                key: "hide-commands",
                style: `
                .absolute-modal[data-modal-name=commands], .absolute-modal[data-modal-name=block-commands] {
                    display: block;
                }`
            });
        }
    }

    private static async askChatGPT() {
        if (logseq.settings.OPENAI_API_KEY.trim() == "") {
            logseq.showSettingsUI();
            setTimeout(function () {
                logseq.App.openExternalLink('https://platform.openai.com/account/api-keys')
            }, 3000);
            throw {message: "OPENAI_API_KEY is empty. Please go to settings and set it.", type: 'warning'};
        }

        const page = await logseq.Editor.getCurrentPage();
        if(page.properties.type != "ChatGPT") {
            throw {message: "Current page is not a ChatGPT page.", type: 'warning'};
            return;
        }

        // Collect all messages and find block to insert result
        const messages: Array<Message> = [];
        let resultBlock = null;
        const pageBlocks = await logseq.Editor.getPageBlocksTree(page.originalName);
        let stack = [];
        for (let i = 1; i < pageBlocks.length; i++)
            stack.push(pageBlocks[i]);
        stack = stack.reverse();
        while (stack.length > 0) {
            let block = stack.pop();
            if (block.properties?.speaker != "user" && removePropsFromBlockContent(block.content).trim() == "") {
                stack.push(block);
                break;
            }
            messages.push(<Message>{
                role: String(block.properties?.speaker) || "assistant",
                content: (await LogseqToChatgptConverter.convert(block.content)).trim()
            });
            if (block.children)
                stack.push(...block.children);
        }
        console.log("stack", stack);
        if (stack.length > 0) {
            resultBlock = stack.pop();
        } else if (messages.length != 0 && messages[messages.length - 1].role == "user" && messages[messages.length - 1].content.trim() != "") {
            // @ts-ignore
            resultBlock = await window.parent.logseq.api.insert_block(page.originalName, "", {
                isPageBlock: true,
                sibling: true
            });
        }
        console.log("resultBlock", resultBlock);
        console.log("messages", messages);

        // Check if messages list is valid
        if (pageBlocks.length == 1 || messages.length == 0)
            throw {message: "No messages. Please write a messages to the page.", type: 'warning'};
        else if (messages[messages.length - 1].role != "user")
            throw {message: "Last message is not from user", type: 'warning'};
        else if (messages[messages.length - 1].content.trim() == "")
            throw {
                message: "User message cannot be empty",
                type: 'warning',
                blockUUID: pageBlocks[messages.length].uuid
            };


        // Add prefix messages from prompt if set
        const prompt = getAllPrompts().find(p => p.name == (page.properties['chatgptPrompt'] || "").trim());
        console.log(prompt, page.properties['chatgpt-prompt']);
        if (prompt && prompt.getPromptPrefixMessages)
            messages.unshift(...prompt.getPromptPrefixMessages());

        // Add the system message after processing via mustache if set
        if (logseq.settings.CHATGPT_SYSTEM_PROMPT) {
            messages.unshift({
                role: "system", content:
                    Mustache.render(logseq.settings.CHATGPT_SYSTEM_PROMPT,
                        {page, timestamp: Date.now(), today: new Date().toISOString().split('T')[0]})
            });
        }

        // Context Window - Remove messages from top until we reach token limit
        while(getMessageArrayTokenCount(messages) > logseq.settings.CHATGPT_MAX_TOKENS*0.5)
            messages.shift();
        if (messages.length == 0)
            throw {message: "MAX_TOKEN limit reached by last message. Please consider increasing it in settings.", type: 'warning'};

        // Call ChatGPT API
        const chat = new ChatGPT({
            API_KEY: logseq.settings.OPENAI_API_KEY
        });
        let chatResponse = "", finishReason = null, lastChunk = null;
        const chatResponseStream = await chat.stream({
            model: logseq.settings.CHATGPT_MODEL,
            stream: true,
            messages: messages,
            max_tokens: parseInt(logseq.settings.CHATGPT_MAX_TOKENS) || 1000,
            presence_penalty: 0,    // try to avoid talking about new topics
            frequency_penalty: 0,
            temperature: logseq.settings.CHATGPT_TEMPERATURE || 0.7, // 0.7 is default
        });
        this.chatResponseIterator = streamToAsyncIterator(chatResponseStream);
        await this.iterateChatGptResponse(this.chatResponseIterator, async (responseChunk) => {
            chatResponse += responseChunk.choices[0].delta?.content || "";
            finishReason = responseChunk.choices[0].finish_reason;
            if (finishReason && finishReason.toLowerCase() == "stop")
                lastChunk = responseChunk;
            await logseq.Editor.updateBlock(resultBlock.uuid, "speaker:: [[assistant]]\n" + ChatgptToLogseqSanitizer.sanitize(chatResponse.trim()), {properties: {}});
        });
        console.log("lastChunk", lastChunk);
        console.log("finalChatResponse", chatResponse);
        await logseq.Editor.exitEditingMode(false);
        await logseq.Editor.selectBlock(resultBlock.uuid);

        if (finishReason && finishReason.trim().toLowerCase() == "length")
            await logseq.UI.showMsg("ChatGPT stopped early because of max_tokens limit. Please increase it in settings.", "warning", {timeout: 5000});
        else if (finishReason && finishReason.toLowerCase() != "stop")
            await logseq.UI.showMsg(`ChatGPT stopped early because of ${finishReason}.`, "warning", {timeout: 5000});

        if (prompt) {
            const source = page.properties['chatgptPromptSource'] || "";
            let singular_block_uuid = source.trim().match(/^\(\([^)\n ]*\)\)$/);
            if (singular_block_uuid) {
                const block = await logseq.Editor.getBlock(singular_block_uuid[0].slice(2, -2));
                if (!block) return;
                const blockPage = await logseq.Editor.getPage(block.page.id);
                ActionableNotification("What action would you like to perform with the result from ChatGPT?", [
                        {
                            label: "Insert",
                            labelSuffix: "↩️",
                            onClick: async () => {
                                let newBlock = await logseq.Editor.insertBlock(block.uuid, ChatgptToLogseqSanitizer.sanitize(chatResponse.trim()));
                                await logseq.Editor.scrollToBlockInPage(blockPage.originalName, newBlock.uuid);
                                if (logseq.settings.DELETE_PAGE_AFTER_PROMPT_ACTION)
                                    await logseq.Editor.deletePage(page.originalName);
                            }
                        },
                        {
                            label: "Replace",
                            labelSuffix: "🔄",
                            onClick: async () => {
                                await logseq.Editor.updateBlock(block.uuid, ChatgptToLogseqSanitizer.sanitize(chatResponse.trim()));
                                await logseq.Editor.scrollToBlockInPage(blockPage.originalName, block.uuid);
                                if (logseq.settings.DELETE_PAGE_AFTER_PROMPT_ACTION)
                                    await logseq.Editor.deletePage(page.originalName);
                            }
                        }
                    ],
                    {label: "Delete page after action", checked: logseq.settings.DELETE_PAGE_AFTER_PROMPT_ACTION, onChange: (checked) => {console.log(checked, logseq.settings.DELETE_PAGE_AFTER_PROMPT_ACTION); logseq.settings.DELETE_PAGE_AFTER_PROMPT_ACTION = checked;}});
            }
        }
    }

    private static async iterateChatGptResponse(asyncIterator, callback: (chunk: ResBody & { choices: [{ delta: any, finish_reason: null | 'stop' | 'length' | 'content_filter' }] }) => void) {
        for await (const responseStream of asyncIterator) {
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
