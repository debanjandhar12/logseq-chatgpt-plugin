import {Prompt} from "../types/Prompt";
export class Custom {
    public static getPrompts() : Prompt[] {
        return [
            {
                name: `Custom: {input}`,
                required_input: 'block(s)',
                getPrompt: (input) => `${input}:`,
                group: 'custom'
            }
        ]
    }
}
