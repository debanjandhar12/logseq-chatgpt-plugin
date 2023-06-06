import {HumanChatMessage} from "langchain/schema";

export class UserChatMessage extends HumanChatMessage {
    constructor(text) {
        super(text);
        this.name = "user";
    }
}
