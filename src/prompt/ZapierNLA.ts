import {Prompt, PromptVisibility} from "../types/Prompt";
import Mustache from "mustache";
import {ZapierToolKit} from "langchain/agents";
import {DynamicTool, ZapierNLAWrapper} from "langchain/tools";

export class ZapierNLA {
    public static async getPrompts(): Promise<Prompt[]> {
        let tools = [], zapierLoadedSuccessfully = false;
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
        return [{
            name: `{{{userInput}}} using ZapierNLA`,
            isVisibleInCommandPrompt: PromptVisibility.NoInput,
            tools: tools,
            getPromptMessage: (userInput, invokeState) =>
                Mustache.render(`{{{userInput}}}`, {userInput}),
            group: 'zapier'
        }];
    }
}