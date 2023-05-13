import {Prompt, PromptVisibility} from "../types/Prompt";
import Mustache from "mustache";

export class Translate {
    public static getPrompts() : Prompt[] {
        const languages = ['Albanian', 'Arabic', 'Armenian', 'Awadhi', 'Azerbaijani', 'Bashkir', 'Basque', 'Belarusian', 'Bengali', 'Bhojpuri', 'Bosnian', 'Brazilian Portuguese', 'Bulgarian', 'Cantonese (Yue)', 'Catalan', 'Chhattisgarhi', 'Chinese', 'Croatian', 'Czech', 'Danish', 'Dogri', 'Dutch', 'English', 'Estonian', 'Faroese', 'Finnish', 'French', 'Galician', 'Georgian', 'German', 'Greek', 'Gujarati', 'Haryanvi', 'Hindi', 'Hungarian', 'Indonesian', 'Irish', 'Italian', 'Japanese', 'Javanese', 'Kannada', 'Kashmiri', 'Kazakh', 'Konkani', 'Korean', 'Kyrgyz', 'Latvian', 'Lithuanian', 'Macedonian', 'Maithili', 'Malay', 'Maltese', 'Mandarin', 'Mandarin Chinese', 'Marathi', 'Marwari', 'Min Nan', 'Moldovan', 'Mongolian', 'Montenegrin', 'Nepali', 'Norwegian', 'Oriya', 'Pashto', 'Persian (Farsi)', 'Polish', 'Portuguese', 'Punjabi', 'Rajasthani', 'Romanian', 'Russian', 'Sanskrit', 'Santali', 'Serbian', 'Sindhi', 'Sinhala', 'Slovak', 'Slovene', 'Slovenian', 'Ukrainian', 'Urdu', 'Uzbek', 'Vietnamese'];
        return languages.map((lang) => ({
            name: `Translate to ${lang}`,
            isVisibleInCommandPrompt: PromptVisibility.Blocks,
            getPromptMessage: (userInput, invokeState) =>
                Mustache.render(`Translate to {{lang}}::{{selectedBlocksList}}`,{lang,
                    selectedBlocksList: invokeState.selectedBlocks.map(b => `{{embed ((${b.uuid}))}}`).join('\n')}),
            group: 'translate'
        }));
    }
}
