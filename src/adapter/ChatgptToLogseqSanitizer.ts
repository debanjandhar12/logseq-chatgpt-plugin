import {Mldoc} from 'mldoc';
import showdown from 'showdown';

/**
 * Logseq doesn't support unordered lists using "-" and headings using "#" (after first line).
 * Hence, this sanitizes text from ChatGPT to be compatible with Logseq.
 */
const MLDOCS_OPTIONS = {
    "heading_number": false,
    "heading_to_list": false,
    "toc": false,
    "keep_line_break": true,
    "format": "Markdown",
    "exporting_keep_properties": false,
    "inline_type_with_pos": true,
    "parse_outline_only": false
};

export class ChatgptToLogseqSanitizer {
    public static sanitize(text: string): string {
        let parsedJson = Mldoc.parseInlineJson(text,
            JSON.stringify(MLDOCS_OPTIONS),
            JSON.stringify({})
        );
        try {
            parsedJson = JSON.parse(parsedJson);
        } catch {
            parsedJson = [];
        }

        let textUTF8 = new TextEncoder().encode(text);
        for (let i = parsedJson.length - 1; i >= 0; i--) {
            let node = parsedJson[i];
            if (node[node.length - 1]["start_pos"] == null) continue;
            if (node[0][0] == null) continue;

            let {type} = ChatgptToLogseqSanitizer.parseNode(node);

            switch (type) {
                case "Plain":
                    textUTF8 = ChatgptToLogseqSanitizer.sanitizePlain(node, textUTF8);
                    break;
            }
        }
        //console.log(text, parsedJson, new TextDecoder().decode(textUTF8));
        return new TextDecoder().decode(textUTF8);
    }

    /**
     * Sanitize plain text - currently does the following:
     * 1) converts lists using "-" to "*" lists
     * 2) converts headings to html
     */
    private static sanitizePlain(node, resultUTF8) {
        let {start_pos, end_pos} = ChatgptToLogseqSanitizer.parseNode(node);
        let nodeText = new TextDecoder().decode(resultUTF8.slice(start_pos, end_pos));
        nodeText = nodeText.replace(/^(\s*)-(\s*)/gm, "$1*$2"); // convert lists using "-" to "*" lists
        nodeText = nodeText.replace(/^(\s*)#(\s*)(.*)/gm, (match) => { // convert headings to html
            return new showdown.Converter({noHeaderId: true}).makeHtml(match);
        });
        return new Uint8Array([...resultUTF8.subarray(0, start_pos), ...new TextEncoder().encode(nodeText), ...resultUTF8.subarray(end_pos)]);
    }

    /*** -- Utils -- ***/
    private static parseNode(node) {
        let type = node[0][0];
        let start_pos = node[node.length - 1]["start_pos"];
        let end_pos = node[node.length - 1]["end_pos"];
        return {type, start_pos, end_pos};
    }
}
