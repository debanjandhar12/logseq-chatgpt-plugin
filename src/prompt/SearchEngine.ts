import {Prompt} from "../types/Prompt";
import {SearchEngineTool} from "../langchain/tools/SearchEngine";
import {MathSolver} from "../langchain/tools/MathSolver";
export class SearchEngine {
    public static getPrompts() : Prompt[] {
        return [
            {
                name: `Find using Search Engine`,
                tools: [new SearchEngineTool()],
                required_input: 'block(s)',
                getPrompt: () => `Find:`,
                group: 'web'
            },
            {
                name: `{input} using Search Engine`,
                tools: [new SearchEngineTool()],
                required_input: 'none',
                getPrompt: (input) => `${input}`,
                group: 'web'
            }
        ]
    }
}
