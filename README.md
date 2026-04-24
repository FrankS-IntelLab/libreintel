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

---

# LibreIntel（中文说明）

你的智能阅读与研究助手——一款 Chrome/Edge 扩展，可从任意网页或 PDF 中捕获文本，构建探索树，并与 AI 对话以加深理解。内置 LaTeX 数学公式渲染和 Mermaid 流程图导出。

## 功能

- **文本捕获** — 在任意网页或 PDF 上选中文本，右键 → "Push to Panel"
- **概念探索树** — 以父子树结构组织文本片段，实现链式探索
- **AI 自动生成标题** — 每个节点自动获得简洁的 AI 生成标题，方便快速浏览
- **固定与分支** — 固定某节点为父节点，后续推送的文本自动成为其子节点；也可直接从 AI 回复中分支
- **AI 问答** — 点击任意节点即可就该内容与 LLM 对话，保留完整对话历史
- **上下文感知** — LLM 接收完整的祖先链，理解你的探索路径
- **语音输入** — 点击 🎤 语音提问，弹出语音覆盖层并实时转录
- **数学公式渲染** — 通过 KaTeX 正确渲染 LaTeX 数学符号
- **Markdown 支持** — AI 回复中的粗体、列表、代码块正确渲染
- **Mermaid 流程图导出** — 将探索树导出为可视化思维流程图（Markdown 格式）
- **预览与下载** — 在侧边栏预览渲染后的导出内容（含流程图），或下载为 `.md` 文件
- **单分支导出** — 可导出或预览任意单个节点及其子节点
- **时间戳** — 每个节点和聊天消息均带有时间戳
- **可配置 LLM** — 自带 API Key；预设支持 DashScope（通义千问）和 OpenAI
- **持久化存储** — 树、聊天记录和设置保存在 `chrome.storage.local`
- **无需后端** — 一切在浏览器本地运行

## 安装

1. 克隆本仓库
2. 在 Chrome 或 Edge 中打开 `chrome://extensions/`
3. 开启 **开发者模式**
4. 点击 **加载已解压的扩展程序** → 选择项目文件夹
5. 点击扩展图标打开侧边栏面板

## 配置 LLM

点击侧边栏中的 ⚙️ 图标：

| 字段 | 示例 |
|---|---|
| 预设 | DashScope（通义千问）/ OpenAI / 自定义 |
| API 端点 | `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions` |
| API Key | 你的 API Key |
| 模型 | `qwen-plus`、`gpt-4o-mini` 等 |

任何兼容 OpenAI 的 API 端点均可使用（OpenAI、DashScope、OpenRouter、Ollama 等）。

## 使用方法

1. 在 Chrome 中打开任意网页或 PDF
2. 选中文本 → 右键 → **Push "..." to Panel**
3. 打开侧边栏 → 你的文本片段以树节点形式出现，附带 AI 生成的标题
4. 点击节点 → 就选中的文本与 AI 对话
5. **深入分支：** 选中 AI 回复中的文本 → 点击 🌿 创建子节点
6. **固定父节点：** 悬停节点 → 点击 🔗 固定 → 下次推送自动成为其子节点
7. **语音输入：** 在聊天中点击 🎤 语音提问
8. **预览：** 点击节点上的 👁 预览该分支的 Mermaid 流程图
9. **导出：** 点击节点上的 📥 下载该分支，或点击 📄 导出下载全部内容

## 技术栈

- Manifest V3 Chrome 扩展
- 原生 JS / HTML / CSS
- KaTeX（数学公式渲染，本地打包）
- Marked（Markdown 解析，本地打包）
- Mermaid（流程图渲染，本地打包）
- Web Speech API（语音输入）

## 路线图

- [ ] 拖拽排序/重新设置父节点
- [ ] 跨树节点和聊天记录搜索

## 作者

**Frank Sun** — [GitHub](https://github.com/FrankS-IntelLab) · [网站](https://franks-intellab.github.io/)

专注于商业决策与真实价值创造的问题解决策略师，横跨数据、AI 与经济逻辑。

## 许可证

[MIT](LICENSE)
