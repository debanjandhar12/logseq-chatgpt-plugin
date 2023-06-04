import React, {useEffect, useState} from "react";
import ReactDOM from 'react-dom';
import {GPT_ICON_18} from "../utils/constants";
import {UserDefinedPrompt} from "../types/UserDefinedPrompt";
import {MultilineInputDialog} from "./MultilineInputDialog";
import _ from "lodash";

export async function UserDefinedPromptEditorDialog(): Promise<Array<UserDefinedPrompt> | boolean> {
    return new Promise<Array<any> | boolean>(async function (resolve, reject) {
        const div = window.parent.document.createElement('div');
        div.innerHTML = `
            <div class="ui__modal settings-modal cp__settings-main" style="z-index: 999;">
            <div class="ui__modal-overlay ease-out duration-300 opacity-100 enter-done">
               <div class="absolute inset-0 opacity-75"></div>
            </div>
            <div class="ui__modal-panel transform transition-all sm:min-w-lg sm ease-out duration-300 opacity-100 translate-y-0 sm:scale-100 enter-done">
               <div class="absolute top-0 right-0 pt-2 pr-2">
                  <a aria-label="Close" type="button" class="ui__modal-close opacity-60 hover:opacity-100" onclick="ChatGPT.ChatGPTUserDefinedPromptEditor.close()">
                     <svg stroke="currentColor" viewBox="0 0 24 24" fill="none" class="h-6 w-6">
                        <path d="M6 18L18 6M6 6l12 12" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></path>
                     </svg>
                  </a>
               </div>
               <div class="panel-content">
                  <div class="ui__confirm-modal is-">
                     <div class="chatgptPromptEditor-container"></div>
                  </div>
               </div>
            </div>
         </div>`;
        const container = div.getElementsByClassName('chatgptPromptEditor-container')[0];
        try {
            window.parent.document.body.appendChild(div);
            ReactDOM.render(<UserDefinedPromptEditor />, container);
        } catch (e) {
            window.parent.ChatGPT.ChatGPTUserDefinedPromptEditor.close();
            logseq.App.showMsg("Failed to mount ChatGPTUserDefinedPromptEditor! Error Message: " + e);
            console.error(e);
        }
        const onKeydown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                window.parent.ChatGPT.ChatGPTUserDefinedPromptEditor.close();
            }
            else if (e.key === 'Enter' && window.parent.document.activeElement.tagName === 'TEXTAREA') {
                const textarea = window.parent.document.activeElement as HTMLTextAreaElement;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const value = textarea.value;
                textarea.value = value.substring(0, start) + '\n' + value.substring(end);
                textarea.scrollTop = textarea.scrollHeight;
                textarea.selectionStart = textarea.selectionEnd = start + 1; //reset cursor position to end of new line
            }
        };
        div.getElementsByClassName("ui__modal-overlay")[0].addEventListener('click', () => {
            window.parent.ChatGPT.ChatGPTUserDefinedPromptEditor.close();
        });
        window.parent.document.addEventListener('keydown', onKeydown);
        window.parent.ChatGPT.ChatGPTUserDefinedPromptEditor = {};
        window.parent.ChatGPT.ChatGPTUserDefinedPromptEditor.close = () => {
            resolve(false);
            ReactDOM.unmountComponentAtNode(container);
            window.parent.document.body.removeChild(div);
            window.parent.document.removeEventListener('keydown', onKeydown);
        }
    });
}

const UserDefinedPromptEditor = () => {
    const [userDefinedPromptList, setUserDefinedPromptList] = useState(null);
    React.useEffect(() => {
        let userDefinedPromptList = [];
        try {
        userDefinedPromptList = JSON.parse(logseq.settings.userDefinedPromptList) || [];
        } catch {  }
        setUserDefinedPromptList(userDefinedPromptList);
    }, []);
    React.useEffect(() => {
        if (userDefinedPromptList && userDefinedPromptList.length === 0) {
            setUserDefinedPromptList([{}]);
        }
        logseq.updateSettings({userDefinedPromptList: JSON.stringify(userDefinedPromptList) || []});
        console.log('userDefinedPromptList saved', userDefinedPromptList);
    }, [userDefinedPromptList])
    const [currentPromptIdx, setCurrentPromptIdx] = useState(0);
    return (
        <>
            <Header/>
            <Toolbar userDefinedPromptList={userDefinedPromptList} currentPromptIdx={currentPromptIdx} setCustomPromptList={setUserDefinedPromptList} setCurrentPromptIdx={setCurrentPromptIdx}/>
            <CurrentPromptEditor userDefinedPromptList={userDefinedPromptList} currentPromptIdx={currentPromptIdx} setCustomPromptList={setUserDefinedPromptList} />
        </>
    )
}

