import {removePropsFromBlockContent} from "../../adapter/removePropsFromBlockContent";
import {LogseqToChatgptConverter} from "../../adapter/LogseqToChatgptConverter";
import {getAllPrompts} from "../../prompt/getAllPrompts";
import Mustache from "mustache";
import getMessageArrayTokenCount from "../../utils/getMessageArrayTokenCount";
import {LogseqProxy} from "../../logseq/LogseqProxy";
import {ChatgptToLogseqSanitizer} from "../../adapter/ChatgptToLogseqSanitizer";
import {ActionableNotification} from "../../ui/ActionableNotification";
import {LogseqOutlineParser} from "../../adapter/LogseqOutlineParser";
import {Confirm} from "../../ui/Confirm";
import {BaseChatMessage, BaseChatMessageHistory, LLMResult, SystemChatMessage} from "langchain/schema";
import {UserChatMessage} from "../../langchain/schema/UserChatMessage";
import {AssistantChatMessage} from "../../langchain/schema/AssistantChatMessage";
import {ChatOpenAI} from "langchain/chat_models/openai";
import {AsyncCaller} from "langchain/dist/util/async_caller";
import {initializeAgentExecutorWithOptions} from "langchain/agents";
import {Calculator} from "langchain/dist/tools/calculator";
import {Tool} from "langchain/dist/tools/base";
import {BufferMemory, ChatMessageHistory} from "langchain/memory";

