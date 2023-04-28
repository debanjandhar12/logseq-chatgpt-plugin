import moment from "moment";
import _ from "lodash";
import {SelectCommandPrompt} from "../../ui/SelectCommandPrompt";
import {getAllPrompts} from "../../prompt/getAllPrompts";
import {AskChatgptBtn} from "../view/AskChatgptBtn";

/**
 * Creates a ChatGPT page and opens it in logseq without prompting the user for a prompt.
 */
export async function createChatgptPageWithoutPrompt(pageName: string = "", additionalPageProps= {}, firstBlockContent = "") {
    pageName = pageName || "chatgpt__" + moment().format('YYYY-MM-DD HH:mm:ss');
    const pageProperties = {
        'type': 'ChatGPT',
        'chatgpt-flow': 'alternating',
        ...additionalPageProps
    }
    await logseq.Editor.createPage(pageName, pageProperties, {format: "markdown"});
    if (firstBlockContent != "")
        await logseq.Editor.insertBlock(pageName, `speaker:: [[user]]\n${firstBlockContent}`);
}

/**
 * Creates a ChatGPT page and opens it in logseq after prompting the user for a prompt. The AskChatgptBtn.ts is then executed.
 */
export async function createChatgptPageWithPrompt() {
    let blocks = await logseq.Editor.getSelectedBlocks();
    blocks = _.uniqBy(blocks, b => b.id);

    const selectedPrompt = await SelectCommandPrompt(await getAllPrompts(), "Select a prompt", true);
    if (!selectedPrompt) return;

    // Construct additional page props and first block content
    const additionalPageProps = {};
    additionalPageProps['chatgpt-prompt'] = selectedPrompt.name;
    if (selectedPrompt.required_input.includes("block"))
        additionalPageProps['chatgpt-prompt-source'] = "";
    let firstBlockContent = selectedPrompt.getPrompt() || "";
    for (const block of blocks) {
        if (block.parent && blocks.find(b => b.id == block.parent?.id)) continue;   // Skip child blocks

        firstBlockContent += `\n{{embed ((${block.uuid}))}}`;
        if (selectedPrompt.required_input.includes("block"))
            additionalPageProps['chatgpt-prompt-source'] += `((${block.uuid}))`;
    }
    await createChatgptPageWithoutPrompt("", additionalPageProps, firstBlockContent);

    // Call the askChatGPTWrapper
    try {
        await AskChatgptBtn.askChatGPTWrapper();
    } catch (e) { console.log(e); }
}
