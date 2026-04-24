const treeEl = document.getElementById("tree");
const treeView = document.getElementById("tree-view");
const settingsEl = document.getElementById("settings");
const chatArea = document.getElementById("chat-area");
const chatMessages = document.getElementById("chat-messages");
const chatSnippet = document.getElementById("chat-snippet");
const chatInput = document.getElementById("chat-input");
const chatBreadcrumb = document.getElementById("chat-breadcrumb");
const branchBtn = document.getElementById("branch-btn");
const statusEl = document.getElementById("settings-status");

// --- Data ---
// Each node: { id, parentId, title, fullText, timestamp, children: [], chatHistory: [] }
let nodes = [];
let activeNodeId = null;
let targetParentId = null; // 📌 pinned parent for next push
let conversationHistory = [];
let isVoiceInput = false;
let collapsedIds = new Set();

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function truncate(text, len = 50) {
  return text.length > len ? text.slice(0, len) + "…" : text;
}

function formatTime(iso) {
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, "0");
  return `${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function extractPage(url) {
  if (!url) return null;
  const m = url.match(/#page=(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function sourceLabel(url) {
  const page = extractPage(url);
  return page ? `📄 p.${page}` : "📄";
}

function findNode(id, list = nodes) {
  for (const n of list) {
    if (n.id === id) return n;
    const found = findNode(id, n.children);
    if (found) return found;
  }
  return null;
}

// Get ancestor chain for breadcrumb
function getAncestors(id) {
  const path = [];
  let node = findNode(id);
  while (node) {
    path.unshift(node);
    node = node.parentId ? findNode(node.parentId) : null;
  }
  return path;
}

function addNode(text, parentId = null, sourceUrl = "") {
  const node = {
    id: genId(),
    parentId,
    title: truncate(text),
    fullText: text,
    sourceUrl,
    timestamp: new Date().toISOString(),
    children: [],
    chatHistory: []
  };
  if (parentId) {
    const parent = findNode(parentId);
    if (parent) parent.children.push(node);
  } else {
    nodes.unshift(node);
  }
  saveTree();
  renderTree();
  // Ask AI for a one-line title in the background
  generateTitle(node);
  return node;
}

async function generateTitle(node) {
  const cfg = await getConfig();
  if (!cfg.url || !cfg.key) return;
  try {
    const res = await fetch(cfg.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${cfg.key}` },
      body: JSON.stringify({
        model: cfg.model || "gpt-4o-mini",
        messages: [
          { role: "system", content: "Generate a concise one-line title (max 8 words) summarizing this text. Return ONLY the title, nothing else." },
          { role: "user", content: node.fullText }
        ]
      })
    });
    if (!res.ok) return;
    const data = await res.json();
    const title = data.choices?.[0]?.message?.content?.trim();
    if (title) {
      node.title = title.replace(/^["']|["']$/g, ""); // strip quotes if any
      saveTree();
      renderTree();
    }
  } catch {}
}

function removeNode(id, list = nodes) {
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === id) { list.splice(i, 1); saveTree(); renderTree(); return true; }
    if (removeNode(id, list[i].children)) return true;
  }
  return false;
}

// --- Persistence ---

function saveTree() {
  chrome.storage.local.set({ booklogic_tree: nodes, booklogic_collapsed: [...collapsedIds] });
}

function loadTree() {
  chrome.storage.local.get(["booklogic_tree", "booklogic_collapsed"], (data) => {
    nodes = data.booklogic_tree || [];
    collapsedIds = new Set(data.booklogic_collapsed || []);
    renderTree();
  });
}

// --- Tree rendering ---

// Collect all nodes in a subtree
function collectNodes(node, out = []) {
  out.push(node);
  for (const c of node.children) collectNodes(c, out);
  return out;
}

// Sets of nodeIds for last-read highlights (rebuilt each render)
let lastReadIds = new Set();
let prevReadIds = new Set();

