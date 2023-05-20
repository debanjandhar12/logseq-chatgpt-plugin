import {Tool} from "langchain/dist/tools/base";
import _ from "lodash";
import {cleanObj} from "../../utils/cleanObj";

export class MathSolver extends Tool {
    signal : AbortSignal;

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
        const { baseURI, endpoint, headers } = JSON.parse(atob(
            "eyJiYXNlVVJJIjoiaHR0cHM6Ly9tYXRoc29sdmVyLm1pY3Jvc29mdC5jb20vIiwiZW5kcG9pbnQiOiJjYW1lcmFleHAvYXBpL3YxL3NvbHZlbGF0ZXgiLCJoZWFkZXJzIjp7ImF1dGhvcml0eSI6Im1hdGhzb2x2ZXIubWljcm9zb2Z0LmNvbSIsImFjY2VwdCI6ImFwcGxpY2F0aW9uL2pzb24iLCJhY2NlcHQtbGFuZ3VhZ2UiOiJ2aSxlbjtxPTAuOSxlbi1VUztxPTAuOCIsImNvbnRlbnQtdHlwZSI6ImFwcGxpY2F0aW9uL2pzb24iLCJvcmlnaW4iOiJodHRwczovL21hdGhzb2x2ZXIubWljcm9zb2Z0LmNvbSIsInJlZmVyZXIiOiJodHRwczovL21hdGhzb2x2ZXIubWljcm9zb2Z0LmNvbS92aS9zb2x2ZS1wcm9ibGVtLzEwNTQ2JTJCMjAlMkIzMCIsInNlYy1jaC11YSI6IlwiQ2hyb21pdW1cIjt2PVwiMTA2XCIsIFwiTWljcm9zb2Z0IEVkZ2VcIjt2PVwiMTA2XCIsIFwiTm90O0E9QnJhbmRcIjt2PVwiOTlcIiIsInNlYy1jaC11YS1tb2JpbGUiOiI/MCIsInNlYy1jaC11YS1wbGF0Zm9ybSI6IlwiV2luZG93c1wiIiwic2VjLWZldGNoLWRlc3QiOiJlbXB0eSIsInNlYy1mZXRjaC1tb2RlIjoiY29ycyIsInNlYy1mZXRjaC1zaXRlIjoic2FtZS1vcmlnaW4iLCJ1c2VyLWFnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEwNi4wLjAuMCBTYWZhcmkvNTM3LjM2IEVkZy8xMDYuMC4xMzcwLjUyIn19"
        )); // btoa(JSON.stringify({}))
        let response : any = await fetch(`${baseURI}${endpoint}`, {
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
            signal: this.signal,
            headers
        });
        response = await response.json();

        // Clean the response for ChatGPT
        response = _.get(response, 'results[0].tags[0].actions[0].customData', {result: "Failed to solve."});
        response = JSON.parse(response || {result: "Failed to solve."});
        response = _.get(response, 'previewText', {result: "Failed to solve."});
        response = JSON.parse(response || {result: "Failed to solve."});
        response = _.get(response, 'mathSolverResult', {result: "Failed to solve."});
        response = _.omit(response, 'allGraphData');
        if(response.actions && Array.isArray(response.actions)) {
            response.actions = response.actions[0];
            if (response.actions && response.actions.templateSteps && Array.isArray(response.actions.templateSteps)) {
                response.actions.templateSteps = response.actions.templateSteps[0];
            }
        }
        response = cleanObj(response);
        console.log(response);
        return JSON.stringify(response);
    }

    name = "math_solver";

    description =
        "A wrapper around step by step math solver api. Input should be a valid latex expression such as 'x + y = 10' or '\int_0^1 2x'. DO not include other text inside the expression.";
}
