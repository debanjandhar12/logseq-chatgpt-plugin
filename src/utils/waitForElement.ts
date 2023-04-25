/**
 * Copied from https://stackoverflow.com/a/74271142
 */
export async function waitForElement(selector, timeout = null, location = document.body) {
    return new Promise((resolve) => {
        let element = location.querySelector(selector);
        if (element) {
            return resolve(element);
        }

        let timeoutId;
        const observer = new MutationObserver(async () => {
            let element = location.querySelector(selector);
            if (element) {
                clearTimeout(timeoutId);
                resolve(element);
                observer.disconnect();
            }
        });

        observer.observe(location, {
            childList: true,
            subtree: true,
        });

        if (timeout) {
            timeoutId = setTimeout(() => {
                observer.disconnect();
                resolve(false);
            }, timeout);
        }
    });
}
