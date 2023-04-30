import {Prompt} from "../types/Prompt";
import {SearchEngineTool} from "../langchain/tools/SearchEngine";
export class SearchEngine {
    public static getPrompts() : Prompt[] {
        return [
            {
                name: `Find using Search Engine`,
                tools: [new SearchEngineTool()],
                required_input: 'block(s)',
                getPrompt: () => `Find:`,
                group: 'web'
            }
        ]
    }
}
