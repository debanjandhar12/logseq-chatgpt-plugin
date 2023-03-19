**A tightly integrated chatGPT plugin for Logseq.**

[Screencast from 2023-03-19 10-59-32.webm](https://user-images.githubusercontent.com/49021233/226155915-6c2b251c-6ed8-4d4f-a401-bed1cc10efbf.webm)


Currently not available in marketplace. You have to download it from releases and install manually.

## Pending Plugin Architecture Decisions
HELP is appreciated for making these decisions.

**Some general architecture decisions:**
- Currently, the plugin represents chatgpt pages using property `type: chatgpt`. Should this be changed to something else?
- Currently, the plugin represents page flow using `chatgpt-flow` property. Should this be changed to something else?

**Some dev architecture decisions:**
- Should removePropsFromBlockContent.ts be moved from logseq folder? If so, where?

# Features
- 📄 Page Management
- 🐾 Sanitizes ChatGPT Output for Logseq
- 🚀 Uses stream API of ChatGPT

# 🙏 Support
Loved the tool? Please consider donating 💸 to help continue development!<br/>
<p align="center">
<a href="https://www.buymeacoffee.com/debanjandhar12" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-orange.png" alt="Buy Me A Coffee" height="55" style="border-radius:1px" />
</p>
