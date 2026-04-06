# LibreIntel

Your intelligent reading & research companion — a Chrome/Edge extension that lets you capture text from any webpage or PDF, build exploration trees, and chat with AI to deepen your understanding. Full LaTeX math rendering and Mermaid flowchart export included.

## Features

- **Text capture** — Select text on any webpage or PDF, right-click → "Push to Panel"
- **Concept exploration tree** — Organize snippets in a parent-child tree for chained exploration
- **AI-generated titles** — Each node gets a concise AI-generated title for quick scanning
- **Pin & branch** — Pin a node as parent, then push new selections as its children; or branch directly from AI responses
- **Ask AI** — Click any node to chat with an LLM about it, with full conversation history
- **Context-aware AI** — The LLM receives the full ancestor chain so it understands your exploration path
- **Voice input** — Click 🎤 to speak your question — a voice overlay appears with live transcription
- **Math rendering** — LaTeX math symbols rendered properly via KaTeX
- **Markdown support** — AI responses with bold, lists, code blocks rendered correctly
- **Mermaid flowchart export** — Export your exploration tree as a visual mind flow chart in Markdown
- **Preview & download** — Preview rendered exports (with flowchart) in the sidebar, or download as `.md`
- **Per-branch export** — Export or preview any single node and its children
- **Timestamps** — Every node and chat message is timestamped
- **Configurable LLM** — Bring your own API key; presets for DashScope (Qwen) and OpenAI
- **Persistent storage** — Tree, chat history, and settings saved in `chrome.storage.local`
- **No backend** — Everything runs locally in the browser

## Install

1. Clone this repo
2. Open `chrome://extensions/` in Chrome or Edge
3. Enable **Developer mode**
4. Click **Load unpacked** → select the project folder
5. Click the extension icon to open the sidebar panel

## Configure LLM

Click the ⚙️ icon in the sidebar panel:

| Field | Example |
|---|---|
| Preset | DashScope (Qwen) / OpenAI / Custom |
| API Endpoint | `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions` |
| API Key | Your API key |
| Model | `qwen-plus`, `gpt-4o-mini`, etc. |

Any OpenAI-compatible API endpoint works (OpenAI, DashScope, OpenRouter, Ollama, etc.).

## Usage

1. Open any webpage or PDF in Chrome
2. Select text → right-click → **Push "..." to Panel**
3. Open the sidebar → your snippet appears as a tree node with an AI-generated title
4. Click a node → chat with AI about the selected text
5. **Branch deeper:** Select text in an AI response → click 🌿 to create a child node
6. **Pin a parent:** Hover a node → click 🔗 to pin it → next push becomes its child
7. **Voice input:** Click 🎤 in chat to speak your question
8. **Preview:** Click 👁 on a node to preview that branch as a rendered Mermaid flowchart
9. **Export:** Click 📥 on a node to download that branch, or 📄 Export to download everything

## Tech Stack

- Manifest V3 Chrome Extension
- Vanilla JS / HTML / CSS
- KaTeX (math rendering, bundled locally)
- Marked (Markdown parsing, bundled locally)
- Mermaid (flowchart rendering, bundled locally)
- Web Speech API (voice input)

## Roadmap

- [ ] Drag & drop to reorder/reparent nodes
- [ ] Search across tree nodes and chat history

## Author

**Frank Sun** — [GitHub](https://github.com/FrankS-IntelLab) · [Website](https://franks-intellab.github.io/)

A problem-solving strategist focused on business decision-making and real value creation. Working across data, AI, and economic logic.

## License

[MIT](LICENSE)
