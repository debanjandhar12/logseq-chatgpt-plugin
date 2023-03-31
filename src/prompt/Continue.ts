export class Continue {
    public static getPrompts() {
        return [
            {
                name: 'Continue',
                getPrompt: () => `Continue:`,
                group: 'continue'
            }
        ]
    }
}