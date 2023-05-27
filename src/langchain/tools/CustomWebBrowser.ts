import {Tool} from "langchain/tools";
import {MemoryVectorStore} from "langchain/vectorstores/memory";
import {OpenAIEmbeddings} from "langchain/embeddings/openai";
import {getText, parseInputs} from "langchain/tools/webbrowser";
import {RecursiveCharacterTextSplitter} from "langchain/text_splitter";
import { Document } from "langchain/docstore";
import {isProbablyReaderable, Readability} from "@mozilla/readability";
import {CallbackManagerForToolRun} from "langchain/callbacks";
import {ChatOpenAI} from "langchain/chat_models/openai";

export class CustomWebBrowser extends Tool {
    signal: AbortSignal;
    async getHtml(url: string) {
        const DEFAULT_HEADERS = {
            Accept:
                "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Encoding": "gzip, deflate",
            "Accept-Language": "en-US,en;q=0.5",
            "Alt-Used": "LEAVE-THIS-KEY-SET-BY-TOOL",
            Connection: "keep-alive",
            Host: "LEAVE-THIS-KEY-SET-BY-TOOL",
            Referer: "https://www.google.com/",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "cross-site",
            "Upgrade-Insecure-Requests": "1",
            "User-Agent":
                "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/111.0",
        };
        const headers = {
            ...DEFAULT_HEADERS,
            Host: new URL(url).host,
        }
        const response = await fetch(url, {
            headers,
            signal: this.signal,
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}`);
        }
        return await response.text();
    }
    async _call(inputs: string, runManager?: CallbackManagerForToolRun) {
        const [baseUrl, task] = parseInputs(inputs);
        let text, title, excerpt;
        try {
            const html = await this.getHtml(baseUrl);
            title = html.match(/<title[^>]*>([^<]+)<\/title>/)[1];
            text = getText(html, baseUrl, false);
            try {
                const htmlDoc = new DOMParser().parseFromString(html, "text/html");
                if (isProbablyReaderable(htmlDoc, {minScore: 2})) {
                    const readability = new Readability(htmlDoc).parse();
                    excerpt = readability.excerpt;
                    text = getText(readability.content, baseUrl, false);
                    title = readability.title;
                    console.log("Used readability");
                }
                else console.log("Did not use readability");
            } catch (e) { }
        } catch (e) {
            if (e) {
                return e.toString();
            }
            return "There was a problem connecting to the site";
        }
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1400,
            chunkOverlap: 200,
        });
        const texts = await textSplitter.splitText(text);
        const docs = texts.map(
            (pageContent, i) =>
                new Document({pageContent, metadata: [{i: i+10}]}) );
        docs.push(new Document({pageContent: `Title: ${title}\n${excerpt && excerpt.trim() != ''? `Excerpt: ${excerpt}` : ''}`, metadata: [{i: 0}]}));

        const embeddings = new OpenAIEmbeddings({openAIApiKey: logseq.settings.OPENAI_API_KEY},
            { basePath: logseq.settings.CHATGPT_API_ENDPOINT.replace(/\/chat\/completions\/?$/gi, '').trim() || "https://api.openai.com/v1" });

        const vectorStore = await MemoryVectorStore.fromDocuments(
            docs, embeddings);

        const results = await vectorStore.similaritySearch(task, 3);
        results.sort((a, b) => a.metadata[0].i - b.metadata[0].i);
        const input = `Text:${results.map((res) => res.pageContent).join("\n\n\n")}\n\n_______\nI need ${task} from the above text, also provide up to 5 markdown links from within that would be of interest (always including URL and text). Links should be provided, if present, in markdown syntax as a list under the heading "Relevant Links:".`;
        const model = new ChatOpenAI({openAIApiKey: logseq.settings.OPENAI_API_KEY},
            { basePath: logseq.settings.CHATGPT_API_ENDPOINT.replace(/\/chat\/completions\/?$/gi, '').trim() || "https://api.openai.com/v1" });
        return model.predict(input, undefined, runManager?.getChild());
    }
    name = "web-browser";
    description = `useful for when you need to find something on or summarize a webpage. input should be a comma separated list of "ONE valid http URL including protocol","what you want to find on the page".`;
}