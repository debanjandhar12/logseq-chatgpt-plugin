import {AIMessage} from "langchain/schema";

export class AssistantMessage extends AIMessage {
    constructor(text) {
        super(text);
    }
}
