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
import {BaseMessage, BaseChatMessageHistory, LLMResult, SystemMessage} from "langchain/schema";
import {UserMessage} from "../../langchain/schema/UserMessage";
import {AssistantMessage} from "../../langchain/schema/AssistantMessage";
import {ChatOpenAI} from "langchain/chat_models/openai";
import {initializeAgentExecutorWithOptions} from "langchain/agents";
import {Tool} from "langchain/tools";
import {BufferMemory, ChatMessageHistory} from "langchain/memory";
import {ChatPromptTemplate, HumanMessagePromptTemplate, MessagesPlaceholder} from "langchain/prompts";
import {ConversationChain} from "langchain/chains";
import {BaseCallbackHandler, Callbacks} from "langchain/callbacks";
import {CallbackHandlerMethods} from "langchain/dist/callbacks/base";
import _ from "lodash";
import getUUIDFromBlock from "../../logseq/getUUIDFromBlock";
import {calculateMaxTokens} from "langchain/base_language";

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
            message: "CHATGPT_MAX_TOKENS is too small. Please go to settings and set it to at least 100. Recommended value is 3072.",
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
    const prompt = (await getAllPrompts()).find(p => new RegExp(p.name.replaceAll('{{{userInput}}}', '.*')).test(page.properties['chatgptPrompt'] || ""));
    let isAgentCall = prompt && prompt.tools && prompt.tools.length > 0;
    console.log("%c🧩 Running prompt:", 'background-color: #05f26c;', prompt);

    // Collect all messages and find block to insert result
    const messages: BaseMessage[] = [];
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
            String(block.properties?.speaker) == "user" || String(block.properties?.speaker) == "[[user]]" ?
                new UserMessage((await LogseqToChatgptConverter.convert(block.content)).trim()) :
                new AssistantMessage((await LogseqToChatgptConverter.convert(block.content)).trim())
        );
        if (block.children)
            stack.push(...block.children);
    }
    if (stack.length > 0) {
        resultBlock = stack.pop();
    } else if (messages.length != 0 && messages[messages.length - 1]._getType() == "human" && messages[messages.length - 1].content != "") {
        // @ts-ignore
        resultBlock = await window.parent.logseq.api.insert_block(page.originalName, "", {
            isPageBlock: true,
            sibling: true
        });
        if (!resultBlock) return;
    }

    // Check if messages list is valid
    if (pageBlocks.length == 1 || messages.length == 0) {
        throw { message: "No messages. Please write a messages to the page.", type: 'warning' };
    } else if (messages[messages.length - 1]._getType() != "human") {
        throw { message: "Last message is not from user", type: 'warning' };
    } else if (messages[messages.length - 1].content.trim() == "") {
        throw {
            message: "User message cannot be empty",
            type: 'warning',
            blockUUID: pageBlocks[messages.length].uuid
        };
    }

    // Add uuid to last message
    await LogseqProxy.Editor.upsertBlockProperty(getUUIDFromBlock(resultBlock), "speaker", `[[assistant]]`);
    await logseq.Editor.exitEditingMode(false);

    // Add prefix messages from prompt if set
    if (prompt && prompt.getPromptPrefixMessages)
        messages.unshift(...prompt.getPromptPrefixMessages());

    // Add the system message
    if (logseq.settings.CHATGPT_SYSTEM_PROMPT && !prompt) {
        messages.unshift(new SystemMessage(Mustache.render(logseq.settings.CHATGPT_SYSTEM_PROMPT,  // Process Mustache template
            {page, timestamp: Date.now(), today: new Date().toISOString().split('T')[0]})));
    }

    // Separate the last message from the rest
    const lastMessage = messages[messages.length - 1];
    const otherMessages = messages.slice(0, messages.length - 1);

    // Add the postfix message from prompt if set
    if (prompt && prompt.getPromptSuffixMessage)
        lastMessage.content += "\n"+prompt.getPromptSuffixMessage().trim();

    // Call ChatGPT API
    let chatResponse: string = "";
    const chat = new ChatOpenAI({
        openAIApiKey: logseq.settings.OPENAI_API_KEY,
        timeout: 0,
        callbacks: [
            {
                async handleLLMStart() {
                    if (signal.aborted)
                        return;
                }
            },
            {
                async handleLLMEnd(output: LLMResult) {
                    if (output.generations[0][0].generationInfo?.finishReason) { // TODO: Does not work in browser atm
                        console.log("finishReason", output.generations[0][0].generationInfo?.finishReason);
                        await logseq.UI.showMsg("ChatGPT stopped early because of max_tokens limit. Please increase it in settings.", "warning", {timeout: 5000});
                    }
                }
            },
            {
                async handleLLMError(error: any) {
                    throw error;
                }
            }
        ],
    }, {basePath: logseq.settings.CHATGPT_API_ENDPOINT.replace(/\/chat\/completions\/?$/gi, '').trim() || "https://api.openai.com/v1"});
    chat.modelName = logseq.settings.CHATGPT_MODEL;
    const mem = new BufferMemory({returnMessages: true, memoryKey: "chat_history", inputKey: "input"});
    mem.chatHistory = new ChatMessageHistory(otherMessages);

    if(isAgentCall) {
        const tools : Tool[] = prompt.tools;
        tools.forEach(tool => (tool as any).signal = signal);
        const executor = await initializeAgentExecutorWithOptions(
            tools,
            chat,
            {
                agentType: "chat-conversational-react-description",
                memory: mem,
                verbose: false
            }
        );
        const result = await executor.call({input: lastMessage.text, signal: signal, timeout: 0}, [
            getToolStartLogCallback(resultBlock),
            getChatModelStartTrimMessageCallback(chat),
            getToolEndLogCallback(resultBlock),
            getToolErrorLogCallback(resultBlock)
        ]);
        chatResponse = result.output;
    }
    else {
        chat.streaming = true;
        const inputStructure = ChatPromptTemplate.fromPromptMessages([
            new MessagesPlaceholder("chat_history"),
            HumanMessagePromptTemplate.fromTemplate("{input}"),
        ]);
        const chain = new ConversationChain({ llm: chat, memory: mem, prompt: inputStructure });
        const result = await chain.call({input: lastMessage.text, signal: signal, timeout: 0}, [
                {
                    async handleLLMNewToken(token: string) {
                        if (signal.aborted)
                            throw new Error("Cancel: canceled");
                        chatResponse += token;
                        await LogseqProxy.Editor.updateBlockAfterDelay(getUUIDFromBlock(resultBlock), () => "speaker:: [[assistant]]\n" + ChatgptToLogseqSanitizer.sanitize(chatResponse), {properties: {}});
                    }
                },
                getChatModelStartTrimMessageCallback(chat)
            ]);
        chatResponse = result.response;
    }

    if (signal.aborted) throw new Error("Cancel: canceled");
    await logseq.Editor.updateBlock(getUUIDFromBlock(resultBlock), "speaker:: [[assistant]]\n" + ChatgptToLogseqSanitizer.sanitize(chatResponse.trim()), {properties: {}});
    await logseq.Editor.exitEditingMode(false);
    await logseq.Editor.selectBlock(getUUIDFromBlock(resultBlock));

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
                        if (outline && (await Confirm("The message contains data in the form of an outline. Would you like to add it as separate blocks?"))) {
                            await logseq.Editor.insertBatchBlock(block.uuid, outline, {sibling: false});
                        } else {
                            let sanitizedOutput = ChatgptToLogseqSanitizer.sanitize(chatResponse.trim());
                            sanitizedOutput = sanitizedOutput.replace(/^(\s| )+/gm, ''); // Remove task prompt wierd char
                            selectBlockAfterOp = await logseq.Editor.insertBlock(block.uuid, sanitizedOutput, {sibling: false});
                        }
                        if (logseq.settings.DELETE_PAGE_AFTER_PROMPT_ACTION)
                            await logseq.Editor.deletePage(page.originalName)
                        logseq.Editor.scrollToBlockInPage(blockPage.originalName, selectBlockAfterOp.uuid);
                    }
                }
            ];
            if (blocksMatch.length == 1) {
                buttonArr.push({
                        label: "Replace",
                        labelSuffix: "🔄",
                        onClick: async () => {
                            let sanitizedOutput = ChatgptToLogseqSanitizer.sanitize(chatResponse.trim());
                            sanitizedOutput = sanitizedOutput.replace(/^(\s| )+/gm, ''); // Remove task prompt wierd char
                            await logseq.Editor.updateBlock(block.uuid, sanitizedOutput);
                            if (logseq.settings.DELETE_PAGE_AFTER_PROMPT_ACTION)
                                await logseq.Editor.deletePage(page.originalName);
                            logseq.Editor.scrollToBlockInPage(blockPage.originalName, block.uuid);
                        }
                    });
            }
            ActionableNotification("What action would you like to perform with the result from ChatGPT?", buttonArr,
                {
                    label: "Delete page after action",
                    checked: logseq.settings.DELETE_PAGE_AFTER_PROMPT_ACTION,
                    onChange: (checked) => {
                        logseq.updateSettings({DELETE_PAGE_AFTER_PROMPT_ACTION: checked})
                    }
                });
        }
    }
}

