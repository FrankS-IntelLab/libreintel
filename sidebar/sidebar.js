const itemsEl = document.getElementById("items");
const settingsEl = document.getElementById("settings");
const chatArea = document.getElementById("chat-area");
const chatMessages = document.getElementById("chat-messages");
const chatSnippet = document.getElementById("chat-snippet");
const chatInput = document.getElementById("chat-input");
const statusEl = document.getElementById("settings-status");

let activeSnippet = "";
let conversationHistory = [];

// --- Settings ---

document.getElementById("settings-btn").addEventListener("click", () => {
  settingsEl.classList.toggle("hidden");
});

// Presets
const PRESETS = {
  dashscope: { url: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", model: "qwen-plus" },
  openai: { url: "https://api.openai.com/v1/chat/completions", model: "gpt-4o-mini" }
};

document.getElementById("api-preset").addEventListener("change", (e) => {
  const p = PRESETS[e.target.value];
  if (p) {
    document.getElementById("api-url").value = p.url;
    document.getElementById("api-model").value = p.model;
  }
});

// Load saved settings
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

// --- Items ---

function addItem(text) {
  const div = document.createElement("div");
  div.className = "item";

  const p = document.createElement("p");
  p.textContent = text;

  const btn = document.createElement("button");
  btn.className = "ask-btn";
  btn.textContent = "Ask AI";
  btn.addEventListener("click", () => openChat(text));

  div.appendChild(p);
  div.appendChild(btn);
  itemsEl.prepend(div);
}

// --- Chat ---

function openChat(snippet) {
  activeSnippet = snippet;
  conversationHistory = [];
  chatSnippet.textContent = snippet;
  chatMessages.innerHTML = "";
  itemsEl.classList.add("hidden");
  document.querySelector(".hint").classList.add("hidden");
  chatArea.classList.remove("hidden");
  chatInput.focus();
}

document.getElementById("chat-back").addEventListener("click", () => {
  chatArea.classList.add("hidden");
  itemsEl.classList.remove("hidden");
  document.querySelector(".hint").classList.remove("hidden");
});

document.getElementById("chat-send").addEventListener("click", sendMessage);
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
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

  conversationHistory.push({ role: "user", content: question });

  const systemPrompt = `You are a study assistant. The user selected this text from a PDF:\n\n"${activeSnippet}"\n\nAnswer their questions about it concisely.`;

  try {
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

    if (!res.ok) {
      const err = await res.text();
      appendMsg("assistant", `⚠️ API error ${res.status}: ${err}`);
      return;
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "(empty response)";
    conversationHistory.push({ role: "assistant", content: reply });
    appendMsg("assistant", reply);
  } catch (e) {
    appendMsg("assistant", `⚠️ Request failed: ${e.message}`);
  }
}

function renderContent(text) {
  // Replace LaTeX delimiters with placeholders BEFORE markdown parsing
  // so marked doesn't eat the backslashes
  const blocks = [];
  let i = 0;

  // Block math: \[ ... \] and $$ ... $$
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, tex) => {
    const id = `%%BLOCK${i}%%`;
    try { blocks[i] = katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false }); }
    catch { blocks[i] = tex; }
    i++;
    return id;
  });
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, tex) => {
    const id = `%%BLOCK${i}%%`;
    try { blocks[i] = katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false }); }
    catch { blocks[i] = tex; }
    i++;
    return id;
  });

  // Inline math: \( ... \) and $ ... $
  text = text.replace(/\\\((.*?)\\\)/g, (_, tex) => {
    const id = `%%BLOCK${i}%%`;
    try { blocks[i] = katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false }); }
    catch { blocks[i] = tex; }
    i++;
    return id;
  });
  text = text.replace(/(?<!\$)\$(?!\$)([^\n$]+?)\$(?!\$)/g, (_, tex) => {
    const id = `%%BLOCK${i}%%`;
    try { blocks[i] = katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false }); }
    catch { blocks[i] = tex; }
    i++;
    return id;
  });

  // Now parse markdown (placeholders survive since they're plain text)
  let html = marked.parse(text);

  // Restore KaTeX rendered HTML
  for (let j = 0; j < blocks.length; j++) {
    html = html.replace(`%%BLOCK${j}%%`, blocks[j]);
  }

  return html;
}

function appendMsg(role, content) {
  const div = document.createElement("div");
  div.className = `msg msg-${role}`;
  if (role === "assistant") {
    div.innerHTML = renderContent(content);
  } else {
    div.textContent = content;
  }
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["booklogic_api"], (data) => {
      resolve(data.booklogic_api || {});
    });
  });
}

// --- Message listener ---

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "push-text") {
    addItem(msg.text);
  }
});
