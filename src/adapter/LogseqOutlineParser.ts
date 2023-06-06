import {Mldoc} from 'mldoc';
import {ChatgptToLogseqSanitizer} from "./ChatgptToLogseqSanitizer";

/**
 * This parses markdown and turn them into JSON array representing outline data (if possible)
 * for passing to logseq.Editor.insert_batch_block.
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

export class LogseqOutlineParser {
    public static parse(text: string): any {
        text = ChatgptToLogseqSanitizer.sanitize(text);

        // First, we parse and check if the content contains only a single list
        let parsedJson = Mldoc.parseJson(text,
            JSON.stringify(MLDOCS_OPTIONS),
            JSON.stringify({})
        );
        try {
            parsedJson = JSON.parse(parsedJson);
        } catch {
            parsedJson = [];
        }
        if(parsedJson[0] && parsedJson.length == 1) {
            let node = parsedJson[0];
            let type = node[0][0];
            if (type != 'List') return false;
        }
        else return false;

        // Add page breaks
        text = text.replace(/(\s*?\*)/g, '\n----\n$1');

        // Parse again
        parsedJson = Mldoc.parseJson(text,
            JSON.stringify(MLDOCS_OPTIONS),
            JSON.stringify({})
        );
        try {
            parsedJson = JSON.parse(parsedJson);
        } catch {
            parsedJson = [];
        }

        let textUTF8 = new TextEncoder().encode(text);
        let list = [];
        for (let i = parsedJson.length - 1; i >= 0; i--) {
            let node = parsedJson[i];
            if (node[node.length - 1]["start_pos"] == null) continue;
            if (node[0][0] == null) continue;
            let {type, start_pos, end_pos} = LogseqOutlineParser.parseNode(node);
            if (type != 'List') continue;
            let {indent, ordered} = LogseqOutlineParser.parseListNode(node);
            let nodeText = new TextDecoder().decode(textUTF8.slice(start_pos, end_pos));
            let content = nodeText;
            content = content.substring(content.indexOf('*') + 1).trim();
            content = content.replace(/^ +/gm, '')
            content = content.replace(/^(\s| )+/gm, ''); // Needed for parsing Task prompt properly
            content = content.replace(/\n----\n(\s*?\*)/g, '$1');
            list.unshift({content, indent, ordered});
        }

        let parentPath = [];
        let result = [];
        for(let item of list) {
            while(parentPath.length > 0 && parentPath[parentPath.length-1].indent >= item.indent) {
                parentPath.pop();
            }
            let parent = parentPath.length > 0 ? parentPath[parentPath.length-1].children : result;
            let obj = {content: item.content, indent: item.indent, children: []};
            parent.push(obj);
            parentPath.push(obj);
        }

        return result;
    }

    /*** -- Utils -- ***/
    private static parseNode(node) {
        let type = node[0][0];
        let start_pos = node[node.length - 1]["start_pos"];
        let end_pos = node[node.length - 1]["end_pos"];
        return {type, start_pos, end_pos};
    }
    private static parseListNode(node) {
        let listContent = node[0][1];
        let indent = listContent[0].indent;
        let ordered = listContent[0].ordered;
        return {indent, ordered};
    }
}
