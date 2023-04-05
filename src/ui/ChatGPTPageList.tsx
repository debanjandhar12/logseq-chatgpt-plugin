import React, {useState} from "react";
import * as ReactDOM from 'react-dom/client';
import _ from "lodash";
import {ICON_18} from "../utils/constants";
import moment from "moment";
import {ChatgptPageFromPrompt} from "../core/ChatgptPageFromPrompt";

export async function ChatGPTPageList(): Promise<Array<any> | boolean> {
    return new Promise(async function (resolve, reject) {
        const div = window.parent.document.createElement('div');
        div.innerHTML = `
            <div class="ui__modal settings-modal cp__settings-main" style="z-index: 9999;">
            <div class="ui__modal-overlay ease-out duration-300 opacity-100 enter-done">
               <div class="absolute inset-0 opacity-75"></div>
            </div>
            <div class="ui__modal-panel transform transition-all sm:min-w-lg sm ease-out duration-300 opacity-100 translate-y-0 sm:scale-100 enter-done">
               <div class="absolute top-0 right-0 pt-2 pr-2">
                  <a aria-label="Close" type="button" class="ui__modal-close opacity-60 hover:opacity-100" onclick="ChatGPT.ChatGPTPageList.close()">
                     <svg stroke="currentColor" viewBox="0 0 24 24" fill="none" class="h-6 w-6">
                        <path d="M6 18L18 6M6 6l12 12" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></path>
                     </svg>
                  </a>
               </div>
               <div class="panel-content">
                  <div class="ui__confirm-modal is-">
                     <div class="chatgptPageList-container"></div>
                  </div>
               </div>
            </div>
         </div>`;
        const root = ReactDOM.createRoot(div.getElementsByClassName('chatgptPageList-container')[0]);
        try {
            window.parent.document.body.appendChild(div);
            root.render(<PageList/>);
        } catch (e) {
            // @ts-ignore
            window.parent.ChatGPT.ChatGPTPageList.close();
            logseq.App.showMsg("Failed to mount OcclusionEditor! Error Message: " + e);
            console.error(e);
        }
        const onKeydown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                // @ts-ignore
                window.parent.ChatGPT.ChatGPTPageList.close();
            }
        };
        div.getElementsByClassName("ui__modal-overlay")[0].addEventListener('click', () => {
            window.parent.ChatGPT.ChatGPTPageList.close();
        });
        window.parent.document.addEventListener('keydown', onKeydown);
        window.parent.ChatGPT.ChatGPTPageList = {};
        window.parent.ChatGPT.ChatGPTPageList.close = () => {
            resolve(false);
            root.unmount();
            window.parent.document.body.removeChild(div);
            window.parent.document.removeEventListener('keydown', onKeydown);
        }
    });
}

const PageList = () => {
    const [pageList, setPageList] = useState([]);
    React.useEffect(() => {
        logseq.DB.q(`(page-property type ChatGPT)`).then((res) => {
            setPageList(res);
            console.log(res);
        });
    }, []);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);

    return (
        <>
            <Header/>
            <Toolbar/>
            <PageListBody pageList={pageList} currentPage={currentPage} itemsPerPage={itemsPerPage}/>
            <PaginationControls currentPage={currentPage} itemsPerPage={itemsPerPage} totalItems={pageList.length}
                                onPageChange={setCurrentPage}/>
        </>
    )
}

const Header = () => {
    return (
        <div className="flex" style={{justifyContent: 'space-between', marginTop: '0.3rem', marginBottom: '0.3rem'}}>
            <div className="flex" style={{alignItems: 'center'}}>
                <i className="ui__icon ti ls-icon-hierarchy" dangerouslySetInnerHTML={{__html: ICON_18}}></i>
                &nbsp;
                <h3 className="text-lg">ChatGPT Page List</h3>
            </div>
            <a href="https://www.buymeacoffee.com/debanjandhar12"><img alt={"Buy me a coffee"}
                src="https://cdn.buymeacoffee.com/buttons/v2/default-orange.png" style={{height: "1.8rem"}}></img></a>
        </div>
    )
}

