export class Summarize {
    public static getPrompts() {
        return [
            {
                name: 'Summarize',
                getPrompt: () => `Summarize:`,
                group: 'summarize'
            },
            {
                name: 'Summarize in three lines',
                getPrompt: () => `Summarize in three lines:`,
                group: 'summarize'
            }
        ]
    }
}