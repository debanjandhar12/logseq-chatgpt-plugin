export function recreateNode(el) {
    if(!el || !el.parentNode) return;
    el.outerHTML = el.outerHTML;
}
