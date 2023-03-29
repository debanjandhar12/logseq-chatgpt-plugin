import React, {useEffect, useState} from "react";
import * as ReactDOM from 'react-dom/client';
import _ from "lodash";
import {ICON_18} from "../utils/constants";
import moment from "moment";

export async function SelectCommandPrompt(commands, placeholder = "Enter command"): Promise<Array<any> | boolean> {
    return new Promise(async function (resolve, reject) {
        const div = window.parent.document.createElement('div');
        div.innerHTML = `<div label="" class="ui__modal" style="z-index: 999;">
               <div class="ui__modal-overlay ease-out duration-300 opacity-100 enter-done">
                  <div class="absolute inset-0 opacity-75"></div>
               </div>
               <div class="ui__modal-panel transform transition-all sm:min-w-lg sm ease-out duration-300 opacity-100 translate-y-0 sm:scale-100 enter-done">
                  <div class="absolute top-0 right-0 pt-2 pr-2"></div>
                  <div class="panel-content">
                     <div class="cp__palette cp__palette-main">
                        <div class="command-reawaitsults-wrap">
                           <div id="ui__ac" class="cp__palette-results">
                              <div id="ui__ac-inner" class="hide-scrollbar">
                                <!-- Actions -->
                                 <div>
                                    <a id="ac-0" class="flex justify-between px-4 py-2 text-sm transition ease-in-out duration-150 cursor menu-link chosen">
                                       <span class="flex-1">
                                          <div class="inline-grid grid-cols-4 items-center w-full chosen">
                                             <span class="col-span-3">Close Tab</span>
                                             <div class="col-span-1 flex justify-end tip"><code class="opacity-40 bg-transparent">plugin.logseq-tabs</code><code class="ml-1">ctrl+w</code></div>
                                          </div>
                                       </span>
                                    </a>
                                 </div>
                                 <div>
                                    <a id="ac-1" class="flex justify-between px-4 py-2 text-sm transition ease-in-out duration-150 cursor menu-link">
                                       <span class="flex-1">
                                          <div class="inline-grid grid-cols-4 items-center w-full">
                                             <span class="col-span-3">Select Next Tab</span>
                                             <div class="col-span-1 flex justify-end tip"><code class="opacity-40 bg-transparent">plugin.logseq-tabs</code><code class="ml-1">ctrl+down</code></div>
                                          </div>
                                       </span>
                                    </a>
                                 </div>
                                 <div>
                                    <a id="ac-2" class="flex justify-between px-4 py-2 text-sm transition ease-in-out duration-150 cursor menu-link">
                                       <span class="flex-1">
                                          <div class="inline-grid grid-cols-4 items-center w-full">
                                             <span class="col-span-3">Toggle wide mode</span>
                                             <div class="col-span-1 flex justify-end tip"><code class="opacity-40 bg-transparent">ui</code><code class="ml-1">t w</code></div>
                                          </div>
                                       </span>
                                    </a>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div`;
        const root = ReactDOM.createRoot(div.getElementsByClassName('cp__palette-main')[0]);
        try {
            window.parent.document.body.appendChild(div);
            root.render(<CommandPlate commands={commands} placeholder={placeholder} onSelect={(command) => {
                resolve(command);
                root.unmount();
                window.parent.document.body.removeChild(div);
                window.parent.document.removeEventListener('keydown', onKeydown);
                }} />);
        } catch (e) {
            // @ts-ignore
            window.parent.chatgptPageList_close_action();
            logseq.App.showMsg("Failed to mount CommandPlate! Error Message: " + e);
            console.error(e);
        }
        const onKeydown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                // @ts-ignore
                window.parent.select_command_prompt_close_action();
            }
        };
        div.getElementsByClassName("ui__modal-overlay")[0].addEventListener('click', () => {
            window.parent.select_command_prompt_close_action();
        });
        window.parent.document.addEventListener('keydown', onKeydown);
        // @ts-ignore
        window.parent.select_command_prompt_close_action = () => {
            resolve(false);
            root.unmount();
            window.parent.document.body.removeChild(div);
            window.parent.document.removeEventListener('keydown', onKeydown);
        }
    });
}

const CommandPlate = ({commands, placeholder, onSelect}) => {
    const [search, setSearch] = useState('');
    const [commandList, setCommandList] = useState(commands);
    return (
        <>
            <SearchBox search={search} onSearchChange={setSearch} placeholder={placeholder} />
            <ActionList commandList={commandList} search={search} onSelect={onSelect} />
        </>
    )
}

const SearchBox = ({ search, placeholder, onSearchChange }) => {
    const handleSearchChange = (event) => {
        onSearchChange(event.target.value);
    };

    return (
        <div className="input-wrap">
            <input
                type="text"
                placeholder={placeholder}
                className="cp__palette-input w-full h-full"
                value={search}
                onChange={handleSearchChange}
                autoFocus
            />
        </div>
    );
};

const ActionList = ({commandList, search, onSelect}) => {
    const filteredCommandList = commandList.filter((command) => {
        return command.name.toLowerCase().includes(search.toLowerCase());
    });
    console.log(onSelect);

    return (
        <div className="cp__palette-results">
            <div className="hide-scrollbar">
                {filteredCommandList.map((command, index) =>
                    <div key={index}>
                        <a className="flex justify-between px-4 py-2 text-sm transition ease-in-out duration-150 cursor menu-link"  onClick={() => onSelect(command)}>
                            <span className="flex-1">
                                <div className="inline-grid grid-cols-4 items-center w-full">
                                    <span className="col-span-3">{command.name}</span>
                                </div>
                            </span>
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
