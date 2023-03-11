/**
 * This handles the ask chat GPT button event on ChatGPT pages.
 */
import {ICON_14} from "../utils/constants";
import {LogseqProxy} from "../logseq/LogseqProxy";
import {DOMElement} from "react";
import {AutoFlowFormatter} from "./AutoFlowFormatter";
import {ChatGPT, Message} from "chatgpt-wrapper";
import {removePropsFromBlockContent} from "../logseq/removePropsFromBlockContent";

export class AskChatGPTHandler {
    static inAskingInProgress = false;
    static init() {
        logseq.App.registerUIItem('pagebar', {
            key: `logseq-chatgpt${logseq.baseInfo.id == "logseq-chatgpt"? "" : "-"+logseq.baseInfo.id}`,
            template: String.raw`
              <a title="" data-on-click="" class="group item item-center logseq-chatgpt-callAPI-${logseq.baseInfo.id} flex">
                <span class="ui__icon ti ls-icon-hierarchy">${ICON_14}</span>
                <span class="flex-1">Ask ChatGPT</span>
              </a>
        `
        });
        LogseqProxy.App.registerPageHeadActionsSlottedListener(async (event) => {
            const button : HTMLButtonElement = window.parent.document.querySelector(`.logseq-chatgpt-callAPI-${logseq.baseInfo.id}`);
            if (button)
                button.classList.add("logseq-chatgpt-callAPI-btn");

            // Hide button if not on a ChatGPT page
            const page = await logseq.Editor.getCurrentPage();
            if (!(page.originalName && (page.properties?.type == "ChatGPT" || page.properties?.type == "[[ChatGPT]]")))
            {
                button.style.display = "none";
                return;
            }
            button.style.display = "sticky";
            console.log("Triggered");
            // Add event listener
            button.addEventListener("click", async () => {
                await AskChatGPTHandler.askChatGPTWrapper();
            });
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
            messages.push({role: block.properties?.speaker || "assistant", content: removePropsFromBlockContent(block.content).trim()});
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
            throw {message: "User message cannot be empty", type: 'warning'};

        // Add the system message
        if (logseq.settings.CHATGPT_SYSTEM_PROMPT)
            messages.unshift({role: "system", content: logseq.settings.CHATGPT_SYSTEM_PROMPT});

        // Call ChatGPT API
        const chat = new ChatGPT({
            API_KEY: logseq.settings.OPENAI_API_KEY
        });
        let chatResponse = "";
        let resObj = await chat.send({
            model: 'gpt-3.5-turbo',
            stream: false,
            messages: messages,
            max_tokens: 1000,
        });
        chatResponse += resObj.choices[0].message.content;
        if (resObj.choices[0].finish_reason && resObj.choices[0].finish_reason.trim().toLowerCase() == "length")
            await logseq.UI.showMsg("ChatGPT stopped early because of max_tokens limit. Please increase it in settings.", "warning", {timeout: 5000});
        else if (resObj.choices[0].finish_reason && resObj.choices[0].finish_reason.trim().toLowerCase() != "stop")
            await logseq.UI.showMsg(`ChatGPT stopped early because of ${resObj.choices[0].finish_reason.trim().toLowerCase()}.`, "warning", {timeout: 5000});
        console.log("resObj", resObj);
        await logseq.Editor.updateBlock(resultBlock.uuid, "speaker:: assistant\n"+chatResponse.trim(), {properties: {}});
    }
}