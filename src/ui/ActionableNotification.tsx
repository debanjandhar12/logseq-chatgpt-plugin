export async function ActionableNotification(msg: string, buttons : {label: string, onClick: Function}[]) {
    const fakeNotification = await logseq.UI.showMsg("", 'success', {
        key: `ActionableNotification-${logseq.baseInfo.id}`,
        timeout: 0
    });
    await new Promise(resolve => setTimeout(resolve, 100)); // Sleep 100ms to wait for the fake notification to be rendered
    const div =  `
    <div class="max-w-sm w-full shadow-lg rounded-lg pointer-events-auto notification-area transition ease-out duration-300 transform translate-y-0 opacity-100 sm:translate-x-0">
        <div class="rounded-lg shadow-xs" style="max-height: calc(100vh - 200px); overflow: hidden auto;">
            <div class="p-4 py-2">
                    <div>${msg}</div>
                    <button type="button" class="ui__button bg-red-600 hover:bg-red-700 focus:border-red-700 active:bg-red-700 text-center text-sm p-1" onclick="ChatGPT.ActionableNotification.close();">Close</button>
                    ${buttons.map((button, index) => `<button type="button" class="ui__button bg-indigo-600 hover:bg-indigo-700 focus:border-indigo-700 active:bg-indigo-700 text-center text-sm p-1 ml-2" style="float:right;" onclick="window.parent.ChatGPT.ActionableNotification.close();window.parent.ChatGPT.ActionableNotification.${button.label}();">${button.label}</button>`).join('')}
            </div>
        </div>
    </div>`;
    const fakeNotificationDiv = window.parent.document.querySelector(".notifications > .ui__notifications-content:last-child");
    fakeNotificationDiv.innerHTML = div;
    window.parent.ChatGPT.ActionableNotification = {
        close: () => {
            logseq.UI.closeMsg(`ActionableNotification-${logseq.baseInfo.id}`);
        },
        ...buttons.reduce((acc, button) => {
            acc[button.label] = button.onClick;
            return acc;
        })
    }
}
