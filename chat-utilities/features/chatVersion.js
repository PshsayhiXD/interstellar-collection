const { getChatElements, markInitialized, injectStyle, onChatStateChange, isChatClosed } = require("../chatCore");
const { _VERSION } = require("../update");

function chatVersion() {
  const els = getChatElements();
  if (!els) return;
  const { chatBox } = els;
  if (markInitialized(chatBox, "version")) return;
  const close = chatBox.querySelector(".close");
  const closeButton = close?.querySelector("#chat-close");
  if (!close || !closeButton) return;
  const version = document.createElement("span");
  version.className = "chat-version";
  version.textContent = `Chat utilities v${_VERSION}`;
  close.insertBefore(version, closeButton);
  const updateVisibility = () => {
    version.hidden = isChatClosed(chatBox);
  };
  updateVisibility();
  onChatStateChange(chatBox, updateVisibility);
  injectStyle(
    "chat-version-style",
    `.chat-version {
      margin-right: 6px;
      color: #888;
      font-size: 10px;
      line-height: 1;
      user-select: none;
    }
    .chat-version[hidden] {
      display: none;
    }
    .chat-version + #chat-close {
      vertical-align: middle;
    }`
  );
}

exports.chatVersion = chatVersion;