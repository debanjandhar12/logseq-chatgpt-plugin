import {Prompt} from "../types/Prompt";

export class Summarize {
    public static getPrompts() : Prompt[] {
        return [
            {
                name: 'Summarize',
                required_input: 'block(s)',
                getPrompt: () => `Summarize:`,
                group: 'summarize'
            },
            {
                name: 'Summarize in three lines',
                required_input: 'block(s)',
                getPrompt: () => `Summarize in three lines:`,
                group: 'summarize'
            }
        ]
    }
}