function renderTree() {
  treeEl.innerHTML = "";
  // Build last-read and prev-read sets: per root node
  lastReadIds = new Set();
  prevReadIds = new Set();
  for (const root of nodes) {
    const all = collectNodes(root);
    all.sort((a, b) => (b.lastAccessedAt || b.timestamp || "").localeCompare(a.lastAccessedAt || a.timestamp || ""));
    if (all[0]) lastReadIds.add(all[0].id);
    if (all[1]) prevReadIds.add(all[1].id);
  }
  // Show pinned parent indicator
  const indicator = document.getElementById("pin-indicator");
  if (indicator) indicator.remove();
  if (targetParentId) {
    const node = findNode(targetParentId);
    if (node) {
      const bar = document.createElement("div");
      bar.id = "pin-indicator";
      bar.className = "pin-indicator";
      bar.innerHTML = `📌 Next push → child of "<b>${truncate(node.title, 30)}</b>" <button id="unpin-btn">✕ Unpin</button>`;
      treeEl.before(bar);
      document.getElementById("unpin-btn").addEventListener("click", () => {
        targetParentId = null;
        renderTree();
      });
    }
  }
  if (nodes.length === 0) return;
  nodes.forEach(n => treeEl.appendChild(renderNodeEl(n, 0)));
  exportBtn.classList.remove("hidden");
  previewBtn.classList.remove("hidden");
  jsonExportBtn.classList.remove("hidden");
}

function renderNodeEl(node, depth) {
  const wrap = document.createElement("div");
  wrap.className = "tree-node";
  wrap.style.paddingLeft = (depth * 16) + "px";

  const row = document.createElement("div");
  row.className = "tree-row" + (node.id === targetParentId ? " pinned" : "") + (lastReadIds.has(node.id) ? " last-read" : prevReadIds.has(node.id) ? " prev-read" : "");

  const toggle = document.createElement("span");
  toggle.className = "tree-toggle";
  if (node.children.length > 0) {
    const isCollapsed = collapsedIds.has(node.id);
    toggle.textContent = isCollapsed ? "▶" : "▼";
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const childContainer = wrap.querySelector(".tree-children");
      if (childContainer) {
        if (collapsedIds.has(node.id)) { collapsedIds.delete(node.id); } else { collapsedIds.add(node.id); }
        childContainer.classList.toggle("hidden");
        toggle.textContent = collapsedIds.has(node.id) ? "▶" : "▼";
        chrome.storage.local.set({ booklogic_collapsed: [...collapsedIds] });
      }
    });
  } else {
    toggle.textContent = "•";
  }

  const label = document.createElement("span");
  label.className = "tree-label";
  label.textContent = node.title;
  label.title = node.fullText;
  label.addEventListener("click", () => openChat(node.id));

  const ts = document.createElement("span");
  ts.className = "tree-time";
  ts.textContent = formatTime(node.timestamp);

  // 📤 Preview this branch
  const exp = document.createElement("button");
  exp.className = "tree-export";
  exp.textContent = "👁";
  exp.title = "Preview this branch";
  exp.addEventListener("click", (e) => { e.stopPropagation(); showPreview([node]); });

  // 📥 Download this branch
  const dl = document.createElement("button");
  dl.className = "tree-export";
  dl.textContent = "📥";
  dl.title = "Download this branch (Markdown)";
  dl.addEventListener("click", (e) => { e.stopPropagation(); exportBranch(node); });

  // 💾 Export this branch as JSON
  const jsonDl = document.createElement("button");
  jsonDl.className = "tree-export";
  jsonDl.textContent = "💾";
  jsonDl.title = "Export this branch (JSON)";
  jsonDl.addEventListener("click", (e) => { e.stopPropagation(); exportBranchJson(node); });

  // 📌 Pin as parent button
  const pin = document.createElement("button");
  pin.className = "tree-pin";
  pin.textContent = node.id === targetParentId ? "📌" : "🔗";
  pin.title = node.id === targetParentId ? "Unpin" : "Pin as parent for next push";
  pin.addEventListener("click", (e) => {
    e.stopPropagation();
    targetParentId = targetParentId === node.id ? null : node.id;
    renderTree();
  });

  const del = document.createElement("button");
  del.className = "tree-del";
  del.textContent = "✕";
  del.title = "Delete node";
  del.addEventListener("click", (e) => { e.stopPropagation(); removeNode(node.id); });

  row.appendChild(toggle);
  row.appendChild(label);
  row.appendChild(ts);
  if (node.sourceUrl) {
    const src = document.createElement("a");
    src.className = "tree-source";
    src.href = node.sourceUrl;
    src.textContent = sourceLabel(node.sourceUrl);
    src.title = node.sourceUrl;
    src.addEventListener("click", (e) => {
      e.stopPropagation();
      chrome.tabs.create({ url: node.sourceUrl });
    });
    row.appendChild(src);
  }
  row.appendChild(exp);
  row.appendChild(dl);
  row.appendChild(jsonDl);
  row.appendChild(pin);
  row.appendChild(del);
  wrap.appendChild(row);

  if (node.children.length > 0) {
    const childContainer = document.createElement("div");
    childContainer.className = "tree-children" + (collapsedIds.has(node.id) ? " hidden" : "");
    node.children.forEach(c => childContainer.appendChild(renderNodeEl(c, depth + 1)));
    wrap.appendChild(childContainer);
  }

  return wrap;
}

