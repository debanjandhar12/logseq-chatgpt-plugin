import {AIChatMessage, HumanChatMessage} from "langchain/schema";

export class AssistantChatMessage extends AIChatMessage {
    constructor(text) {
        super(text);
        this.name = "assistant";
    }
}
