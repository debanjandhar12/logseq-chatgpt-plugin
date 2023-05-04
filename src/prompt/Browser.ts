import {Prompt} from "../types/Prompt";
import {SearchEngineTool} from "../langchain/tools/SearchEngine";
import {WebBrowser} from "langchain/dist/tools/webbrowser";
import {ChatOpenAI} from "langchain/chat_models/openai";
import {TensorFlowEmbeddings} from "langchain/dist/embeddings/tensorflow";
import "@tensorflow/tfjs-backend-cpu";

export class Browser {
    public static getPrompts() : Prompt[] {
        const model = new ChatOpenAI({ openAIApiKey: logseq.settings.OPENAI_API_KEY, temperature: 0, timeout: 0 },
            { basePath: logseq.settings.CHATGPT_API_ENDPOINT.replace(/\/chat\/completions\/?$/gi, '').trim() || "https://api.openai.com/v1" });
        const embeddings = new TensorFlowEmbeddings();
        return [
            {
                name: `Find using Browser`,
                tools: [new SearchEngineTool(), new WebBrowser({ model, embeddings })],
                required_input: 'block(s)',
                getPrompt: () => `Find:`,
                group: 'web'
            },
            {
                name: `{input} using Browser`,
                tools: [new SearchEngineTool(), new WebBrowser({ model, embeddings })],
                required_input: 'none',
                getPrompt: (input) => `${input}`,
                group: 'web'
            }
        ]
    }
}