export async function askChatGPT(pageName, {signal = new AbortController().signal}) {
    // Validate settings
    if (logseq.settings.OPENAI_API_KEY.trim() == "") {
        logseq.showSettingsUI();
        setTimeout(function () {
            logseq.App.openExternalLink('https://platform.openai.com/account/api-keys')
        }, 3000);
        throw {message: "OPENAI_API_KEY is empty. Please go to settings and set it.", type: 'warning'};
    }

    if (parseInt(logseq.settings.CHATGPT_MAX_TOKENS) < 100) {
        throw {
            message: "CHATGPT_MAX_TOKENS is too small. Please go to settings and set it to at least 100.",
            type: 'warning'
        };
    }

    const page = await logseq.Editor.getPage(pageName);
    if (page.properties.type != "ChatGPT") {
        throw {message: "Current page is not a ChatGPT page.", type: 'warning'};
    }

    if (logseq.settings.CHATGPT_API_ENDPOINT &&
        logseq.settings.CHATGPT_API_ENDPOINT.trim() != "" &&
        !logseq.settings.CHATGPT_API_ENDPOINT.trim().startsWith("http")) {
        throw {message: "CHATGPT_API_ENDPOINT is not a valid URL.", type: 'warning'};
    }


    // Determine type of call
    const prompt = (await getAllPrompts()).find(p => new RegExp(p.name.replaceAll('{{userInput}}', '.*')).test(page.properties['chatgptPrompt'] || ""));
    let isAgentCall = prompt && prompt.tools && prompt.tools.length > 0;
    console.log("prompt", prompt);

    // Collect all messages and find block to insert result
    const messages: BaseChatMessage[] = [];
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
        messages.push(
            String(block.properties?.speaker) == "user" ?
                new UserChatMessage((await LogseqToChatgptConverter.convert(block.content)).trim()) :
                new AssistantChatMessage((await LogseqToChatgptConverter.convert(block.content)).trim())
        );
        console.log(messages);
        if (block.children)
            stack.push(...block.children);
    }
    if (stack.length > 0) {
        resultBlock = stack.pop();
    } else if (messages.length != 0 && messages[messages.length - 1].name == "user" && messages[messages.length - 1].text != "") {
        // @ts-ignore
        resultBlock = await window.parent.logseq.api.insert_block(page.originalName, "", {
            isPageBlock: true,
            sibling: true
        });

        if (!resultBlock) return;
    }
    console.log("resultBlock", resultBlock);
    console.log("messages", messages);

    // Check if messages list is valid
    if (pageBlocks.length == 1 || messages.length == 0) {
        throw { message: "No messages. Please write a messages to the page.", type: 'warning' };
    } else if (messages[messages.length - 1].name != "user") {
        throw { message: "Last message is not from user", type: 'warning' };
    } else if (messages[messages.length - 1].text.trim() == "") {
        throw {
            message: "User message cannot be empty",
            type: 'warning',
            blockUUID: pageBlocks[messages.length].uuid
        };
    }

    // Add prefix messages from prompt if set
    if (prompt && prompt.getPromptPrefixMessages)
        messages.unshift(...prompt.getPromptPrefixMessages());

    // Add the system message
    let systemMsgContent = "";
    if (logseq.settings.CHATGPT_SYSTEM_PROMPT && !prompt) {
        systemMsgContent = Mustache.render(logseq.settings.CHATGPT_SYSTEM_PROMPT,  // Process Mustache template
            {page, timestamp: Date.now(), today: new Date().toISOString().split('T')[0]});
    } else {
        systemMsgContent = Mustache.render(`You are a tool who replies using markdown. Current date: {{today}}`,
            { page, timestamp: Date.now(), today: new Date().toISOString().split('T')[0], prompt });
    }
    messages.unshift(new SystemChatMessage(systemMsgContent));

    // Context Window - Remove messages from top until we reach token limit
    while(getMessageArrayTokenCount(messages, isAgentCall) > Math.floor((parseInt(logseq.settings.CHATGPT_MAX_TOKENS) - 16)*0.5))
        messages.shift();
    if (messages.length == 0)
        throw { message: "MAX_TOKEN limit reached by last message. Please consider increasing it in settings.", type: 'warning' };

    // Call ChatGPT API
    let chatResponse: string = "";
    const chat = new ChatOpenAI({
        openAIApiKey: logseq.settings.OPENAI_API_KEY,
        cache: false,
        callbacks: [
            {
                async handleLLMError(error: any) {
                    throw error;
                }
            },
            {
                async handleLLMEnd(output: LLMResult) {
                    console.log("output", output);
                    if (output.generations[0][0].generationInfo?.finishReason) { // TODO: Does not work in browser atm
                        console.log("finishReason", output.generations[0][0].generationInfo?.finishReason);
                        await logseq.UI.showMsg("ChatGPT stopped early because of max_tokens limit. Please increase it in settings.", "warning", {timeout: 5000});
                    }
                }
            }
        ],
    }, {basePath: logseq.settings.CHATGPT_API_ENDPOINT.replace(/\/chat\/completions\/?$/gi, '').trim() || "https://api.openai.com/v1"});
    chat.modelName = logseq.settings.CHATGPT_MODEL;
    chat.streaming = true;
    chat.maxTokens = parseInt(logseq.settings.CHATGPT_MAX_TOKENS) - getMessageArrayTokenCount(messages, isAgentCall) - 16;
    // chat.caller = new AsyncCaller({maxRetries: 5});
    let result;
    if(isAgentCall) {
        const lastMessage = messages[messages.length - 1];
        const otherMessages = messages.slice(0, messages.length - 1);
        const mem = new BufferMemory({returnMessages: true, memoryKey: "chat_history"});
        mem.chatHistory = new ChatMessageHistory(otherMessages.map(msg => { msg.name = undefined; return msg; }));
        const tools : Tool[] = prompt.tools;
        const executor = await initializeAgentExecutorWithOptions(
            tools,
            chat,
            {
                agentType: "chat-conversational-react-description",
                memory: mem,
                verbose: false
            }
        );
        result = await executor.call({input: lastMessage.text}, [
            {
                async handleToolStart(tool: {
                    name: string;
                }, input: string) {
                    if (signal.aborted)
                        return;
                    console.log(`Starting tool ${tool.name} with input ${input}`);
                }
            },
            {
                async handleLLMStart() {
                    if (signal.aborted)
                        return;
                }
            },
            {
                handleAgentAction(action){
                    console.log(action);
                }
            }
        ]);
        chatResponse = result.output;
    }
    else {
        result = await chat.call([
            ...messages.map(msg => { msg.name = undefined; return msg; })
        ], {
            options: {
                // @ts-ignore
                signal: signal
            }
        }, [{
            async handleLLMNewToken(token: string) {
                if (signal.aborted)
                    return;
                chatResponse += token;
                console.log("token", token);
                await LogseqProxy.Editor.updateBlockAfterDelay(resultBlock.uuid, () => "speaker:: [[assistant]]\n" + ChatgptToLogseqSanitizer.sanitize(chatResponse), {properties: {}});
            }
        }]);
        chatResponse = result.text;
    }
    console.log("result", result);

    if (signal.aborted) return;
    await logseq.Editor.updateBlock(resultBlock.uuid, "speaker:: [[assistant]]\n" + ChatgptToLogseqSanitizer.sanitize(chatResponse.trim()), {properties: {}});
    await logseq.Editor.exitEditingMode(false);
    await logseq.Editor.selectBlock(resultBlock.uuid);

    if (prompt) {
        const source = page.properties['chatgptPromptSource'] || "";
        let blocksMatch = source.trim().match(/\(\(.+?\)\)/g);
        if (blocksMatch && blocksMatch.length > 0) {
            let blockUUID = blocksMatch[blocksMatch.length - 1].slice(2, -2);
            const block = await logseq.Editor.getBlock(blockUUID);
            if (!block) return;
            const blockPage = await logseq.Editor.getPage(block.page.id);
            const buttonArr = [
                {
                    label: "Insert",
                    labelSuffix: "↩️",
                    onClick: async () => {
                        let selectBlockAfterOp = block;
                        let outline = LogseqOutlineParser.parse(chatResponse.trim());
                        console.log(outline);
                        if (outline && (await Confirm("The message contains data in the form of an outline. Would you like to add it as separate blocks?"))) {
                            await logseq.Editor.insertBatchBlock(block.uuid, outline, {sibling: false});
                        } else {
                            selectBlockAfterOp = await logseq.Editor.insertBlock(block.uuid, ChatgptToLogseqSanitizer.sanitize(chatResponse.trim()), {sibling: false});
                        }
                        if (logseq.settings.DELETE_PAGE_AFTER_PROMPT_ACTION)
                            await logseq.Editor.deletePage(page.originalName)
                        await logseq.Editor.scrollToBlockInPage(blockPage.originalName, selectBlockAfterOp.uuid);
                    }
                }
            ];
            if (blocksMatch.length == 1) {
                buttonArr.push({
                    label: "Replace",
                    labelSuffix: "🔄",
                    onClick: async () => {
                        await logseq.Editor.updateBlock(block.uuid, ChatgptToLogseqSanitizer.sanitize(chatResponse.trim()));
                        if (logseq.settings.DELETE_PAGE_AFTER_PROMPT_ACTION)
                            await logseq.Editor.deletePage(page.originalName);
                        await logseq.Editor.scrollToBlockInPage(blockPage.originalName, block.uuid);
                    }
                });
            }
            ActionableNotification("What action would you like to perform with the result from ChatGPT?", buttonArr,
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
