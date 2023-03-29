import {Mldoc} from 'mldoc';
import showdown from 'showdown';
import '@logseq/libs';
import {removePropsFromBlockContent} from "../logseq/removePropsFromBlockContent";

/**
 * This parses Block References and Embeds before sending message to ChatGPT.
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

export class LogseqToChatgptConverter {
    public static async convert(text: string): Promise<string> {
        text = removePropsFromBlockContent(text);

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

            let {type} = LogseqToChatgptConverter.parseNode(node);

            switch (type) {
                case "Link":
                    textUTF8 = await LogseqToChatgptConverter.convertLink(node, textUTF8);
                    break;
                case "Macro":
                    textUTF8 = await LogseqToChatgptConverter.convertMacro(node, textUTF8);
                    break;
            }
        }
        // console.log(text, parsedJson, new TextDecoder().decode(textUTF8));
        return new TextDecoder().decode(textUTF8);
    }

    /**
     * Convert Block Refs into text
     */
    private static async convertLink(node, resultUTF8) {
        let {start_pos, end_pos} = LogseqToChatgptConverter.parseNode(node);
        let nodeText = new TextDecoder().decode(resultUTF8.slice(start_pos, end_pos));
        if(node[0][1]?.label.length == 0 && node[0][1]?.url[0] == "Block_ref") {
            const blockRefUUID = node[0][1]?.url[1];
            let blockContent = '';
            try {
                blockContent = (await logseq.Editor.getBlock(blockRefUUID)).content;
                const blockContentFirstLine = blockContent.replace(/^(\n|\s)*/, '').split("\n")[0];
                nodeText = await LogseqToChatgptConverter.convert(blockContentFirstLine);
            } catch (e) { console.log(e); nodeText = '';  }
        }
        return new Uint8Array([...resultUTF8.subarray(0, start_pos), ...new TextEncoder().encode(nodeText), ...resultUTF8.subarray(end_pos)]);
    }

    /**
     * Convert Block Embed into text
     */
    private static async convertMacro(node, resultUTF8) {
        let {start_pos, end_pos} = LogseqToChatgptConverter.parseNode(node);
        let nodeText = new TextDecoder().decode(resultUTF8.slice(start_pos, end_pos));
        if(node[0][1]?.name == "embed") {
            const blockRefUUID = node[0][1]?.arguments[0].substring(2, node[0][1]?.arguments[0].length-2);
            let blockContent = '';
            try {
                blockContent = (await logseq.Editor.getBlock(blockRefUUID)).content;
                nodeText = await LogseqToChatgptConverter.convert(blockContent);
                nodeText = nodeText.trim();
                nodeText = `------\n${nodeText}\n------\n`;
                let prevText = new TextDecoder().decode(resultUTF8.slice(start_pos-1, start_pos));
                if(prevText != "\n")
                    nodeText = "\n"+nodeText;
            } catch (e) { console.log(e); nodeText = ''; }
        }
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
