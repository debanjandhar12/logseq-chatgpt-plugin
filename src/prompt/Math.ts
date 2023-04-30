import {Prompt} from "../types/Prompt";
import {MathSolver} from "../langchain/tools/MathSolver";
export class Math {
    public static getPrompts() : Prompt[] {
        return [
            {
                name: `Solve using Math Solver`,
                tools: [new MathSolver()],
                required_input: 'block(s)',
                getPrompt: () => `Solve:`,
                group: 'math'
            },
            {
                name: `{input} using Math Solver`,
                tools: [new MathSolver()],
                required_input: 'none',
                getPrompt: (input) => `${input}`,
                group: 'math'
            }
        ]
    }
}
