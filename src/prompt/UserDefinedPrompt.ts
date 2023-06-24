import {Prompt, PromptVisibility} from "../types/Prompt";
import Mustache from "mustache";
import {UserChatMessage} from "../langchain/schema/UserChatMessage";
import {DynamicTool, Tool, ZapierNLAWrapper} from "langchain/tools";
import JSON5 from 'json5';
import _ from "lodash";
import {cleanObj} from "../utils/cleanObj";
import {convertNestedJSONStringToObj} from "../utils/convertNestedJSONStringToObj";
import {SearchEngineTool} from "../langchain/tools/SearchEngine";
import {CustomWebBrowser} from "../langchain/tools/CustomWebBrowser";
import {ZapierToolKit} from "langchain/agents";
import {SystemChatMessage} from "langchain/schema";
import moment from "moment/moment";

export class UserDefinedPrompt {
    public static async getPrompts(): Promise<Prompt[]> {
        let userDefinedPrompts = [];
        try {
            userDefinedPrompts = JSON.parse(logseq.settings.userDefinedPromptList);
        } catch {}

        // Filter out empty names
        userDefinedPrompts = userDefinedPrompts.filter((userDefinedPrompt) => {
            return userDefinedPrompt.name && userDefinedPrompt.name.trim() != '';
        });

        userDefinedPrompts = userDefinedPrompts.map(async (userDefinedPrompt) => {
            let name = userDefinedPrompt.name;
            userDefinedPrompt.promptMessage = userDefinedPrompt.promptMessage || userDefinedPrompt.name;
            let promptVisibilityNameToFunctionMap = {
                'No Input': PromptVisibility.NoInput,
                'Single Block': PromptVisibility.SingleBlock,
                'Blocks': PromptVisibility.Blocks
            }
            let isVisibleInCommandPrompt = promptVisibilityNameToFunctionMap[userDefinedPrompt.promptVisibility]
                || PromptVisibility.NoInput;

            let tools: Tool[] = [];
            if (userDefinedPrompt.tool == 'WebBrowser') {
                tools = [new SearchEngineTool(), new CustomWebBrowser()];
            } else if (userDefinedPrompt.tool == 'ZapierNLA') {
                // TODO: Move this out to a separate file
                let zapierLoadedSuccessfully = false;
                try {
                    const zapierNLAWrapper = new ZapierNLAWrapper({apiKey: logseq.settings.ZAPIER_NLA_API_KEY});
                    tools = (await ZapierToolKit.fromZapierNLAWrapper(zapierNLAWrapper)).tools;
                    zapierLoadedSuccessfully = true;
                } catch (e) {}
                if (tools.length == 0) {
                    tools = [new DynamicTool({
                        name: 'Zapier',
                        description: 'This tool contains important information. Always call this before replying to user.',
                        func: async (input: string) => {
                            if (logseq.settings.ZAPIER_NLA_API_KEY == '') {
                                throw `ZapierNLA failed to load. Please set your API key.`;
                            }
                            if (!logseq.settings.ZAPIER_NLA_API_KEY.startsWith('sk')) {
                                throw `ZapierNLA failed to load due to incorrect API Key. Please check your API key.`;
                            }
                            if (!zapierLoadedSuccessfully) {
                                throw `ZapierNLA failed to load. Please check your API key.`;
                            }
                            throw `ZapierNLA does not have any actions. Please add actions at https://nla.zapier.com/dev/actions/.`;
                        }
                    })]
                }
            } else if (userDefinedPrompt.tool && userDefinedPrompt.tool.type && userDefinedPrompt.tool.type == 'API') {
                const {apiEndpoint, toolDesc, method, body, headers} = userDefinedPrompt.tool.metadata;
                const tool = new DynamicTool({
                    name: `${encodeURI(apiEndpoint.split('?')[0])} API`,
                    description: toolDesc || `Call ${apiEndpoint}. Useful to answer user queries.`,
                    func: async (input) => {
                        // Handle file and base64 inputs
                        let base64Input = '', fileInput;
                        if (apiEndpoint.includes('eval') || apiEndpoint.includes('base64:input')
                            || headers.includes('eval') || headers.includes('base64:input')
                            || body.includes('eval') || body.includes('base64:input') || body.includes('file:input')) {
                            let getBase64 = async (url) => {
                                const response = await fetch(url,{// @ts-ignore
                                        signal: tool.signal});
                                const blob = await response.blob();
                                const reader = new FileReader();
                                await new Promise((resolve, reject) => {
                                    reader.onload = resolve;
                                    reader.onerror = reject;
                                    reader.readAsDataURL(blob);
                                });
                                return (reader.result as string);
                            }
                            let getFile = async (url) => {
                                const fileName = new URL(url).pathname.split('/').pop();
                                const response = await fetch(url,{// @ts-ignore
                                        signal: tool.signal});
                                const blob = await response.blob();
                                return new File([blob], fileName, {type: blob.type});
                            }

                            if (input.startsWith('../assets/')) {
                                input = await logseq.Assets.makeUrl(input);
                                input = decodeURIComponent(input);
                                if (input.startsWith('assets://')) {
                                    input = input.replace('assets://', 'file://');
                                }
                            }
                            try {
                                if (input.startsWith('file://') || input.startsWith('http://') || input.startsWith('https://'))
                                    base64Input = await getBase64(input);
                            } catch (e) {
                                console.error(e);
                            }
                            try {
                                if (input.startsWith('file://') || input.startsWith('http://') || input.startsWith('https://'))
                                    fileInput = await getFile(input);
                            } catch (e) {
                                console.error(e);
                            }
                        }

                        // Prepare the request parameters
                        const mustacheView = {
                            input: input,
                            "base64:input": base64Input,
                            "eval": function () {
                                return function (code) {
                                    return (() => eval(code)).call(this);
                                }
                            }
                        };
                        let headersObj : any = {};
                        try {
                            headersObj = JSON5.parse(headers);
                            headersObj = _.mapValues(headersObj, (value) => {
                                if (typeof value == 'string')
                                    return Mustache.render(value, mustacheView);
                                else
                                    return value;
                            });
                        } catch (e) {
                            console.error(e+'at headers');
                        }
                        let bodyObj : any = {};
                        try {
                            bodyObj = JSON5.parse(body);
                            if (userDefinedPrompt.tool.metadata.bodyType == 'Form Data') {
                                let formData = new FormData();
                                for (let key in bodyObj) {
                                    let value = bodyObj[key];
                                    if (typeof value == 'string') {
                                        if (value.trim() == '{{{file:input}}}' || value.trim() == '{{file:input}}')
                                            value = fileInput;
                                        else
                                            value = Mustache.render(value, mustacheView);
                                    }
                                    formData.append(key, value);
                                }
                                bodyObj = formData;
                            } else {
                                bodyObj = _.mapValues(bodyObj, (value) => {
                                    if (typeof value == 'string')
                                        return Mustache.render(value, mustacheView);
                                    else
                                        return value;
                                });
                                bodyObj = JSON.stringify(bodyObj);
                            }
                        } catch (e) {
                            console.error(e+'at body');
                        }
                        console.log(`%c🔧Fetching ${Mustache.render(apiEndpoint, mustacheView)}`, 'background-color: #c5c7c7; font-weight: bold', `(${method || 'POST'})`, `Headers:`, headersObj, `Body:`, bodyObj);
                        const fetchParams = {
                            method: method || 'POST',
                            body: bodyObj || '{}',
                            headers: headersObj || {},
                            // @ts-ignore
                            signal: tool.signal
                        };
                        const response = await fetch(Mustache.render(apiEndpoint, mustacheView), method == 'POST' ? fetchParams : _.omit(fetchParams,'body'));
                        let result: any | string = '';
                        try {
                            result = await response.json();
                            try {
                                result = convertNestedJSONStringToObj(result);
                                result = cleanObj(result);
                            } catch (e) {}
                            result = JSON.stringify(result);
                        } catch {
                            result = await response.text();
                        }
                        return result;
                    }
                });
                // @ts-ignore
                tool.signal = null;
                tools = [tool];
            }
            return {
                name,
                isVisibleInCommandPrompt,
                tools,
                getPromptPrefixMessages: () => userDefinedPrompt.tool == 'None' && userDefinedPrompt.hiddenPromptMsg.trim() != '' ? [
                    new SystemChatMessage(`Current Time: ${moment().format('YYYY-MM-DD')} ${moment().format('HH:mm')}`),
                    new UserChatMessage(userDefinedPrompt.hiddenPrefixPromptMsg)
                ] : [new SystemChatMessage(`Current Time: ${moment().format('YYYY-MM-DD')} ${moment().format('HH:mm')}`)],
                getPromptSuffixMessage: () => userDefinedPrompt.tool != 'None' && userDefinedPrompt.hiddenPromptMsg.trim() != '' ? userDefinedPrompt.hiddenPromptMsg : '',
                getPromptMessage: (userInput, invokeState) => {
                    return Mustache.render(userDefinedPrompt.promptMessage, {
                        userInput,
                        selectedBlocksList: invokeState.selectedBlocks.map(b => `{{embed ((${b.uuid}))}}`).join('\n')
                    })
                },
                group: 'custom'
            }
        });
        userDefinedPrompts = await Promise.all(userDefinedPrompts);
        return userDefinedPrompts;
    }
}