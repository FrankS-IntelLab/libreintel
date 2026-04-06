// Open side panel on extension icon click
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Context menu for PDF pages (and any page) where content script can't reach
chrome.contextMenus.create({
  id: "booklogic-push",
  title: 'Push "%s" to Panel',
  contexts: ["selection"]
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "booklogic-push" && info.selectionText) {
    chrome.runtime.sendMessage({ type: "push-text", text: info.selectionText });
  }
});

// Also relay messages from content script popup (works on non-PDF pages)
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "push-text") {
    // Re-broadcast so sidebar picks it up
    chrome.runtime.sendMessage(msg).catch(() => {});
  }
});
