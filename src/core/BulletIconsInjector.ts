/**
 * This injects the bullet icons for the "speaker : user" and "speaker : user" property value pairs.
 */

export class BulletIconsInjector {
    static init() {
        logseq.provideStyle(`
            .ls-block[data-refs-self*='speaker'][data-refs-self*='assistant'] > .flex.flex-row.pr-2 .bullet-container .bullet:before {
                content: "🤖" !important;
                color: var(--awSt-content-text-user, var(--ls-primary-text-color));
                background-color: var(--awSt-content-bg-user, var(--ls-primary-background-color));
                border-radius: 100%;
                position: relative;
                top: -10px;
                left: -6px;
                letter-spacing: 1px;
                padding-top: 1px;
                padding-bottom: 2px;
                padding-left: 2px;
                padding-right: 1px;
            }
            .ls-block[data-refs-self*='speaker'][data-refs-self*='assistant'] > div > .block-content-wrapper {
                padding-left: 2px;
            }
            
            .ls-block[data-refs-self*='speaker'][data-refs-self*='assistant']>.flex>.block-control-wrap a:hover>.bullet-container .bullet {
                transform: scale(1.2);
            }
            .ls-block[data-refs-self*='speaker'][data-refs-self*='assistant']>.flex>.block-control-wrap a:hover>.bullet-container .bullet:before  {
                background-color: var(--ls-block-bullet-border-color);
                border-radius: 15%;
            }

            .ls-block[data-refs-self*='speaker'][data-refs-self*='assistant']>.flex.flex-row.pr-2>.block-control-wrap a>.bullet-container.bullet-closed>.bullet:before {
                background-color: var(--ls-block-bullet-border-color);
                border-radius: 15%;
                opacity: 75%;
            }
        `);
        logseq.provideStyle(`
            .ls-block[data-refs-self*='speaker'][data-refs-self*='user'] > .flex.flex-row.pr-2 .bullet-container .bullet:before {
                content: "👤" !important;
                color: var(--awSt-content-text-user, var(--ls-primary-text-color));
                background-color: var(--awSt-content-bg-user, var(--ls-primary-background-color));
                border-radius: 100%;
                position: relative;
                top: -10px;
                left: -6px;
                letter-spacing: 1px;
                padding-top: 1px;
                padding-bottom: 2px;
                padding-left: 2px;
                padding-right: 1px;
            }
            .ls-block[data-refs-self*='speaker'][data-refs-self*='user'] > div > .block-content-wrapper {
                padding-left: 2px;
            }
            
            .ls-block[data-refs-self*='speaker'][data-refs-self*='user']>.flex>.block-control-wrap a:hover>.bullet-container .bullet {
                transform: scale(1.2);
            }
            .ls-block[data-refs-self*='speaker'][data-refs-self*='user']>.flex>.block-control-wrap a:hover>.bullet-container .bullet:before  {
                background-color: var(--ls-block-bullet-border-color);
                border-radius: 15%;
            }

            .ls-block[data-refs-self*='speaker'][data-refs-self*='user']>.flex.flex-row.pr-2>.block-control-wrap a>.bullet-container.bullet-closed>.bullet:before {
                background-color: var(--ls-block-bullet-border-color);
                border-radius: 15%;
                opacity: 75%;
            }
        `);
    }
}