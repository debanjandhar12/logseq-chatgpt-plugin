import { HumanMessage } from "langchain/schema";

export class UserMessage extends HumanMessage {
    constructor(text) {
        super(text);
    }
}
