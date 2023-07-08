import {BaseMessage} from "langchain/schema";
import {encodingForModel, TiktokenModel} from "js-tiktoken";
// This is a very basic implementation of https://github.com/openai/openai-cookbook/blob/main/examples/How_to_format_inputs_to_ChatGPT_models.ipynb
// Heck, it's not even a proper implementation, it's just a hack to get it working for now.
// It's written with assumption that langchain.js will be used for this when it's ready.
export default async function getMessageArrayTokenCount(messages: BaseMessage[]): Promise<number> {
    let count = 0;
    const tokens_per_message = 4;
    for (const message of messages) {
        count += await getMessageTokenCount(message.content, logseq.settings.CHATGPT_MODEL);
        count += tokens_per_message;
    }
    count += tokens_per_message; // for reply
    return count;
}
const encodingCache = {};
export async function getMessageTokenCount(message: string, modelName: string): Promise<number> {
    let numTokens = Math.ceil(prompt.length / 4);
    if (encodingCache[modelName] == undefined) {
        encodingCache[modelName] = await encodingForModel(<TiktokenModel>modelName);
    }
    try {
        numTokens = encodingCache[modelName].encode(message).length;
    } catch (error) {
        console.warn(
            "Failed to calculate number of tokens, falling back to approximate count"
        );
    }
    return numTokens;
}