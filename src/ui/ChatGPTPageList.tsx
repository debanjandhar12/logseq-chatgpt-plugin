import React, {useState} from "react";
import * as ReactDOM from 'react-dom/client';
import _ from "lodash";
import {ICON_18} from "../utils/constants";
import moment from "moment";
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
                  <a aria-label="Close" type="button" class="ui__modal-close opacity-60 hover:opacity-100" onclick="chatgptPageList_close_action()">
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
            root.render(<PageList />);
        } catch (e) {
            // @ts-ignore
            window.parent.chatgptPageList_close_action();
            logseq.App.showMsg("Failed to mount OcclusionEditor! Error Message: " + e);
            console.error(e);
        }
        const onKeydown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                // @ts-ignore
                window.parent.chatgptPageList_close_action();
            }
        };
        window.parent.document.addEventListener('keydown', onKeydown);
        // @ts-ignore
        window.parent.chatgptPageList_close_action = () => {
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
    return (
        <>
            <Header />
            <Toolbar />
            <PageListBody pageList={pageList} />
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
            <a href="https://www.buymeacoffee.com/debanjandhar12"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-orange.png" style={{height: "1.8rem"}}></img></a>
        </div>
    )
}

const Toolbar = () => {
    const createNewPage = () => {
        logseq.Editor.createPage('chatgpt__' + moment().format('YYYY-MM-DD HH:mm:ss'),
            {'type': 'ChatGPT', 'chatgpt-flow': 'alternating'});
        // @ts-ignore
        window.parent.chatgptPageList_close_action();
    }
    return (
        <div className="flex" style={{justifyContent: 'end', alignItems: 'center', marginTop: '16px'}}>
            <button onClick={createNewPage} className="ui__button bg-indigo-600 hover:bg-indigo-700 focus:border-indigo-700 active:bg-indigo-700 text-center text-sm" style={{margin: '0.125rem 0.25rem 0.125rem 0',padding: '.35rem .35rem'}}><i className="ti ti-plus"  style={{fontSize: '1.25rem'}}></i>New ChatGPT Page</button>
        </div>
    )
}
const PageListBody = ({pageList}) => {
    const sortedPageList = _.sortBy(pageList, (page) => page.updatedAt).reverse();
    return (<div className="">
                <table>
                    <thead>
                    <tr>
                        <th>Name</th>
                        <th>Created Time</th>
                        <th>Updated Time</th>
                    </tr>
                    </thead>
                    <tbody>
                    {sortedPageList.map((page) => (
                        <tr key={page.id}>
                            <td className="name"><PageLink pageName={page.name} /></td>
                            <td className="created-at">{new Date(page.createdAt).toLocaleString()}</td>
                            <td className="updated-at">{new Date(page.updatedAt).toLocaleString()}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>)
}

const PageLink = ({ pageName }) => {
    return (
        <a href={`#/page/${encodeURIComponent(pageName)}`} onClick={window.parent.chatgptPageList_close_action}>
            <div className="" data-tooltipped="" aria-describedby="tippy-tooltip-15" style={{ display: "inline" }}>
                <span tabIndex="0" data-ref={pageName} className="page-ref">{pageName}</span>
            </div>
        </a>
    );
};