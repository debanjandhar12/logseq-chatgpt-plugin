import {Tool} from "langchain/tools";
import google from 'googlethis';
import _ from "lodash";
import {cleanObj} from "../../utils/cleanObj";

export class SearchEngineTool extends Tool {
    signal : AbortSignal;

    async _call(input: string) {
        const options : any = {
            page: 0,
            safe: false,
            parse_ads: false,
            use_mobile_ua: false,
            additional_params: {
                hl: 'en'
            },
            axios_config: {
                signal: this.signal
            }
        }
        let response : any = await google.search(input, options);

        // Clean the response for ChatGPT
        response = _.omit(response, 'people_also_ask');
        response.results = response.results || [];
        response.results = _.map(response.results, (result) => {
            if (result.favicons)    // Remove favicons
                delete result.favicons;
            if (result.url) // Remove url params from url
                result.url = result.url.split("?")[0];
            return result;
        });
        response = cleanObj(response);
        return JSON.stringify(response);
    }

    name = "search";

    description =
        "a search engine. useful for when you need to answer questions about current events. input should be a search query.";
}
