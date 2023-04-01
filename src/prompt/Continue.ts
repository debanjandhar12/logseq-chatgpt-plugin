import {Prompt} from "../types/Prompt";

export class Continue {
    public static getPrompts() : Prompt[] {
        return [
            {
                name: 'Continue',
                required_input: 'block(s)',
                getPrompt: () => `Continue:`,
                group: 'continue'
            }
        ]
    }
}
