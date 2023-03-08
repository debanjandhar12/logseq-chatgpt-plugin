import {ICON_18} from "../utils/constants";

export default function registerSideNavBarItem(name, icon, action) {
    // <div class="journals-nav"><a class="item group flex items-center text-sm font-medium rounded-md"><span class="flex-1">Journals</span></a></div>
    const div = document.createElement('div');
    div.innerHTML = `
        <a class="item group flex items-center text-sm font-medium rounded-md">
            <span class="ui__icon ti ls-icon-hierarchy">${ICON_18}</span>
            <span class="flex-1">${name}</span>
        </a>
    `;
    div.className = `${name}-nav`;
    div.addEventListener('click', action);


    const navHeader = window.parent.document.querySelector('.nav-header');
    if (navHeader.querySelector(`.${name}-nav`)) {
        unregisterSideNavBarItem(name);
    }
    // Append to navHeader before the last child (the settings button)
    navHeader.insertBefore(div, navHeader.lastChild);
}

export function unregisterSideNavBarItem(name) {
    const navHeader = window.parent.document.querySelector('.nav-header');
    if (navHeader.querySelector(`.${name}-nav`)) {
        navHeader.removeChild(navHeader.querySelector(`.${name}-nav`));
    }
}