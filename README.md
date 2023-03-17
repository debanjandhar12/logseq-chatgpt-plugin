**A tightly integrated chatGPT plugin for Logseq.**

[Screencast from 2023-03-11 13-54-43.webm](https://user-images.githubusercontent.com/49021233/224473826-1460ab43-f5ea-4f58-838c-37a20cd90a56.webm)


Currently in early development stages and hence not available in marketplace. You have to download it from releases and install manually. Also, dont use it in your main logseq graph until it is stable.

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
- [ ] ~Check api key on change~
- [x] Testing
- [x] Streaming ChatGPT API (see stream function https://www.npmjs.com/package/chatgpt-wrapper)
- [x] Enhance the Ask ChatGPT button UI
- [x] Sanitize ChatGPT Output

# 🙏 Support
Loved the tool? Please consider donating 💸 to help continue development!<br/>
<p align="center">
<a href="https://www.buymeacoffee.com/debanjandhar12" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-orange.png" alt="Buy Me A Coffee" height="55" style="border-radius:1px" />
</p>
