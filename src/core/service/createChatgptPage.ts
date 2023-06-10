import moment from "moment";
import _ from "lodash";
import {SelectCommandPrompt} from "../../ui/SelectCommandPrompt";
import {getAllPrompts} from "../../prompt/getAllPrompts";
import {AskChatgptBtn} from "../controller/AskChatgptBtn";
import Mustache from "mustache";

/**
 * Creates a ChatGPT page and opens it in logseq without prompting the user for a prompt.
 */
export async function createChatgptPage(pageName: string = "", additionalPageProps= {}, firstBlockContent = "") {
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
    blocks = _.filter(blocks, (b) => !(b.parent && blocks.find(b2 => b2.id == b.parent?.id)));
    let invokeState = {selectedBlocks: blocks};

    // - Ask user to select a prompt -
    const promptList = await getAllPrompts();
    const filteredPromptList = promptList.filter(p => {
            return p.isVisibleInCommandPrompt(invokeState);
        }
    );
    const selectedPromptWithModifiedName = await SelectCommandPrompt(filteredPromptList, "Select a prompt");
    if (!selectedPromptWithModifiedName) return;
    const selectedPrompt = filteredPromptList.find(p => new RegExp(_.escapeRegExp(p.name).replaceAll('\\{\\{\\{userInput\\}\\}\\}', '.*')).test(selectedPromptWithModifiedName.name));
    // - Construct additional page props and first block content -
    const additionalPageProps = {};
    // Collect chatgpt-prompt prop
    const input = selectedPromptWithModifiedName.name.match(new RegExp(selectedPrompt.name.replaceAll('{{{userInput}}}', '(.*)')))?.slice(1)[0];
    additionalPageProps['chatgpt-prompt'] = Mustache.render(selectedPrompt.name, {userInput: (input || '').split('\n')[0]})
    if (blocks && blocks.length > 0)
        additionalPageProps['chatgpt-prompt-source'] = blocks.map(b => `((${b.uuid}))`).join(' ');
    console.log(input, selectedPromptWithModifiedName.name, new RegExp(selectedPrompt.name.replaceAll('{{{userInput}}}', '(.*)')))
    // Handle create empty chatgpt page prompt
    if (selectedPrompt.name == "Create empty ChatGPT Page") {
        await createChatgptPage("", {}, "");
        return;
    }
    let firstBlockContent = selectedPromptWithModifiedName.getPromptMessage(input, invokeState) || "";
    await createChatgptPage("", additionalPageProps, firstBlockContent);

    // Call the askChatGPTWrapper
    try {
        if (firstBlockContent && firstBlockContent != "")
            await AskChatgptBtn.askChatGPTWrapper();
    } catch (e) { console.log(e); }
}
