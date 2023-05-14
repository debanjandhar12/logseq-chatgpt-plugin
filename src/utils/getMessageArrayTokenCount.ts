import {encode} from 'gpt-3-encoder';
import {BaseChatMessage} from "langchain/schema";
// This is a very basic implementation of https://github.com/openai/openai-cookbook/blob/main/examples/How_to_format_inputs_to_ChatGPT_models.ipynb
// Heck, it's not even a proper implementation, it's just a hack to get it working for now.
// It's written with assumption that langchain.js will be used for this when it's ready.
export default function getMessageArrayTokenCount(messages: BaseChatMessage[]): number {
    let count = 0;
    const tokens_per_message = 4;
    for (const message of messages) {
        count += encode(message.text).length;
        count += tokens_per_message;
    }
    count += tokens_per_message; // for reply
    return count;
}
