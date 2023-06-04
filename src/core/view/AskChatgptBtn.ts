/**
 * This controller is responsible for adding the "Ask ChatGPT" button to the page head.
 */
import {
    CHATGPT_ASK_BUTTON_CONTENT,
    CHATGPT_ASKING_BUTTON_CONTENT,
    CHATGPT_CANCEL_BUTTON_CONTENT
} from "../../utils/constants";
import {LogseqProxy} from "../../logseq/LogseqProxy";
import {askChatGPT} from "../service/askChatgpt";
import {recreateNode} from "../../utils/recreateNode";
import {waitForElement} from "../../utils/waitForElement";

export class AskChatgptBtn {
    static inAskingInProgress = false;
    static abortController : AbortController;

    static init() {
        // --- Button UI ---
        logseq.App.registerUIItem('toolbar', {
            key: `logseq-chatgpt${logseq.baseInfo.id == "logseq-chatgpt" ? "" : "-" + logseq.baseInfo.id}`,
            template: String.raw`
              <a class="logseq-chatgpt-callAPI-${logseq.baseInfo.id} flex px-1" 
              style="justify-content: center;
                align-content: center;
                padding-top: 8px;
                font-size: 16px;
                margin-right: 1px;
                padding-bottom: 8px;
                margin-left: 1px;
                width: 132px;
                align-items: center;
                color: var(--ls-header-button-background, #d8e1e8);
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
            await waitForElement(`.logseq-chatgpt-callAPI-${logseq.baseInfo.id}`, 500, window.parent.document.querySelector('#head'));
            recreateNode(window.parent.document.querySelector(`.logseq-chatgpt-callAPI-${logseq.baseInfo.id}`));
            await waitForElement(`.logseq-chatgpt-callAPI-${logseq.baseInfo.id}`, 500, window.parent.document.querySelector('#head'));

            const button: HTMLButtonElement = window.parent.document.querySelector(`.logseq-chatgpt-callAPI-${logseq.baseInfo.id}`) || window.parent.document.createElement("button");

            // Show button if current page is a ChatGPT page only
            const page = await logseq.Editor.getCurrentPage();
            if (page == null || !(page.originalName && (page.properties?.type == "ChatGPT" || page.properties?.type == "[[ChatGPT]]"))) {
                button.style.display = "none";
                return;
            }
            button.style.display = "flex";
            button.innerHTML = CHATGPT_ASK_BUTTON_CONTENT;

            // Check if the button is mounted
            if (!button.classList.contains(`logseq-chatgpt-callAPI-${logseq.baseInfo.id}`))
                await logseq.UI.showMsg("The Ask ChatGPT button failed to mount.\nYou can still use the Ask ChatGPT command / shortcut to interact with the page.", "warning", {timeout: 3200});

            // Add click event listener to button
            button.addEventListener("click", () => {
                if (!this.inAskingInProgress)
                    AskChatgptBtn.askChatGPTWrapper();
                else
                    this.abortController.abort();
            }, {capture: true});

            // Change color to blue on hover
            button.addEventListener("mousemove", () => {
                button.style.backgroundColor = "rgba(59,130,246, 1)"
                if (!this.inAskingInProgress) return;
                if (button.matches(":hover"))
                    button.innerHTML = CHATGPT_CANCEL_BUTTON_CONTENT;
                else
                    button.innerHTML = CHATGPT_ASKING_BUTTON_CONTENT;
            });
            button.addEventListener("mouseleave", () => {
                button.style.backgroundColor = "rgba(59,130,246, .7)"
                if (!this.inAskingInProgress) return;
                if (button.matches(":hover"))
                    button.innerHTML = CHATGPT_CANCEL_BUTTON_CONTENT;
                else
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
        const button: HTMLButtonElement = window.parent.document.querySelector(`.logseq-chatgpt-callAPI-${logseq.baseInfo.id}`) || window.parent.document.createElement("button");
        if (!button.classList.contains(`logseq-chatgpt-callAPI-${logseq.baseInfo.id}`))
            await logseq.UI.showMsg("ChatGPT is Thinking...");
        if (button.matches(":hover"))
            button.innerHTML = CHATGPT_CANCEL_BUTTON_CONTENT;
        else button.innerHTML = CHATGPT_ASKING_BUTTON_CONTENT;
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
            if (e.blockUUID) {
                const page = await logseq.Editor.getCurrentPage();
                await logseq.Editor.selectBlock(e.blocsignalkUUID);
            }
            let errorMsg = e.message || e.toString();
            errorMsg = errorMsg.trim();
            if (errorMsg.startsWith("Request failed with status code")) {
                // Error msg contains:
                // Request failed with status code 401 and body {"error":{"message":"Incorrect API key provided. You can find your API key at https://platform.openai.com/account/api-keys.","type":"invalid_request_error","param":null,"code":"invalid_api_key"}}
                // We parse the error message to get the actual error message
                errorMsg = errorMsg.substring(errorMsg.indexOf("{"));
                errorMsg = errorMsg.substring(0, errorMsg.lastIndexOf("}") + 1);
                errorMsg = JSON.parse(errorMsg);
                errorMsg = errorMsg.error.message || errorMsg.error.code;
            }
            if (errorMsg.startsWith("Cancel: cancel")) return; // Ignore abort error
            if (errorMsg.startsWith("[] is too short - 'messages'") && logseq.settings.CHATGPT_MAX_TOKENS < 3072)    // Handle empty prompt error due to trimming
                errorMsg = "Failed to call ChatGPT due to context limit. Please consider increasing the MAX_TOKENS limit to at least 3072 in settings.";
            else if (errorMsg.startsWith("[] is too short - 'messages'"))
                errorMsg = "Failed to call ChatGPT due to context limit.";
            await logseq.UI.showMsg("Error: " + errorMsg, e.type || "error", {timeout: 5000});
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