// LangChain Callback Objects (TODO: Move to separate file)
const getChatModelStartTrimMessageCallback = (chat: ChatOpenAI) => {
    let res: (BaseCallbackHandler | CallbackHandlerMethods) = {};
    res.handleChatModelStart = async (llm, messages) => {
        const originalMessages = _.cloneDeep(messages);
        if (messages.length != 1)
            throw new Error("Wew! The plugin somehow wants to sent concurrent messages. Please contact dev.");
        let chatHistory = messages[0];
        for (let i = 0; i < chatHistory.length; i++) {
            if (chatHistory[i]._getType() != "human" && chatHistory[i]._getType() != "ai") continue; // Skip trimming non-user messages
            if (await getMessageArrayTokenCount(chatHistory) > Math.floor(parseInt(logseq.settings.CHATGPT_MAX_TOKENS) * 0.5)) {
                chatHistory.splice(i, 1);
            }
        }
        let chosenModelMaxTokens = await calculateMaxTokens({prompt: '', modelName: logseq.settings.CHATGPT_MODEL});
        if (logseq.settings.CHATGPT_MODEL == "gpt-3.5-turbo-16k") chosenModelMaxTokens = 16384;
        chat.maxTokens = Math.min(parseInt(logseq.settings.CHATGPT_MAX_TOKENS) || 4000, chosenModelMaxTokens) - await getMessageArrayTokenCount(chatHistory) - 32;
        messages = [chatHistory];
        console.log('%c🦜 Starting chat model', 'background-color: #05f2cb; font-weight: bold;', 'Original messages', originalMessages, 'Trimmed messages', messages);
        if (chatHistory.length == 0 || chat.maxTokens <= 0 || chatHistory[chatHistory.length - 1]._getType() == "system")
            throw new Error("The last message is too long. Please consider increasing the MAX_TOKENS limit in settings.");
    }
    return res;
}

