export class Fix {
    public static getPrompts() {
        return [
            {
                name: 'Fix Grammar',
                getPrompt: () => `Fix Grammar:`,
                group: 'fix'
            },
            {
                name: 'Fix Spelling',
                getPrompt: () => `Fix Spelling:`,
                group: 'fix'
            }
        ]
    }
}