// --- Chat ---

function openChat(nodeId) {
  const node = findNode(nodeId);
  if (!node) return;
  activeNodeId = nodeId;
  node.lastAccessedAt = new Date().toISOString();
  saveTree();
  conversationHistory = node.chatHistory.map(m => ({ role: m.role, content: m.content, timestamp: m.timestamp }));

  // Breadcrumb
  const ancestors = getAncestors(nodeId);
  chatBreadcrumb.textContent = ancestors.map(n => truncate(n.title, 20)).join(" → ");

  chatSnippet.textContent = node.fullText;
  if (node.sourceUrl) {
    const srcLink = document.createElement("a");
    srcLink.className = "snippet-source";
    srcLink.href = node.sourceUrl;
    const page = extractPage(node.sourceUrl);
    const label = page
      ? (node.sourceUrl.length > 50 ? node.sourceUrl.split("#")[0].slice(0, 50) + "…" : node.sourceUrl.split("#")[0]) + ` (p.${page})`
      : (node.sourceUrl.length > 60 ? node.sourceUrl.slice(0, 60) + "…" : node.sourceUrl);
    srcLink.textContent = label;
    srcLink.title = node.sourceUrl;
    srcLink.addEventListener("click", (e) => { e.preventDefault(); chrome.tabs.create({ url: node.sourceUrl }); });
    chatSnippet.appendChild(document.createElement("br"));
    chatSnippet.appendChild(srcLink);
  }
  chatMessages.innerHTML = "";
  node.chatHistory.forEach(m => appendMsg(m.role, m.content, false, m.timestamp));

  treeView.classList.add("hidden");
  chatArea.classList.remove("hidden");
  branchBtn.classList.add("hidden");
  chatInput.focus();
}

document.getElementById("chat-back").addEventListener("click", () => {
  chatArea.classList.add("hidden");
  treeView.classList.remove("hidden");
});

document.getElementById("chat-send").addEventListener("click", sendMessage);
chatInput.addEventListener("keydown", (e) => { if (e.key === "Enter") sendMessage(); });

// --- Voice Input (injected into active tab) ---

const voiceBtn = document.getElementById("voice-btn");

voiceBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "start-voice-in-tab" });
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "push-text") {
    addNode(msg.text, targetParentId, msg.sourceUrl || "");
    if (targetParentId) { targetParentId = null; renderTree(); }
  }
  if (msg.type === "voice-final") {
    chatInput.value = msg.text;
    isVoiceInput = true;
    sendMessage();
  }
});

