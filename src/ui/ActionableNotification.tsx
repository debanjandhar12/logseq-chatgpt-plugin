import {waitForElement} from "../utils/waitForElement";

export async function ActionableNotification(msg: string, buttons : {label: string, labelSuffix?: string, onClick: Function}[], checkbox : {label: string, checked: boolean, onChange: Function} = null) {
    const fakeNotification = await logseq.UI.showMsg("", 'success', {
        key: `ActionableNotification-${logseq.baseInfo.id}`,
        timeout: 0
    });
    await new Promise(resolve => setTimeout(resolve, 100)); // Sleep 100ms to wait for the fake notification to be rendered
    const div =  `
    <div class="max-w-sm w-full shadow-lg rounded-lg pointer-events-auto notification-area transition ease-out duration-300 transform translate-y-0 opacity-100 sm:translate-x-0" style="min-width: 408px">
        <div class="rounded-lg shadow-xs" style="max-height: calc(100vh - 200px); overflow: hidden auto;">
            <div class="p-4 py-2">
                    <div class="flex">
                        <div class="ml-3 w-0 flex-1"><div class="text-sm leading-6 font-medium whitespace-pre-line" style="margin: 0px;">${msg}</div></div>
                        <div class="ml-4 flex-shrink-0 flex"><button aria-label="Close" class="inline-flex text-gray-400 focus:outline-none focus:text-gray-500 transition ease-in-out duration-150 notification-close-button" onclick="ChatGPT.ActionableNotification.close();"><span class="ui__icon ti ls-icon-x "><svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-x" width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="currentColor" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></span></button></div>
                    </div>
                    ${ checkbox ? `<input type="checkbox" class="form-checkbox h-4 w-4 transition duration-150 ease-in-out" onchange="window.parent.ChatGPT.ActionableNotification.${checkbox.label.replaceAll(' ','')}(this.checked);" ${checkbox.checked ? "checked" : ""}><span class="ml-2 text-sm leading-5">${checkbox.label}</span>` : "" }
                    ${buttons.map((button, index) => `<button type="button" class="ui__button bg-indigo-600 hover:bg-indigo-700 focus:border-indigo-700 active:bg-indigo-700 text-center text-sm p-1 ml-2" style="float:right;" onclick="window.parent.ChatGPT.ActionableNotification.close();window.parent.ChatGPT.ActionableNotification.${button.label.replaceAll(' ','')}();">${button.label}${button.labelSuffix?" "+button.labelSuffix:""}</button>`).join('')}
            </div>
        </div>
    </div>`;
    await waitForElement('.notifications > .ui__notifications-content', 2000, window.parent.document.querySelector('.notifications'));
    console.log("Waited");
    const fakeNotificationDiv = window.parent.document.querySelector(".notifications > .ui__notifications-content:last-child");
    fakeNotificationDiv.innerHTML = div;
    window.parent.ChatGPT.ActionableNotification = {
        close: () => {
            logseq.UI.closeMsg(`ActionableNotification-${logseq.baseInfo.id}`);
        },
        ...Object.fromEntries(buttons.map(button => [button.label.replaceAll(' ',''), button.onClick])),
        ...Object.fromEntries(checkbox ? [[checkbox.label.replaceAll(' ',''), checkbox.onChange]] : [])
    }
}
