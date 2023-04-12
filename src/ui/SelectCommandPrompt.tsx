import React, {useEffect, useState} from "react";
import * as ReactDOM from 'react-dom/client';
import _ from "lodash";
import {ICON_18} from "../utils/constants";
import moment from "moment";
import {Prompt} from "../types/Prompt";

export async function SelectCommandPrompt(commands : Prompt[], placeholder = "Enter command", customCommandAllowed = false): Promise<Prompt | false> {
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
                      </div>
                   </div>
                </div>
            </div>`;
        const root = ReactDOM.createRoot(div.getElementsByClassName('cp__palette-main')[0]);
        try {
            window.parent.document.body.appendChild(div);
            root.render(<CommandPlate commands={commands} placeholder={placeholder} customCommandAllowed={customCommandAllowed} onSelect={(command) => {
                if (command.name.startsWith("<strong>Custom:</strong> "))
                    command.name = command.name.replace("<strong>Custom:</strong>", "Custom:");
                resolve(command);
                root.unmount();
                window.parent.document.body.removeChild(div);
                window.parent.document.removeEventListener('keydown', onKeydown);
            }}/>);
        } catch (e) {
            window.parent.ChatGPT.CommandPrompt.close();
            logseq.App.showMsg("Failed to mount CommandPlate! Error Message: " + e);
            console.error(e);
        }
        const onKeydown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                window.parent.ChatGPT.CommandPrompt.close();
            }
            e.stopImmediatePropagation();
        };
        div.getElementsByClassName("ui__modal-overlay")[0].addEventListener('click', () => {
            window.parent.ChatGPT.CommandPrompt.close();
        });
        window.parent.document.addEventListener('keydown', onKeydown);
        window.parent.ChatGPT.CommandPrompt = {};
        window.parent.ChatGPT.CommandPrompt.close = () => {
            resolve(false);
            root.unmount();
            window.parent.document.body.removeChild(div);
            window.parent.document.removeEventListener('keydown', onKeydown);
        }
    });
}

const CommandPlate = ({commands, placeholder, customCommandAllowed, onSelect}) => {
    const [search, setSearch] = useState('');
    const [commandList, setCommandList] = useState(commands);
    return (
        <>
            <SearchBox search={search} onSearchChange={setSearch} placeholder={placeholder}/>
            <ActionList commandList={commandList} search={search} customCommandAllowed={customCommandAllowed} onSelect={onSelect} />
        </>
    )
}

const SearchBox = ({search, placeholder, onSearchChange}) => {
    const handleSearchChange = (event) => {
        onSearchChange(event.target.value);
    };

    return (
        <div className="input-wrap">
            <input
                type="text"
                placeholder={placeholder}
                className="cp__palette-input w-full h-full"
                defaultValue={search}
                onChange={handleSearchChange}
                autoFocus
            />
        </div>
    );
};

const ActionList = ({commandList, search, customCommandAllowed, onSelect}) => {
    const filteredCommandList = commandList.filter((command) => {
        return command.name.toLowerCase().includes(search.toLowerCase());
    });
    if (customCommandAllowed && search.length != "")
        filteredCommandList.push({name: `<strong>Custom:</strong> ${search}`, required_input: 'block(s)',
            getPrompt: () => `${search}:`.replace(/:(:)+/g, ':')});
    const [chosenCommand, setChosenCommand] = useState(0);
    // Handle some key events
    useEffect(() => {
        const onKeydown = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                if(filteredCommandList.length != 0)
                    onSelect(filteredCommandList[chosenCommand]);
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setChosenCommand((chosenCommand) => Math.max(0, chosenCommand - 1));
            }
            if (e.key === 'ArrowDown') {
                setChosenCommand((chosenCommand) => Math.min(filteredCommandList.length - 1, chosenCommand + 1));
            }
            else {
                const searchBox = document.getElementsByClassName('cp__palette-input')[0];
                if (searchBox) {
                    (searchBox as HTMLInputElement).focus();
                }
            }
        };
        window.parent.document.addEventListener('keydown', onKeydown, {capture: true});
        setChosenCommand((chosenCommand) => Math.min(filteredCommandList.length - 1, chosenCommand));
        setChosenCommand((chosenCommand) => Math.max(0, chosenCommand));
        return () => {
            window.parent.document.removeEventListener('keydown', onKeydown, {capture: true});
        };
    }, [filteredCommandList]);

    return (
        <div className="command-results-wrap">
            <div id="ui__ac" className="cp__palette-results">
                <div id="ui__ac-inner" className="hide-scrollbar">
                    <div className="cp__palette-results">
                        <div className="hide-scrollbar">
                            {filteredCommandList.map((command, index) =>
                                <div key={index}>
                                    <a className={`flex justify-between px-4 py-2 text-sm transition ease-in-out duration-150 cursor menu-link ${chosenCommand === index ? 'chosen' : ''}`}
                                       onClick={() => onSelect(command)} onMouseEnter={() => setChosenCommand(index)}>
                                            <span className="flex-1">
                                                <div className="inline-grid grid-cols-4 items-center w-full">
                                                    <span className="col-span-3" dangerouslySetInnerHTML={{__html: command.name}}></span>
                                                    {command && command.group && (
                                                        <div className="col-span-1 flex justify-end tip"><code
                                                            className="opacity-40 bg-transparent">{command.group}</code></div>
                                                    )}
                                                </div>
                                            </span>
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