// Show branch button when user selects text in chat messages
chatMessages.addEventListener("mouseup", () => {
  const sel = window.getSelection().toString().trim();
  if (sel.length > 0) {
    branchBtn.classList.remove("hidden");
  } else {
    branchBtn.classList.add("hidden");
  }
});

branchBtn.addEventListener("click", () => {
  const sel = window.getSelection().toString().trim();
  if (!sel || !activeNodeId) return;
  const child = addNode(sel, activeNodeId);
  branchBtn.classList.add("hidden");
  window.getSelection().removeAllRanges();
  // Switch to the new child node's chat
  openChat(child.id);
});

async function sendMessage() {
  const question = chatInput.value.trim();
  if (!question) return;

  appendMsg("user", question);
  chatInput.value = "";

  const cfg = await getConfig();
  if (!cfg.url || !cfg.key) {
    appendMsg("assistant", "⚠️ Please configure your LLM API in settings first.");
    return;
  }

  const node = findNode(activeNodeId);
  conversationHistory.push({ role: "user", content: question, timestamp: new Date().toISOString() });

  // Build context from ancestor chain
  const ancestors = getAncestors(activeNodeId);
  const contextChain = ancestors.map(n => `"${truncate(n.fullText, 200)}"`).join(" → ");
  const systemPrompt = `You are a study assistant. The user is exploring a chain of concepts from a PDF:\n\nExploration path: ${contextChain}\n\nCurrent focus:\n"${node.fullText}"\n\nAnswer their questions concisely.`
    + (isVoiceInput ? ` The user's message was voice-transcribed; silently accommodate any possible speech artifacts without mentioning them.` : "");
  isVoiceInput = false;

  try {
    // Show thinking indicator
    const thinkingEl = document.createElement("div");
    thinkingEl.className = "msg msg-thinking";
    thinkingEl.innerHTML = '<span class="thinking-dots">Thinking</span>';
    chatMessages.appendChild(thinkingEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const res = await fetch(cfg.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${cfg.key}`
      },
      body: JSON.stringify({
        model: cfg.model || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory
        ]
      })
    });

    thinkingEl.remove();

    if (!res.ok) {
      const err = await res.text();
      appendMsg("assistant", `⚠️ API error ${res.status}: ${err}`);
      return;
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "(empty response)";
    conversationHistory.push({ role: "assistant", content: reply, timestamp: new Date().toISOString() });
    appendMsg("assistant", reply);

    // Persist chat history to node
    node.chatHistory = conversationHistory.map(m => ({ ...m }));
    saveTree();
  } catch (e) {
    const leftover = chatMessages.querySelector(".msg-thinking");
    if (leftover) leftover.remove();
    appendMsg("assistant", `⚠️ Request failed: ${e.message}`);
  }
}

// --- Rendering ---

function renderContent(text) {
  const blocks = [];
  let i = 0;
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, tex) => {
    const id = `%%BLOCK${i}%%`;
    try { blocks[i] = katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false }); } catch { blocks[i] = tex; }
    i++; return id;
  });
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, tex) => {
    const id = `%%BLOCK${i}%%`;
    try { blocks[i] = katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false }); } catch { blocks[i] = tex; }
    i++; return id;
  });
  text = text.replace(/\\\((.*?)\\\)/g, (_, tex) => {
    const id = `%%BLOCK${i}%%`;
    try { blocks[i] = katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false }); } catch { blocks[i] = tex; }
    i++; return id;
  });
  text = text.replace(/(?<!\$)\$(?!\$)([^\n$]+?)\$(?!\$)/g, (_, tex) => {
    const id = `%%BLOCK${i}%%`;
    try { blocks[i] = katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false }); } catch { blocks[i] = tex; }
    i++; return id;
  });
  let html = marked.parse(text);
  for (let j = 0; j < blocks.length; j++) html = html.replace(`%%BLOCK${j}%%`, blocks[j]);
  return html;
}

function appendMsg(role, content, scroll = true, timestamp = null) {
  const div = document.createElement("div");
  div.className = `msg msg-${role}`;
  const ts = document.createElement("span");
  ts.className = "msg-time";
  ts.textContent = formatTime(timestamp || new Date().toISOString());
  if (role === "assistant") {
    div.innerHTML = renderContent(content);
  } else {
    div.textContent = content;
  }
  div.appendChild(ts);
  chatMessages.appendChild(div);
  if (scroll) chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["booklogic_api"], (data) => resolve(data.booklogic_api || {}));
  });
}

// --- Settings ---

document.getElementById("settings-btn").addEventListener("click", () => settingsEl.classList.toggle("hidden"));

const PRESETS = {
  dashscope: { url: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", model: "qwen-plus" },
  openai: { url: "https://api.openai.com/v1/chat/completions", model: "gpt-4o-mini" }
};

document.getElementById("api-preset").addEventListener("change", (e) => {
  const p = PRESETS[e.target.value];
  if (p) { document.getElementById("api-url").value = p.url; document.getElementById("api-model").value = p.model; }
});

chrome.storage.local.get(["booklogic_api"], (data) => {
  const cfg = data.booklogic_api || {};
  document.getElementById("api-url").value = cfg.url || "";
  document.getElementById("api-key").value = cfg.key || "";
  document.getElementById("api-model").value = cfg.model || "";
});

document.getElementById("save-settings").addEventListener("click", () => {
  const cfg = {
    url: document.getElementById("api-url").value.trim(),
    key: document.getElementById("api-key").value.trim(),
    model: document.getElementById("api-model").value.trim()
  };
  chrome.storage.local.set({ booklogic_api: cfg }, () => {
    statusEl.textContent = "✓ Saved";
    setTimeout(() => (statusEl.textContent = ""), 2000);
  });
});

// --- PDF localhost opener ---
const pdfPortEl = document.getElementById("pdf-port");
const pdfFilenameEl = document.getElementById("pdf-filename");
chrome.storage.local.get(["booklogic_pdf_port"], (d) => {
  if (d.booklogic_pdf_port) pdfPortEl.value = d.booklogic_pdf_port;
});
pdfPortEl.addEventListener("change", () => {
  chrome.storage.local.set({ booklogic_pdf_port: pdfPortEl.value.trim() });
});
document.getElementById("pdf-open-btn").addEventListener("click", () => {
  const port = pdfPortEl.value.trim() || "8000";
  const file = pdfFilenameEl.value.trim();
  if (!file) { statusEl.textContent = "Enter a filename"; setTimeout(() => (statusEl.textContent = ""), 2000); return; }
  chrome.tabs.create({ url: `http://localhost:${port}/${file}` });
});

// --- Message listener ---

// --- Init ---
loadTree();

// --- Export ---

const exportBtn = document.getElementById("export-btn");
exportBtn.addEventListener("click", exportMarkdown);

const previewBtn = document.getElementById("preview-btn");
previewBtn.addEventListener("click", () => showPreview(nodes));

document.getElementById("preview-back").addEventListener("click", () => {
  document.getElementById("preview-area").classList.add("hidden");
  treeView.classList.remove("hidden");
});

const jsonExportBtn = document.getElementById("json-export-btn");
jsonExportBtn.addEventListener("click", exportAllJson);

const jsonImportFile = document.getElementById("json-import-file");
document.getElementById("json-import-btn").addEventListener("click", () => jsonImportFile.click());
jsonImportFile.addEventListener("change", (e) => {
  if (e.target.files[0]) { importJson(e.target.files[0]); e.target.value = ""; }
});

// Init mermaid
mermaid.initialize({ startOnLoad: false, theme: "default" });

async function showPreview(rootNodes) {
  const md = buildExportMd(rootNodes);
  const previewArea = document.getElementById("preview-area");
  const previewContent = document.getElementById("preview-content");

  // Render markdown (skip mermaid code blocks, handle them separately)
  let mermaidCode = "";
  const mdWithoutMermaid = md.replace(/```mermaid\n([\s\S]*?)```/g, (_, code) => {
    mermaidCode = code;
    return "%%MERMAID%%";
  });

  let html = renderContent(mdWithoutMermaid);

  // Render mermaid chart
  if (mermaidCode) {
    try {
      const { svg } = await mermaid.render("mermaid-preview", mermaidCode);
      html = html.replace("%%MERMAID%%", `<div class="mermaid-chart">${svg}</div>`);
    } catch {
      html = html.replace("%%MERMAID%%", `<pre>${mermaidCode}</pre>`);
    }
  }

  previewContent.innerHTML = html;
  treeView.classList.add("hidden");
  chatArea.classList.add("hidden");
  previewArea.classList.remove("hidden");
}

function exportMarkdown() {
  if (nodes.length === 0) return;
  const date = new Date().toISOString().slice(0, 10);
  downloadFile(`libreintel-export-${date}.md`, buildExportMd(nodes));
}

function exportBranch(node) {
  const date = new Date().toISOString().slice(0, 10);
  downloadFile(`libreintel-${node.id}-${date}.md`, buildExportMd([node]));
}

function exportBranchJson(node) {
  const date = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify([node], null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `libreintel-${node.id}-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportAllJson() {
  const date = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(nodes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `libreintel-export-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!Array.isArray(imported)) throw new Error("Invalid format");
      // Append imported trees as new root nodes
      nodes.push(...imported);
      saveTree();
      renderTree();
    } catch (e) {
      alert("Import failed: " + e.message);
    }
  };
  reader.readAsText(file);
}