const Toolbar = () => {
    const createNewPage = () => {
        ChatgptPageFromPrompt.createChatGPTPageAndGoToIt();
        window.parent.ChatGPT.ChatGPTPageList.close();
    }
    return (
        <div className="flex" style={{justifyContent: 'end', alignItems: 'center', marginTop: '16px'}}>
            <button onClick={createNewPage}
                    className="ui__button bg-indigo-600 hover:bg-indigo-700 focus:border-indigo-700 active:bg-indigo-700 text-center text-sm"
                    style={{margin: '0.125rem 0.25rem 0.125rem 0', padding: '.35rem .35rem'}}><i className="ti ti-plus"
                                                                                                 style={{fontSize: '1.25rem'}}></i>New
                ChatGPT Page
            </button>
        </div>
    )
}
const PageListBody = ({pageList, currentPage, itemsPerPage}) => {

    const sortedPageList = _.sortBy(pageList, (page) => page.updatedAt).reverse();

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedPageList.slice(indexOfFirstItem, indexOfLastItem);
    return (<div className="">
        <table>
            <thead>
            <tr>
                <th>Name</th>
                <th>Created Time</th>
                <th>
                            <span className="flex items-center">
                                <span>Updated Time</span>
                                <span><svg aria-hidden="true" version="1.1" viewBox="0 0 192 512" fill="currentColor"
                                           display="inline-block" className="h-4 w-4"><path
                                    d="M31.3 192h257.3c17.8 0 26.7 21.5 14.1 34.1L174.1 354.8c-7.8 7.8-20.5 7.8-28.3 0L17.2 226.1C4.6 213.5 13.5 192 31.3 192z"
                                    fillRule="evenodd"></path></svg></span>
                            </span>
                </th>
            </tr>
            </thead>
            <tbody>
            {currentItems.map((page) => (
                <tr key={page.id}>
                    <td className="name"><PageLink pageName={page.name}/></td>
                    <td className="created-at">{new Date(page.createdAt).toLocaleString()}</td>
                    <td className="updated-at">{new Date(page.updatedAt).toLocaleString()}</td>
                </tr>
            ))}
            </tbody>
        </table>
    </div>)
}

const PageLink = ({pageName}) => {
    const onClickHandler = async (e) => {
        console.log(e.shiftKey)
        if (e.shiftKey) {
            logseq.Editor.openInRightSidebar((await logseq.Editor.getPage(pageName)).uuid);
            e.preventDefault();
        }
        // @ts-ignore
        window.parent.ChatGPT.ChatGPTPageList.close();
    }
    return (
        <a href={`#/page/${encodeURIComponent(pageName)}`} onClick={onClickHandler}>
            <div className="" data-tooltipped="" aria-describedby="tippy-tooltip-15" style={{display: "inline"}}>
                <span tabIndex="0" data-ref={pageName} className="page-ref">{pageName}</span>
            </div>
        </a>
    );
};

const PaginationControls = ({currentPage, itemsPerPage, totalItems, onPageChange}) => {
    const incrementPage = () => {
        if (currentPage < Math.ceil(totalItems / itemsPerPage)) {
            onPageChange(currentPage + 1);
        }
    }
    const decrementPage = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    }

    return (
        <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '1rem'}}>
            <a onClick={decrementPage} className="fade-link flex items-center"
               style={{visibility: currentPage > 1 ? 'visible' : 'hidden', transition: '0s'}}><span
                className="ui__icon ti ls-icon-caret-left "><svg
                xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-caret-left" width="18"
                height="18" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path
                d="M18 15l-6 -6l-6 6h12" transform="rotate(270 12 12)"></path></svg></span>Prev</a>
            <div className="px-2"><span>{currentPage}/{Math.ceil(totalItems / itemsPerPage)}</span></div>
            <a onClick={incrementPage} className="fade-link flex items-center" style={{
                visibility: currentPage === Math.ceil(totalItems / itemsPerPage) ? 'hidden' : 'visible',
                transition: '0s'
            }}>Next<span className="ui__icon ti ls-icon-caret-right "><svg
                xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-caret-right" width="18"
                height="18" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"
                strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path
                d="M18 15l-6 -6l-6 6h12" transform="rotate(90 12 12)"></path></svg></span></a>
        </div>
    )
}
