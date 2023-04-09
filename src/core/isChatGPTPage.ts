import {PageEntity} from "@logseq/libs/dist/LSPlugin";

export function isChatGPTPage(page: PageEntity): boolean {
    return page && page.originalName && (page.properties?.type == "ChatGPT" || page.properties?.type == "[[ChatGPT]]");
}