function buildExportMd(rootNodes) {
  const date = new Date().toISOString().slice(0, 10);
  let md = `# LibreIntel Export — ${date}\n\n`;

  md += "```mermaid\nflowchart TD\n";
  const allNodes = [];
  flattenNodes(rootNodes, allNodes);
  allNodes.forEach(n => {
    const label = escapeMermaid(n.title);
    const time = formatTime(n.timestamp);
    md += `  ${n.id}["${label}<br/><i>${time}</i>"]\n`;
  });
  allNodes.forEach(n => {
    n.children.forEach(c => { md += `  ${n.id} --> ${c.id}\n`; });
  });
  md += "```\n\n---\n\n";

  md += "## Detailed Notes\n\n";
  rootNodes.forEach(n => { md += renderNodeMd(n, 2); });
  return md;
}

function flattenNodes(list, out) {
  list.forEach(n => { out.push(n); flattenNodes(n.children, out); });
}

function renderNodeMd(node, headingLevel) {
  const h = "#".repeat(Math.min(headingLevel, 6));
  let md = `${h} ${node.title}\n`;
  md += `> ${node.fullText.replace(/\n/g, "\n> ")}\n`;
  md += `> *${formatTime(node.timestamp)}*`;
  if (node.sourceUrl) {
    const page = extractPage(node.sourceUrl);
    md += page ? ` | [Source p.${page}](${node.sourceUrl})` : ` | [Source](${node.sourceUrl})`;
  }
  md += `\n\n`;

  if (node.chatHistory.length > 0) {
    node.chatHistory.forEach(m => {
      if (m.role === "user") {
        md += `**Q:** ${m.content} *(${formatTime(m.timestamp)})*\n\n`;
      } else {
        md += `**A:** ${m.content}\n\n`;
      }
    });
  }

  node.children.forEach(c => { md += renderNodeMd(c, headingLevel + 1); });
  return md;
}

function escapeMermaid(text) {
  return text.replace(/"/g, "'").replace(/[[\](){}]/g, " ").replace(/\n/g, " ");
}

function downloadFile(filename, content) {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