const getToolStartLogCallback = (resultBlock?) => {
    let res: (BaseCallbackHandler | CallbackHandlerMethods) = {};
    res.handleToolStart = async (tool, input, ...rest) => {
        console.log(`%c🔧Starting tool ${tool.id[2]} with input ${input}`, 'background-color: #c5c7c7; font-weight: bold;');
        if (resultBlock && getUUIDFromBlock(resultBlock)) {
            await logseq.Editor.updateBlock(getUUIDFromBlock(resultBlock), "speaker:: [[assistant]]\n" + `> 🔧 Starting tool <b>${tool.id[2]}</b> with input <b>${input}</b>`, {properties: {}});
            await logseq.Editor.exitEditingMode(false);
        }
    }
    return res;
}

const getToolEndLogCallback = (resultBlock?) => {
    let res: (BaseCallbackHandler | CallbackHandlerMethods) = {};
    res.handleToolEnd = async (output, runId) => {
        console.log('%c🔧Output from tool:', 'background-color: #c5c7c7; font-weight: bold;', output);
        // if (resultBlock && getUUIDFromBlock(resultBlock))
        //     await logseq.Editor.updateBlock(getUUIDFromBlock(resultBlock), "speaker:: [[assistant]]\n", {properties: {}});
    }
    return res;
}

const getToolErrorLogCallback = (resultBlock?) => {
    let res: (BaseCallbackHandler | CallbackHandlerMethods) = {};
    res.handleToolError = async (error) => {
        console.error(`Tool error: ${error}`);
        if (resultBlock && getUUIDFromBlock(resultBlock))
            await logseq.Editor.updateBlock(getUUIDFromBlock(resultBlock), "", {properties: {}});
        throw error;
    }
    return res;
}