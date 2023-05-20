import {Prompt, PromptVisibility} from "../types/Prompt";
import {MathSolver} from "../langchain/tools/MathSolver";
import Mustache from "mustache";
import {UserChatMessage} from "../langchain/schema/UserChatMessage";

export class Math {
    public static getPrompts() : Prompt[] {
        return [
            {
                name: `Solve {{{userInput}}} with steps using MathSolver`,
                tools: [new MathSolver()],
                isVisibleInCommandPrompt: PromptVisibility.NoInput,
                getPromptPrefixMessages: () => [
                    new UserChatMessage(`
                     I will provide some mathematical equations or concepts, and it will be your job to explain them in easy-to-understand terms. Please use the MathSolver tool whenever possible. Please remember to **show the steps**. You can use latex by wrapping expression in $ symbol. Sample of the conversation is shown below:
                     user: Solve: x^2 - 25 = 0
                     you: Adding 25 to both sides, we get:
                        $x^2 = 25$
                        Taking square root on both sides, we get:
                        $x = 5 or x = -5$
                    `.replaceAll('                    ', '').trim())
                    ],
                    getPromptMessage: (userInput) =>
                Mustache.render(`Solve with steps:\n{{{userInput}}}`, {userInput}),
                group: 'math'
            }
        ]
    }
}
