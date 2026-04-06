# BookLogic Studio

A Chrome/Edge extension that turns your browser into a PDF study assistant. Select text from any PDF, push it to a sidebar panel, and ask AI to explain it — with full LaTeX math rendering.

## Features

- **PDF text capture** — Select text in Chrome's PDF viewer, right-click → "Push to Panel"
- **Sidebar panel** — Collected snippets displayed in a clean side panel
- **Ask AI** — Click "Ask AI" on any snippet to chat with an LLM about it
- **Math rendering** — LaTeX math symbols rendered properly via KaTeX
- **Markdown support** — AI responses with bold, lists, code blocks rendered correctly
- **Configurable LLM** — Bring your own API key; presets for DashScope (Qwen) and OpenAI
- **No backend** — Everything runs locally in the browser, data stored in `chrome.storage.local`

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

1. Open any PDF in Chrome
2. Select text → right-click → **Push "..." to Panel**
3. Open the sidebar → see your snippet
4. Click **Ask AI** → type a question about the selected text
5. Get an AI explanation with proper math symbols and formatting

## Tech Stack

- Manifest V3 Chrome Extension
- Vanilla JS / HTML / CSS
- KaTeX (math rendering, bundled locally)
- Marked (Markdown parsing, bundled locally)
- Web Speech API (voice input — coming soon)

## Roadmap

- [ ] Concept tree with drag & drop
- [ ] Voice input via Web Speech API
- [ ] Export study path to Markdown
- [ ] Multi-turn chat history persistence

## Author

**Frank Sun** — [GitHub](https://github.com/FrankS-IntelLab) · [Website](https://franks-intellab.github.io/)

A problem-solving strategist focused on business decision-making and real value creation. Working across data, AI, and economic logic.

## License

[MIT](LICENSE)
