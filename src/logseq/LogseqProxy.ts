/***
 * This is a minimal version of the LogseqProxy.ts from the Logseq Anki Sync plugin.
 * */
import '@logseq/libs'
import {
    SettingSchemaDesc
} from "@logseq/libs/dist/LSPlugin";
import AwaitLock from "await-lock";
import {reject} from "lodash";


let getLogseqLock = new AwaitLock();

export namespace LogseqProxy {
    export class DB {
        static registeredDBListeners = [];

        static registerDBChangeListener(listener: (event: { blocks, txData, txMeta }) => void): void {
            this.registeredDBListeners.push(listener);
        }
    }

    export class Editor {
        static async upsertBlockProperty(blockUUID: string, property: string, value: any): Promise<void> {
            await getLogseqLock.acquireAsync();
            try {
                let block = await logseq.Editor.getBlock(blockUUID);
                if (block.properties[property] == value) return;

                if (!block.properties || (block.properties && Object.keys(block.properties).length === 0)) { // if property is empty
                    // Add property to the top of the block
                    await logseq.Editor.updateBlock(blockUUID, `${property}:: ${value}\n${block.content}`);
                } else {
                    await logseq.Editor.upsertBlockProperty(blockUUID, property, value);
                }
            } finally {
                getLogseqLock.release();
            }
        }

        static blockUpdateMap = new Map<string, string | Function>();
        static updateBlockAfterDelayTimeoutFunc = null;
        static async updateBlockAfterDelay(blockUUID: string, content: string | Function, opts?: Partial<{ properties: {}; }>): Promise<void> {
            this.blockUpdateMap.set(blockUUID, content);
            if (this.updateBlockAfterDelayTimeoutFunc) return;
            this.updateBlockAfterDelayTimeoutFunc = setTimeout(() => {
                this.blockUpdateMap.forEach((content, blockUUID) => {
                    if (typeof content === "function")
                        content = content();
                    logseq.Editor.updateBlock(blockUUID, content as string, opts);
                });
                this.blockUpdateMap.clear();
                this.updateBlockAfterDelayTimeoutFunc = null;
            }, 200);
        }
    }

    export class Settings {
        static useSettingsSchema(schemas: Array<SettingSchemaDesc>): void {
            logseq.useSettingsSchema(schemas);
        }

        static registeredSettingsChangeListeners = [];

        static registerSettingsChangeListener(listener: (newSettings, oldSettings) => void): void {
            this.registeredSettingsChangeListeners.push(listener);
        }
    }

    export class App {
        static registeredGraphChangeListeners = [];

        static registerGraphChangeListener(listener: (e) => void): void {
            this.registeredGraphChangeListeners.push(listener);
        }

        static registeredGraphIndexedListeners = [];

        static registerGraphIndexedListener(listener: (e) => void): void {
            this.registeredGraphIndexedListeners.push(listener);
        }

        static registeredPageHeadActionsSlottedListeners = [];

        static registerPageHeadActionsSlottedListener(listener: (e) => void): void {
            this.registeredPageHeadActionsSlottedListeners.push(listener);
        }

        static registeredRouteChangedListeners = [];

        static registerRouteChangedListener(listener: (e) => void): void {
            this.registeredRouteChangedListeners.push(listener);
        }
    }

    export function init() {
        logseq.DB.onChanged(async ({blocks, txData, txMeta}) => {
            for (let listener of LogseqProxy.DB.registeredDBListeners) {
                listener({blocks: [...blocks], txData, txMeta});
            }
        });
        logseq.onSettingsChanged((newSettings, oldSettings) => {
            for (let listener of LogseqProxy.Settings.registeredSettingsChangeListeners) {
                listener(newSettings, oldSettings);
            }
        });
        logseq.App.onCurrentGraphChanged((...e) => {
            for (let listener of LogseqProxy.App.registeredGraphChangeListeners) {
                listener(...e);
            }
        });
        logseq.App.onCurrentGraphIndexed((...e) => {
            for (let listener of LogseqProxy.App.registeredGraphIndexedListeners) {
                listener(...e);
            }
        });
        logseq.App.onPageHeadActionsSlotted((...e) => {
            for (let listener of LogseqProxy.App.registeredPageHeadActionsSlottedListeners) {
                listener(...e);
            }
        });
        logseq.App.onRouteChanged((...e) => {
            for (let listener of LogseqProxy.App.registeredRouteChangedListeners) {
                listener(...e);
            }
        });
    }
}

