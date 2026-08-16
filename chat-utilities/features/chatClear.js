const { getChatElements, markInitialized, onChatStateChange, isChatClosed } = require("../chatCore");

function chatClear() {
  const els = getChatElements();
  if (!els) return;
  const { chatBox, chatContent } = els;
  if (markInitialized(chatBox, "clear")) return;
  const close = chatBox.querySelector(".close");
  const closeButton = close?.querySelector("#chat-close");
  if (!close || !closeButton) return;
  const clearButton = document.createElement("button");
  clearButton.id = "chat-clear";
  clearButton.className = "btn-orange btn-small";
  clearButton.type = "button";
  clearButton.textContent = "Clear";
  clearButton.addEventListener("click", () => {
    chatContent.querySelectorAll(".chat-message").forEach(message => message.remove());
  });
  close.insertBefore(clearButton, closeButton);
  const updateVisibility = () => {
    clearButton.hidden = isChatClosed(chatBox);
  };
  updateVisibility();
  onChatStateChange(chatBox, updateVisibility);
}

exports.chatClear = chatClear;