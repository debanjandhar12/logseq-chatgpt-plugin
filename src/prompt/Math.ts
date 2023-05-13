import {Prompt, PromptVisibility} from "../types/Prompt";
import {MathSolver} from "../langchain/tools/MathSolver";
import Mustache from "mustache";
export class Math {
    public static getPrompts() : Prompt[] {
        return [
            {
                name: `Evaluate using Math Solver`,
                tools: [new MathSolver()],
                isVisibleInCommandPrompt: PromptVisibility.Blocks,
                getPromptMessage: (input, invokeState) =>
                    Mustache.render(`Solve:\n{{selectedBlocksList}}`,{
                        selectedBlocksList: invokeState.selectedBlocks.map(b => `{{embed ((${b.uuid}))}}`).join('\n')}),
                group: 'math'
            },
            {
                name: `{{userInput}} using Math Solver`,
                tools: [new MathSolver()],
                isVisibleInCommandPrompt: PromptVisibility.NoInput,
                getPromptMessage: (userInput) =>
                Mustache.render(`{{userInput}}`, {userInput}),
                group: 'math'
            }
        ]
    }
}
