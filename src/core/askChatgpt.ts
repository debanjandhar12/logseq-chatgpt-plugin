import {ChatGPT, Message, ResBody} from "chatgpt-wrapper";
import {removePropsFromBlockContent} from "../adapter/removePropsFromBlockContent";
import {LogseqToChatgptConverter} from "../adapter/LogseqToChatgptConverter";
import {getAllPrompts} from "../prompt/getAllPrompts";
import Mustache from "mustache";
import getMessageArrayTokenCount from "../utils/getMessageArrayTokenCount";
import streamToAsyncIterator from "../utils/streamToAsyncIterator";
import {LogseqProxy} from "../logseq/LogseqProxy";
import {ChatgptToLogseqSanitizer} from "../adapter/ChatgptToLogseqSanitizer";
import {ActionableNotification} from "../ui/ActionableNotification";

export async function askChatGPT(pageName, {signal = new AbortController().signal}) {
    // Validate settings
    if (logseq.settings.OPENAI_API_KEY.trim() == "") {
        logseq.showSettingsUI();
        setTimeout(function () {
            logseq.App.openExternalLink('https://platform.openai.com/account/api-keys')
        }, 3000);
        throw { message: "OPENAI_API_KEY is empty. Please go to settings and set it.", type: 'warning' };
    }

    if (parseInt(logseq.settings.CHATGPT_MAX_TOKENS) < 100) {
        throw { message: "CHATGPT_MAX_TOKENS is too small. Please go to settings and set it to at least 100.", type: 'warning' };
    }

    const page = await logseq.Editor.getPage(pageName);
    if(page.properties.type != "ChatGPT") {
        throw { message: "Current page is not a ChatGPT page.", type: 'warning' };
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
    console.log(prompt, page.properties['chatgptPrompt']);
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
    while(getMessageArrayTokenCount(messages) > Math.floor((parseInt(logseq.settings.CHATGPT_MAX_TOKENS) - 32)*0.5))
        messages.shift();
    if (messages.length == 0)
        throw { message: "MAX_TOKEN limit reached by last message. Please consider increasing it in settings.", type: 'warning' };

    // Call ChatGPT API
    const chat = new ChatGPT({
        API_KEY: logseq.settings.OPENAI_API_KEY,
        URL: logseq.settings.CHATGPT_API_ENDPOINT.trim() || "https://api.openai.com/v1/chat/completions"
    });
    let chatResponse = "", finishReason = null, lastChunk = null;
    const chatResponseStream = await chat.stream({
        model: logseq.settings.CHATGPT_MODEL,
        stream: true,
        messages: messages,
        max_tokens: (parseInt(logseq.settings.CHATGPT_MAX_TOKENS) - 32) - getMessageArrayTokenCount(messages),  // deduct 32 tokens for safety
        presence_penalty: 0,    // try to avoid talking about new topics
        frequency_penalty: 0,
        temperature: logseq.settings.CHATGPT_TEMPERATURE || 0.7, // 0.7 is default
    }, {signal});
    if (signal.aborted) return;
    const chatResponseIterator = streamToAsyncIterator(chatResponseStream);
    await iterateChatGptResponse(chatResponseIterator, async (responseChunk) => {
        if (signal.aborted) {
            await chatResponseIterator.return();
            return;
        }
        chatResponse += responseChunk.choices[0].delta?.content || "";
        finishReason = responseChunk.choices[0].finish_reason;
        if (finishReason && finishReason.toLowerCase() == "stop")
            lastChunk = responseChunk;
        await LogseqProxy.Editor.updateBlockAfterDelay(resultBlock.uuid, () => "speaker:: [[assistant]]\n" + ChatgptToLogseqSanitizer.sanitize(chatResponse.trim()), {properties: {}});
    });
    console.log("lastChunk", lastChunk);
    console.log("finalChatResponse", chatResponse);
    await logseq.Editor.updateBlock(resultBlock.uuid, "speaker:: [[assistant]]\n" + ChatgptToLogseqSanitizer.sanitize(chatResponse.trim()), {properties: {}});
    await logseq.Editor.exitEditingMode(false);
    await logseq.Editor.selectBlock(resultBlock.uuid);

    if (finishReason && finishReason.trim().toLowerCase() == "length")
        await logseq.UI.showMsg("ChatGPT stopped early because of max_tokens limit. Please increase it in settings.", "warning", {timeout: 5000});
    else if (finishReason && finishReason.toLowerCase() != "stop")
        await logseq.UI.showMsg(`ChatGPT stopped early because of ${finishReason}.`, "warning", {timeout: 5000});

    if (prompt || (page.properties['chatgptPrompt'] && page.properties['chatgptPrompt'].startsWith("Custom:"))) {
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
                            if (logseq.settings.DELETE_PAGE_AFTER_PROMPT_ACTION)
                                await logseq.Editor.deletePage(page.originalName)
                            await logseq.Editor.scrollToBlockInPage(blockPage.originalName, newBlock.uuid);;
                        }
                    },
                    {
                        label: "Replace",
                        labelSuffix: "🔄",
                        onClick: async () => {
                            await logseq.Editor.updateBlock(block.uuid, ChatgptToLogseqSanitizer.sanitize(chatResponse.trim()));
                            if (logseq.settings.DELETE_PAGE_AFTER_PROMPT_ACTION)
                                await logseq.Editor.deletePage(page.originalName);
                            await logseq.Editor.scrollToBlockInPage(blockPage.originalName, block.uuid);
                        }
                    }
                ],
                {
                    label: "Delete page after action",
                    checked: logseq.settings.DELETE_PAGE_AFTER_PROMPT_ACTION,
                    onChange: (checked) => {
                        console.log(checked, logseq.settings.DELETE_PAGE_AFTER_PROMPT_ACTION);
                        logseq.updateSettings({DELETE_PAGE_AFTER_PROMPT_ACTION: checked})
                    }
                });
        }
    }
}

async function iterateChatGptResponse(asyncIterator, callback: (chunk: ResBody & { choices: [{ delta: any, finish_reason: null | 'stop' | 'length' | 'content_filter' }] }) => void) {
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
            }
        }
    }
}
