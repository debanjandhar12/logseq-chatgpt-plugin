import React, {useEffect, useRef, useState} from "react";
import * as ReactDOM from 'react-dom/client';
import {Prompt} from "../types/Prompt";
import {MESSAGES_ICON_16, TOOLS_ICON_16} from "../utils/constants";
import { MultilineInputDialog } from "./MultilineInputDialog";

export async function SelectCommandPrompt(commands : Prompt[], placeholder = "Enter command"): Promise<Prompt | false> {
    return new Promise<Prompt | false>(async function (resolve, reject) {
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
        let selectable = true;
        const onSelect = async (command, search) => {
            if (!selectable) return;
            if (command.name.startsWith('Custom:') && command.name.includes('{{userInput}}')) {
                command.name = command.name.replaceAll('{{userInput}}', search.trim());
            }
            else if (command.name.includes('{{userInput}}')) {
                selectable = false;
                window.parent.document.removeEventListener('keydown', onKeydown);
                let userInput = await MultilineInputDialog('What do you want chatgpt to do?');
                window.parent.document.addEventListener('keydown', onKeydown);
                if(userInput == false) {
                    selectable = true;
                    return;
                }
                command.name = command.name.replaceAll('{{userInput}}', userInput);
            }
            resolve(command);
            root.unmount();
            window.parent.document.body.removeChild(div);
            window.parent.document.removeEventListener('keydown', onKeydown);
        }
        const root = ReactDOM.createRoot(div.getElementsByClassName('cp__palette-main')[0]);
        try {
            window.parent.document.body.appendChild(div);
            root.render(<CommandPlate commands={commands} placeholder={placeholder} onSelect={onSelect}/>);
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

const CommandPlate = ({commands, placeholder, onSelect}) => {
    const [search, setSearch] = useState('');
    const [commandList, setCommandList] = useState(commands);
    return (
        <>
            <SearchBox search={search} onSearchChange={setSearch} placeholder={placeholder}/>
            <ActionList commandList={commandList} search={search} onSelect={onSelect} />
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

const ActionList = ({commandList, search, onSelect}) => {
    const [filteredModifiedCommandList, setFilteredModifiedCommandList] = useState(commandList);

    useEffect(() => {
        const modifiedCommandList = commandList.map((command) => {
            let newCommand = {...command};
            if (newCommand.name.startsWith('Custom:') && newCommand.name.includes('{{userInput}}'))
                newCommand.displayName = newCommand.name.replaceAll('{{userInput}}', `<u>${search.trim() == '' ? '&nbsp;'.repeat(24) : search}</u>`);
            else if (newCommand.name.includes('{{userInput}}'))
                newCommand.displayName = newCommand.name.replaceAll('{{userInput}}', `<u style='text-decoration-style: dotted;'>${'&nbsp;'.repeat(24)}</u>`);
            else newCommand.displayName = newCommand.name;
            return newCommand;
        })
        const filteredModifiedCommandList = modifiedCommandList.filter((command) => {
            return command.displayName.toLowerCase().includes(search.toLowerCase()) ||
                command.name == 'Create empty ChatGPT Page';
        });
        setFilteredModifiedCommandList(filteredModifiedCommandList);
    }, [search]);

    const [chosenCommand, setChosenCommand] = useState(0);
    const selectedRef = useRef(null);
    const [previousCursorPosition, setPreviousCursorPosition] = useState({ x: 0, y: 0 });

    // Handle some key events
    useEffect(() => {
        const onKeydown = async (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                if(filteredModifiedCommandList.length != 0)
                    onSelect(filteredModifiedCommandList[chosenCommand], search);
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setChosenCommand((chosenCommand) => Math.max(0, chosenCommand - 1));
                selectedRef.current?.scrollIntoView({ behavior: "instant", block: "center" });
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setChosenCommand((chosenCommand) => Math.min(filteredModifiedCommandList.length - 1, chosenCommand + 1));
                selectedRef.current?.scrollIntoView({ behavior: "instant", block: "center" });
            }
            else {
                const searchBox = document.getElementsByClassName('cp__palette-input')[0];
                if (searchBox) {
                    (searchBox as HTMLInputElement).focus();
                }
            }
        };
        window.parent.document.addEventListener('keydown', onKeydown, {capture: true});
        return () => {
            window.parent.document.removeEventListener('keydown', onKeydown, {capture: true});
        };
    }, [filteredModifiedCommandList, chosenCommand]);

    return (
        <div className="command-results-wrap">
            <div id="ui__ac" className="cp__palette-results">
                <div id="ui__ac-inner" className="hide-scrollbar">
                    <div className="cp__palette-results">
                        <div className="hide-scrollbar">
                            {filteredModifiedCommandList.map((command, index) =>
                                <div key={index} ref={chosenCommand === index ? selectedRef : null}>
                                    <a className={`flex justify-between px-4 py-2 text-sm transition ease-in-out duration-150 cursor menu-link ${chosenCommand === index ? 'chosen' : ''}`}
                                       onClick={() => onSelect(command, search)}
                                       onMouseEnter={(e) => {
                                           const { clientX, clientY } = e;
                                           if (clientX == previousCursorPosition.x && clientY == previousCursorPosition.y)
                                               return;
                                           setPreviousCursorPosition({ x: clientX, y: clientY });
                                           return setChosenCommand(index);
                                       }}>
                                            <span className="flex-1">
                                                <div className="inline-grid grid-cols-4 items-center w-full">
                                                    <span className="col-span-3" dangerouslySetInnerHTML={{__html: command.displayName}}></span>
                                                    <div className="col-span-1 flex justify-end tip">
                                                        {command && command.tools && (command.tools.length >= 1) && (
                                                            <code className="opacity-40 bg-transparent"
                                                                  ref={(el) => el && el.style.setProperty('padding-top', '0px', 'important')
                                                                      && el.style.setProperty('padding-bottom', '0px', 'important')}
                                                                  title={"This command uses and sends data external tools such as Google."}>
                                                                <span className="ui__icon ti ls-icon-hierarchy px-1" style={{'marginTop': '2px'}}
                                                                      dangerouslySetInnerHTML={{ __html: TOOLS_ICON_16 }}></span></code>
                                                        )}
                                                        {command && command.promptPrefixMessagesLength && (
                                                            <code className="opacity-40 bg-transparent"
                                                                  ref={(el) => el && el.style.setProperty('padding-top', '0px', 'important')
                                                                      && el.style.setProperty('padding-bottom', '0px', 'important')}
                                                                  title={"This command sends additional " + command.promptPrefixMessagesLength + " hidden prompt tokens for improved response."}>
                                                                <span className="ui__icon ti ls-icon-hierarchy px-1" style={{'marginTop': '2px'}}
                                                                      dangerouslySetInnerHTML={{ __html: MESSAGES_ICON_16 }}></span></code>
                                                        )}
                                                        {command && command.group && (
                                                            <code
                                                                className="opacity-40 bg-transparent">{command.group}</code>
                                                        )}
                                                    </div>
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
