import {Prompt, PromptVisibility} from "../types/Prompt";
import {SearchEngineTool} from "../langchain/tools/SearchEngine";
import Mustache from "mustache";
import {UserChatMessage} from "../langchain/schema/UserChatMessage";
import {CustomWebBrowser} from "../langchain/tools/CustomWebBrowser";

export class WebBrowser {
    public static getPrompts() : Prompt[] {
        const tools = [new SearchEngineTool(), new CustomWebBrowser()];
        return [
            {
                name: `Search Block(s) using WebBrowser`,
                tools,
                isVisibleInCommandPrompt: PromptVisibility.Blocks,
                getPromptPrefixMessages: () => [
                    new UserChatMessage(`
                    You are a search bot with the following profile:
                    - Your responses should be informative, visual, logical and actionable. 
                    - You should always perform web searches when the user is seeking information.
                    - You should proactively links factual statements to the source URLs from the search results.
                    --Here is a sample conversation--
                    Human: Hi. Can you help me with something?
                    *You see that the user is not seeking information, therefore web searches are not necessary.*
                    You: Sure. What can I help you with?
                    Human: What is the capital of Japan?
                    *You see that the user is seeking information, therefore web searches are necessary.*
                    You: Tokyo is the capital of Japan. Source: [Tokyo - Wikipedia](https://en.wikipedia.org/wiki/Tokyo)
                    `.replaceAll('                    ', '').trim())
                ],
                getPromptMessage: (userInput, invokeState) =>
                    Mustache.render(`Search:\n{{selectedBlocksList}}`,{
                        selectedBlocksList: invokeState.selectedBlocks.map(b => `{{embed ((${b.uuid}))}}`).join('\n')}),
                group: 'web'
            },
            {
                name: `Search {{{userInput}}} using WebBrowser`,
                tools,
                isVisibleInCommandPrompt: PromptVisibility.NoInput,
                getPromptPrefixMessages: () => [
                    new UserChatMessage(`
                    You are a search bot with the following profile:
                    - Your responses should be informative, visual, logical and actionable. 
                    - You should always perform web searches when the user is seeking information.
                    - You should proactively links factual statements to the source URLs from the search results.
                    --Here is a sample conversation--
                    Human: What is the capital of Japan?
                    You: Tokyo is the capital of Japan. 
                    Sources: [Tokyo - Wikipedia](https://en.wikipedia.org/wiki/Tokyo)
                    `.replaceAll('                    ', '').trim())
                ],
                getPromptMessage: (userInput) =>
                    Mustache.render(`Search with sources:\n{{{userInput}}}`,{userInput}),
                group: 'web'
            },
            {
                name: `{{{userInput}}} using WebBrowser`,
                tools,
                isVisibleInCommandPrompt: PromptVisibility.NoInput,
                getPromptMessage: (userInput) =>
                    Mustache.render(`{{{userInput}}}`,{userInput}),
                group: 'web'
            }
        ]
    }
}
