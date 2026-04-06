chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

chrome.contextMenus.create({
  id: "booklogic-push",
  title: 'Push "%s" to Panel',
  contexts: ["selection"]
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "booklogic-push" && info.selectionText) {
    chrome.runtime.sendMessage({ type: "push-text", text: info.selectionText, sourceUrl: info.pageUrl || "" }).catch(() => {});
  }
});

// Hotkey: Ctrl+1 triggers voice input
chrome.commands.onCommand.addListener((command) => {
  if (command === "voice-input") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return;
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: runSpeechRecognition
      });
    });
  }
});

// Relay messages to sidebar
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "push-text") {
    chrome.runtime.sendMessage(msg).catch(() => {});
  }
});

// Inject speech recognition into the active tab
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "start-voice-in-tab") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return;
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: runSpeechRecognition
      });
    });
  }
});

// This function runs inside the web page tab
function runSpeechRecognition() {
  // Remove any existing voice overlay
  const existing = document.getElementById("booklogic-voice-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "booklogic-voice-overlay";
  overlay.innerHTML = `
    <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.3);z-index:2147483646;display:flex;align-items:center;justify-content:center;">
      <div style="background:#fff;border-radius:12px;padding:24px;width:340px;font-family:-apple-system,sans-serif;box-shadow:0 4px 24px rgba(0,0,0,0.2);">
        <div id="bl-voice-status" style="text-align:center;font-size:16px;margin-bottom:12px;color:#e53935;">🎤 Listening...</div>
        <div id="bl-voice-text" style="min-height:50px;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px;margin-bottom:12px;background:#fafafa;word-break:break-word;"></div>
        <div style="display:flex;gap:8px;justify-content:center;">
          <button id="bl-voice-send" style="padding:8px 20px;background:#1a73e8;color:#fff;border:none;border-radius:6px;font-size:14px;cursor:pointer;">Send</button>
          <button id="bl-voice-cancel" style="padding:8px 20px;background:#eee;color:#333;border:none;border-radius:6px;font-size:14px;cursor:pointer;">Cancel</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const statusEl = overlay.querySelector("#bl-voice-status");
  const textEl = overlay.querySelector("#bl-voice-text");
  let finalTranscript = "";

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    statusEl.textContent = "❌ Not supported in this browser";
    return;
  }

  const recognition = new SR();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript;
      else interim += e.results[i][0].transcript;
    }
    textEl.textContent = finalTranscript + interim;
  };

  recognition.onerror = (e) => {
    statusEl.textContent = "❌ " + e.error;
  };

  recognition.onend = () => {
    statusEl.textContent = "⏸ Stopped";
  };

  recognition.start();

  overlay.querySelector("#bl-voice-send").addEventListener("click", () => {
    recognition.stop();
    const text = textEl.textContent.trim();
    if (text) chrome.runtime.sendMessage({ type: "voice-final", text });
    overlay.remove();
  });

  overlay.querySelector("#bl-voice-cancel").addEventListener("click", () => {
    recognition.stop();
    overlay.remove();
  });
}
