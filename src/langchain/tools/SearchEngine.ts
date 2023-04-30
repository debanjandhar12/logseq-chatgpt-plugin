import {Tool} from "langchain/dist/tools/base";
import google from 'googlethis';
import _ from "lodash";
import {cleanObj} from "../../utils/cleanObj";

export class SearchEngineTool extends Tool {

    async _call(input: string) {
        const options = {
            page: 0,
            safe: false,
            parse_ads: false,
            use_mobile_ua: false,
            additional_params: {
                hl: 'en'
            }
        }
        let response : any = await google.search(input, options);

        // Clean the response for ChatGPT
        response = _.omit(response, 'people_also_ask');
        response = cleanObj(response);
        response.results = response.results || [];
        return JSON.stringify(response);
    }

    name = "search";

    description =
        "a search engine. useful for when you need to answer questions about current events. input should be a search query.";
}
