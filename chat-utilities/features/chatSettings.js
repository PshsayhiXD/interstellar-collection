const { getChatElements, markInitialized, injectStyle, onNewMessages, isWarningMessage } = require("../chatCore");

function chatSettings() {
  const els = getChatElements();
  if (!els) return;
  const { chatBox, chatContent } = els;
  if (markInitialized(chatBox, "settings")) return;
  const messages = document.querySelector("#opt_chat_messages");
  const bubbles = document.querySelector("#opt_chat_bubbles");
  const input = document.querySelector("#chat-input");
  const send = document.querySelector("#chat-send");
  const translate = [...chatBox.querySelectorAll("button")].find(button => button.textContent.trim() === "Translate All");
  if (!messages || !bubbles || !input || !send || !translate) return;
  const footer = messages.closest('div[style*="float:right"]');
  if (!footer) return;
  const settings = document.createElement("div");
  settings.className = "chat-settings";
  const button = document.createElement("button");
  button.className = "chat-settings-button";
  button.type = "button";
  button.title = "Chat settings";
  button.textContent = "⚙";
  const menu = document.createElement("div");
  menu.className = "chat-settings-menu";
  const title = document.createElement("div");
  title.className = "chat-settings-title";
  title.textContent = "Chat Settings";
  const warning = document.createElement("input");
  warning.type = "checkbox";
  warning.checked = true;
  const createOption = (input, label) => {
    const option = document.createElement("label");
    option.className = "chat-settings-option";
    option.append(input, document.createTextNode(label));
    return option;
  };
  menu.append(
    title,
    createOption(messages, "Hide Messages"),
    createOption(bubbles, "Hide Bubbles"),
    createOption(warning, "Show Warning")
  );
  settings.append(button, menu);
  footer.remove();
  const controls = document.createElement("div");
  controls.className = "chat-controls";
  chatBox.insertBefore(controls, input);
  controls.append(input, send, translate, settings);
  const updateWarnings = messageList => {
    messageList.forEach(message => {
      if (isWarningMessage(message)) message.classList.toggle("chat-warning-hidden", !warning.checked);
    });
  };
  updateWarnings([...chatContent.querySelectorAll(".chat-message")]);
  onNewMessages(chatContent, updateWarnings);
  warning.addEventListener("change", () => {
    updateWarnings([...chatContent.querySelectorAll(".chat-message")]);
  });
  button.addEventListener("click", event => {
    event.stopPropagation();
    settings.classList.toggle("is-open");
  });
  document.addEventListener("click", event => {
    if (!settings.contains(event.target)) settings.classList.remove("is-open");
  });
  injectStyle(
    "chat-settings-style",
    `.chat-controls {
      display: flex;
      align-items: center;
      gap: 4px;
      width: 100%;
      margin-top: 4px;
    }
    .chat-controls #chat-input {
      flex: 1 1 auto;
      min-width: 0;
    }
    .chat-settings {
      position: relative;
      display: inline-flex;
      flex: 0 0 auto;
      margin-left: auto;
    }
    .chat-settings-button {
      width: 28px;
      height: 28px;
      padding: 0;
      border: 0;
      border-radius: 4px;
      background: transparent;
      color: inherit;
      font-size: 16px;
      line-height: 28px;
      cursor: pointer;
    }
    .chat-settings-button:hover {
      background: rgba(255, 255, 255, 0.08);
    }
    .chat-settings-menu {
      position: absolute;
      right: 0;
      bottom: calc(100% + 6px);
      z-index: 1000;
      display: none;
      min-width: 150px;
      padding: 8px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 6px;
      background: #181818;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
    }
    .chat-settings.is-open .chat-settings-menu {
      display: block;
    }
    .chat-settings-title {
      margin-bottom: 6px;
      color: #aaa;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .chat-settings-option {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 2px;
      font-size: 12px;
      white-space: nowrap;
      cursor: pointer;
    }
    .chat-settings-option input {
      margin: 0;
    }
    .chat-warning-hidden {
      display: none !important;
    }`
  );
}

exports.chatSettings = chatSettings;