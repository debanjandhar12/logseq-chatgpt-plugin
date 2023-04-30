import {Tool} from "langchain/dist/tools/base";
import _ from "lodash";
import {cleanObj} from "../../utils/cleanObj";

export class MathSolver extends Tool {

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
        // Code taken from https://github.com/hexzzz2008/FastSolver/blob/main/MathSolver.js
        // The library is not used directly as it is not compatible with browser.
        let response : any = await fetch(`https://mathsolver.microsoft.com/cameraexp/api/v1/solvelatex`, {
            method: 'POST',
            body: JSON.stringify({
                'clientInfo': {
                    'platform': 'web',
                    'mkt': 'en',
                    'skipGraphOutput': true,
                    'skipBingVideoEntity': true
                },
                'latexExpression': input,
                'customLatex': input,
                'showCustomResult': false
            }),
            headers: {
                'authority': 'mathsolver.microsoft.com',
                'accept': 'application/json',
                'accept-language': 'vi,en;q=0.9,en-US;q=0.8',
                'content-type': 'application/json',
                'origin': 'https://mathsolver.microsoft.com',
                'referer': 'https://mathsolver.microsoft.com/vi/solve-problem/10546%2B20%2B30',
                'sec-ch-ua': '"Chromium";v="106", "Microsoft Edge";v="106", "Not;A=Brand";v="99"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36 Edg/106.0.1370.52'
            }
        });
        response = await response.json();

        // Clean the response for ChatGPT
        response = _.get(response, 'results[0].tags[0].actions[0].customData', {result: "Failed to solve."});
        response = JSON.parse(response || {result: "Failed to solve."});
        response = _.get(response, 'previewText', {result: "Failed to solve."});
        response = JSON.parse(response || {result: "Failed to solve."});
        response = _.get(response, 'mathSolverResult', {result: "Failed to solve."});
        response = _.omit(response, 'allGraphData');
        response = cleanObj(response);
        console.log(response);
        return JSON.stringify(response);
    }

    name = "math_solver";

    description =
        "A wrapper around step by step math solver api. Input should be a valid latex expression such as 'x + y = 10' or '\int_0^1 2x'. DO not include other text inside the expression.";
}