const Header = () => {
    return (
        <div className="flex" style={{alignItems: 'left'}}>
            <i className="ui__icon ti ls-icon-hierarchy" dangerouslySetInnerHTML={{__html: GPT_ICON_18}}></i>
            &nbsp;
            <h3 className="text-lg">ChatGPT Plugin - User Defined Prompt Editor</h3>
        </div>
    )
}

const Toolbar = ({userDefinedPromptList, currentPromptIdx, setCustomPromptList, setCurrentPromptIdx}) => {
    if (!userDefinedPromptList) return null;
    const incrementCurrentPromptIdx = () => {
        console.log(userDefinedPromptList.length);
        setCurrentPromptIdx(Math.min(currentPromptIdx + 1, userDefinedPromptList.length - 1));
    }
    const decrementCurrentPromptIdx = () => {
        setCurrentPromptIdx(Math.max(currentPromptIdx - 1, 0));
    }
    const createNewPrompt = async () => {
        let indexOfNewPrompt = userDefinedPromptList.length;
        await setCustomPromptList(() => [...userDefinedPromptList, {}]);
        setCurrentPromptIdx(indexOfNewPrompt);
    }

    const deleteCurrentPrompt = async () => {
        if (userDefinedPromptList.length === 0) {
            return;
        }
        setCustomPromptList(() => [...userDefinedPromptList.filter((_, idx) => idx !== currentPromptIdx)]);
        decrementCurrentPromptIdx();
    }

    const importFromPromptCode = async () => {
        const promptCode = await MultilineInputDialog("Paste the prompt code here:");
        if (!promptCode) {
            return;
        }
        try {
            if (!promptCode.startsWith('lsChatGPT')) {
                throw new Error("Invalid prompt code!");
            }
            const prompt = JSON.parse(atob(promptCode.replace('lsChatGPT', '')));
            if (!prompt) {
                throw new Error("Invalid prompt code!");
            }
            if (_.find(userDefinedPromptList, {name: prompt.name})) {
                throw new Error(`A prompt with the name "${prompt.name}" already exists!`);
            }
            if (prompt.name && prompt.name.trim() !== '') {
                await setCustomPromptList(() => [...userDefinedPromptList, prompt]);
                setCurrentPromptIdx(userDefinedPromptList.length);
            }
            await setCustomPromptList(() => [...userDefinedPromptList, prompt]);
            setCurrentPromptIdx(userDefinedPromptList.length);
        }
        catch (e) {
            logseq.App.showMsg("Failed to import prompt!\n" + e, 'error');
            console.error(e);
        }
    }

    const exportToPromptCode = async () => {
        const currentPrompt = userDefinedPromptList[currentPromptIdx];
        if (!currentPrompt || !currentPrompt.name || currentPrompt.name.trim() == '') {
            logseq.App.showMsg("Cannot export prompt with no name!", 'error');
            return;
        }
        const code = `lsChatGPT${btoa(JSON.stringify(currentPrompt))}`;
        await window.parent.navigator.clipboard.writeText(code);
        logseq.App.showMsg("Prompt code copied to clipboard!\n"
                            + "You can share and later import this prompt by pasting this code.");
    }

    return (
        <div className="flex" style={{justifyContent: 'space-between', marginTop: '0.3rem', marginBottom: '0.3rem'}}>
            <div style={{display: 'flex', justifyContent: 'flex-start', marginTop: '1rem'}}>
                <a onClick={decrementCurrentPromptIdx} className="fade-link flex items-center"
                   style={{visibility: currentPromptIdx > 0 ? 'visible' : 'hidden', transition: '0s'}}><span
                    className="ui__icon ti ls-icon-caret-left "><svg
                    xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-caret-left" width="18"
                    height="18" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path
                    d="M18 15l-6 -6l-6 6h12" transform="rotate(270 12 12)"></path></svg></span>Prev</a>
                <div className="px-2"><span>{currentPromptIdx + 1} / {userDefinedPromptList.length}</span></div>
                <a onClick={incrementCurrentPromptIdx} className="fade-link flex items-center" style={{
                    visibility: currentPromptIdx >= userDefinedPromptList.length - 1 ? 'hidden' : 'visible',
                    transition: '0s'
                }}>Next<span className="ui__icon ti ls-icon-caret-right "><svg
                    xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-caret-right" width="18"
                    height="18" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"
                    strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path
                    d="M18 15l-6 -6l-6 6h12" transform="rotate(90 12 12)"></path></svg></span></a>
            </div>
            <div>
                <button onClick={importFromPromptCode}
                        className="ui__button bg-indigo-600 hover:bg-indigo-700 focus:border-indigo-700 active:bg-indigo-700 text-center text-sm"
                        style={{margin: '0.125rem 0.25rem 0.125rem 0', padding: '.35rem .35rem'}}><i className="ti ti-world-download" style={{fontSize: '0.85rem'}}></i>
                </button>
                <button onClick={exportToPromptCode}
                        className="ui__button bg-indigo-600 hover:bg-indigo-700 focus:border-indigo-700 active:bg-indigo-700 text-center text-sm"
                        style={{margin: '0.125rem 0.25rem 0.125rem 0', padding: '.35rem .35rem'}}><i className="ti ti-world-upload" style={{fontSize: '0.85rem'}}></i>
                </button>
                <span style={{borderLeft: '1px solid var(--ls-border-color)', height: '1.25rem', margin: '0.125rem 0.4rem 0.125rem 0.4rem'}}></span>
                <button onClick={deleteCurrentPrompt}
                        className="ui__button bg-red-600 hover:bg-red-700 focus:border-red-700 active:bg-red-700 text-center text-sm"
                        style={{margin: '0.125rem 0.25rem 0.125rem 0', padding: '.35rem .35rem'}}><i className="ti ti-trash" style={{fontSize: '1.25rem'}}></i>
                </button>
                <button onClick={createNewPrompt}
                        className="ui__button bg-green-600 hover:bg-green-700 focus:border-green-700 active:bg-green-700 text-center text-sm"
                        style={{margin: '0.125rem 0.25rem 0.125rem 0', padding: '.35rem .35rem'}}><i className="ti ti-plus" style={{fontSize: '1.25rem'}}></i>
                </button>
            </div>
        </div>
    )
}
const CurrentPromptEditor = ({userDefinedPromptList, currentPromptIdx, setCustomPromptList}) => {
    if (!userDefinedPromptList) return null;
    if (!userDefinedPromptList[currentPromptIdx]) return null;
    const [name, setName] = useState('');
    const [promptVisibility, setPromptVisibility] = useState('');
    const [tool, setTool] = useState('');
    const [toolMetadata, setToolMetadata] = useState({
        apiEndpoint: '',
        headers: '',
        body: '',
        method: 'GET',
        bodyType: 'JSON',
        toolDesc: ''
    });
    const [hiddenPromptMsg, setHiddenPromptMsg] = useState('');
    const [promptMessage, setPromptMessage] = useState('');

    useEffect(() => {
        let currentPrompt = userDefinedPromptList[currentPromptIdx];
        if (!currentPrompt) return;
        setName(currentPrompt.name || '');
        setPromptVisibility(currentPrompt.promptVisibility || 'Blocks');
        if (typeof currentPrompt.tool === 'object') {
            setTool(currentPrompt.tool.type);
            setToolMetadata(currentPrompt.tool.metadata);
        } else {
            setTool(currentPrompt.tool || 'None');
            setToolMetadata({apiEndpoint: '', headers: '', body: '', method: 'GET', bodyType: 'JSON', toolDesc: ''});
        }
        setHiddenPromptMsg(currentPrompt.hiddenPromptMsg || '');
        setPromptMessage(currentPrompt.promptMessage || '{{{selectedBlocksList}}}');
    }, [currentPromptIdx]);

    useEffect(() => {
        let newCustomPromptList = [...userDefinedPromptList];
        let newTool : any = tool;
        if (tool == 'API')
            newTool = {type: 'API', metadata: toolMetadata};
        newCustomPromptList[currentPromptIdx] = {name, promptVisibility: promptVisibility, tool: newTool, hiddenPromptMsg: hiddenPromptMsg, promptMessage};
        setCustomPromptList([...newCustomPromptList]);
    }, [name, promptVisibility, tool, toolMetadata, hiddenPromptMsg, promptMessage]);
    return (
        <div className="no-aside">
            <div>
                <div className="desc-item as-input my-2">
                    <h2><strong>Prompt Name</strong></h2>
                    <label className="form-control">
                        <input type="text" className="form-input"
                               value={name}
                               onChange={(e) => { setName(() => e.target.value); }}
                        />
                    </label>
                </div>
                <div className="desc-item as-input my-2">
                    <h2><strong>Prompt Visibility</strong></h2>
                    <label className="form-control">
                        <select className="form-input" value={promptVisibility} onChange={(e) => { setPromptVisibility(e.target.value); }}>
                            <option value="Blocks">Blocks</option>
                            <option value="Single Block">Single Block</option>
                            <option value="No Input">No Input</option>
                        </select>
                    </label>
                </div>
                <div className="desc-item as-input my-2">
                    <h2><strong>Tool</strong></h2>
                    <select className="form-input" value={tool} onChange={(e) => { setTool(e.target.value); }}>
                        <option value="None">None</option>
                        <option value="ZapierNLA">ZapierNLA</option>
                        <option value="WebBrowser">WebBrowser</option>
                        <option value="API">Custom API</option>
                    </select>
                </div>
                {
                    tool === 'API' && (
                        <>
                            <div className="desc-item as-input my-2">
                                <h2><strong>API Endpoint</strong></h2>
                                <label className="form-control">
                                    <input type="text" className="form-input"
                                           value={toolMetadata.apiEndpoint || ''}
                                           onChange={(e) => { setToolMetadata({...toolMetadata, apiEndpoint: e.target.value}); }}
                                    />
                                </label>
                            </div>
                            <div className="desc-item as-input my-2">
                                <h2><strong>Method</strong></h2>
                                <label className="form-control">
                                    <select className="form-input" value={toolMetadata.method} onChange={(e) => { setToolMetadata({...toolMetadata, method: e.target.value}); }}>
                                        <option value="GET">GET</option>
                                        <option value="POST">POST</option>
                                    </select>
                                </label>
                            </div>
                            <div className="desc-item as-input my-2">
                                <h2><strong>Headers</strong></h2>
                                <label className="form-control">
                                    <textarea className="form-input" style={{overflow: "auto", whiteSpace: "pre"}}
                                              value={toolMetadata.headers || ''}
                                              onKeyUp={(e) => { setToolMetadata({...toolMetadata, headers: (e.target as HTMLTextAreaElement).value}); }}
                                              onChange={(e) => { setToolMetadata({...toolMetadata, headers: e.target.value}); }}
                                    />
                                </label>
                            </div>
                            {
                                toolMetadata.method === 'POST' &&
                                (<>
                                    <div className="desc-item as-input my-2">
                                        <h2><strong>Body Type</strong></h2>
                                        <label className="form-control">
                                            <select className="form-input" value={toolMetadata.bodyType} onChange={(e) => { setToolMetadata({...toolMetadata, bodyType: e.target.value}); }}>
                                                <option value="JSON">JSON</option>
                                                <option value="Form Data">Form Data</option>
                                            </select>
                                        </label>
                                    </div>
                                    <div className="desc-item as-input my-2">
                                        <h2><strong>Body</strong></h2>
                                        <label className="form-control">
                                            <textarea className="form-input" style={{overflow: "auto", whiteSpace: "pre"}}
                                                   value={toolMetadata.body || ''}
                                                   onKeyUp={(e) => { setToolMetadata({...toolMetadata, body: (e.target as HTMLTextAreaElement).value}); }}
                                                   onChange={(e) => { setToolMetadata({...toolMetadata, body: e.target.value}); }}
                                            />
                                        </label>
                                    </div>
                                </>)
                            }
                            <div className="desc-item as-input my-2">
                                <h2><strong>Tool Description</strong></h2>
                                <label className="form-control">
                                    <input type="text" className="form-input"
                                           value={toolMetadata.toolDesc || ''}
                                           onChange={(e) => { setToolMetadata({...toolMetadata, toolDesc: e.target.value}); }}
                                    />
                                </label>
                            </div>
                        </>
                    )
                }
                <div className="desc-item as-input my-2">
                    <h2><strong>Hidden {tool == 'None' ? 'Prefix' : 'Suffix'} Prompt Message</strong></h2>
                    <label className="form-control">
                        <textarea className="form-input" style={{overflow: "auto", whiteSpace: "pre"}} value={hiddenPromptMsg}
                                  onKeyUp={(e) => { setHiddenPromptMsg(() => (e.target as HTMLTextAreaElement).value); }}
                                  onChange={(e) => { setHiddenPromptMsg(() => e.target.value); }} />
                    </label>
                </div>
                <div className="desc-item as-input my-2">
                    <h2><strong>Prompt Message</strong></h2>
                    <label className="form-control">
                        <textarea className="form-input" style={{overflow: "auto", whiteSpace: "pre"}} value={promptMessage}
                                  onKeyUp={(e) => { setPromptMessage(() => (e.target as HTMLTextAreaElement).value); }}
                                  onChange={(e) => { setPromptMessage(() => e.target.value); }} />
                    </label>
                </div>
            </div>
        </div>
    )
}

