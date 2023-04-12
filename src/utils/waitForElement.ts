/**
 * Copied from https://stackoverflow.com/a/74271142
 */
export async function waitForElement(selector, timeout = null, location = document.body) {
    return new Promise((resolve) => {
        let element = location.querySelector(selector);
        if (element) {
            return resolve(element);
        }

        const observer = new MutationObserver(async () => {
            let element = location.querySelector(selector);
            if (element) {
                resolve(element);
                observer.disconnect();
            } else {
                if (timeout) {
                    async function timeOver() {
                        return new Promise((resolve) => {
                            setTimeout(() => {
                                observer.disconnect();
                                resolve(false);
                            }, timeout);
                        });
                    }
                    resolve(await timeOver());
                }
            }
        });

        observer.observe(location, {
            childList: true,
            subtree: true,
        });
    });
}