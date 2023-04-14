/**
 * This controller is responsible for adding the "Ask ChatGPT" button to the page head.
 */
import {
    CHATGPT_ASK_BUTTON_CONTENT,
    CHATGPT_ASKING_BUTTON_CONTENT,
    CHATGPT_STOP_BUTTON_CONTENT,
    ICON_16
} from "../utils/constants";
import {LogseqProxy} from "../logseq/LogseqProxy";
import {askChatGPT} from "./askChatgpt";
import {recreateNode} from "../utils/recreateNode";

export class AskChatgptBtnController {
    static inAskingInProgress = false;
    static abortController : AbortController;

    static init() {
        // --- Button UI ---
        logseq.App.registerUIItem('toolbar', {
            key: `logseq-chatgpt${logseq.baseInfo.id == "logseq-chatgpt" ? "" : "-" + logseq.baseInfo.id}`,
            template: String.raw`
              <a class="logseq-chatgpt-callAPI-${logseq.baseInfo.id} flex px-1" 
              style="justify-content: center;
                padding-top: 8px;
                font-size: 16px;
                margin-right: 1px;
                padding-bottom: 8px;
                margin-left: 1px;
                align-items: center;
                color: var(--ls-block-ref-link-text-color, #d8e1e8);
                border-radius: 0.375rem;
                transition: all 0s ease 0s;
                background-color: rgba(59, 130, 246, 0.7);
                z-index: var(--ls-z-index-level-1, 9) !important;
                display:none;">
                    ${CHATGPT_ASK_BUTTON_CONTENT}
              </a>
        `
        });
        LogseqProxy.App.registerRouteChangedListener(async (event) => {
            recreateNode(window.parent.document.querySelector(`.logseq-chatgpt-callAPI-${logseq.baseInfo.id}`), true);
            const button: HTMLButtonElement = window.parent.document.querySelector(`.logseq-chatgpt-callAPI-${logseq.baseInfo.id}`);

            // Show button if current page is a ChatGPT page only
            const page = await logseq.Editor.getCurrentPage();
            if (page == null || !(page.originalName && (page.properties?.type == "ChatGPT" || page.properties?.type == "[[ChatGPT]]"))) {
                button.style.display = "none";
                return;
            }
            button.style.display = "block";

            // Add click event listener to button
            button.addEventListener("click", async () => {
                if (!this.inAskingInProgress)
                    await AskChatgptBtnController.askChatGPTWrapper();
                else this.abortController.abort();
            });

            // Change color to blue on hover
            button.addEventListener("mouseenter", () => {
                button.style.backgroundColor = "rgba(59,130,246, 1)";
                if (this.inAskingInProgress)
                    button.innerHTML = CHATGPT_STOP_BUTTON_CONTENT;
            });
            button.addEventListener("mouseleave", () => {
                button.style.backgroundColor = "rgba(59,130,246, .7)";
                if (this.inAskingInProgress)
                    button.innerHTML = CHATGPT_ASKING_BUTTON_CONTENT;
            });
            button.style.backgroundColor = "rgba(59,130,246, .7)";

            // Fix opacity of injected button container
            const injectedUIItemContainer: HTMLDivElement = window.parent.document.querySelector(`.injected-ui-item-pagebar[title="logseq-chatgpt${logseq.baseInfo.id == "logseq-chatgpt" ? "" : "-" + logseq.baseInfo.id}"]`);
            if (injectedUIItemContainer)
                injectedUIItemContainer.style.opacity = "1";
        });

        // --- Misc Tasks ---
        LogseqProxy.App.registerRouteChangedListener(async (event) => {
            // - Cancel the previous ask chatgpt request through this controller (if any) on page change -
            if (this.abortController)
                this.abortController.abort();

            // - Remove actionable notification (if any) on page change -
            try { window.parent.ChatGPT.ActionableNotification.close() } catch(e) {};
        });
    }

    public static async askChatGPTWrapper() {
        if (this.inAskingInProgress) return;
        try { window.parent.ChatGPT.ActionableNotification.close() } catch(e) {} // Close previous actionable notification if any
        this.inAskingInProgress = true;
        this.abortController = new AbortController();
        const button: HTMLButtonElement = window.parent.document.querySelector(`.logseq-chatgpt-callAPI-${logseq.baseInfo.id}`);
        button.innerHTML = CHATGPT_ASKING_BUTTON_CONTENT;
        try {
            await logseq.provideStyle({ // Disable editor popups
                key: "hide-editor-popups",
                style: `
                .absolute-modal[data-modal-name=commands], .absolute-modal[data-modal-name=block-commands],
                .absolute-modal[data-modal-name=page-search], .absolute-modal[data-modal-name=block-search] {
                    display: none;
                }`
            });
            const currentPage = await logseq.Editor.getCurrentPage();
            await askChatGPT(currentPage.originalName,{signal: this.abortController.signal});
        } catch (e) {
            if (e.name == "AbortError") return; // Ignore abort error
            if (e.blockUUID) {
                const page = await logseq.Editor.getCurrentPage();
                await logseq.Editor.selectBlock(e.blocsignalkUUID);
            }
            let errorMsg = e.message || e.toString();
            errorMsg = errorMsg.replace(/^Request error: /, "");
            if (!errorMsg.includes("This readable stream reader has been released and cannot be used to read"))
                await logseq.UI.showMsg(errorMsg, e.type || "error", {timeout: 5000});
            if (e.blockUUID)
                await logseq.Editor.selectBlock(e.blockUUID);
            console.log(e);
        } finally {
            this.inAskingInProgress = false;
            this.abortController = null;
            button.innerHTML = CHATGPT_ASK_BUTTON_CONTENT;
            await logseq.provideStyle({  // Enable editor popups back
                key: "hide-editor-popups",
                style: `
                .absolute-modal[data-modal-name=commands], .absolute-modal[data-modal-name=block-commands],
                .absolute-modal[data-modal-name=page-search], .absolute-modal[data-modal-name=block-search] {
                    display: block;
                }`
            });
        }
    }
}
