**A tightly integrated chatGPT plugin for Logseq.**

[Screencast from 2023-03-11 12-04-02.webm](https://user-images.githubusercontent.com/49021233/224469295-1e9ecbce-d71d-4b3e-ac9d-4e1d7392f469.webm)

This is the result of an 7 hour code sprint so please don't expect high quality code. Also, I am currently seeking contributors, and encourage you to browse through the available issues and assign yourself to one to contribute.

Current not available in marketplace. You have to build it yourself. Also, dont use it in your main logseq graph.

## Pending Plugin Architecture
HELP is appreciated for making these decisions.

**Some general architecture decisions:**
- Currently, the plugin represents chatgpt pages using property `type: chatgpt`. Should this be changed to something else?
- Currently, the plugin represents page flow using `chatgpt-flow` property. Should this be changed to something else?

**Some dev architecture decisions:**
- Should removePropsFromBlockContent.ts be moved from logseq folder? If so, where?

## TODO (sorted priority wise)
- [x] Add pagination to chatgpt page list
- [ ] Look for better AutoFlowFormatter trigger events
- [x] Better error handling
- [ ] Check api key on change
- [ ] Testing
- [ ] Streaming ChatGPT API (see stream function https://www.npmjs.com/package/chatgpt-wrapper)
- [ ] Enhance the Ask ChatGPT button UI
- [ ] Sanitize ChatGPT Output
