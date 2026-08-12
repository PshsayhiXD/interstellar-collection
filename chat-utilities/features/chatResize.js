const { getChatElements, injectStyle, onNewMessages, onChatStateChange } = require("../chatCore");

function chatResize() {
  const els = getChatElements();
  if (!els) return;
  const { chatBox, chatContent } = els;
  chatContent.style.setProperty("height", "120px", "important");
  const chatStyleId = "chat-resize-style";
  let yStart = 0;
  let chatHeight = chatContent.getBoundingClientRect().height;
  let movingMessage = false;
  let scrollRaf = null;
  const chatExpand = document.createElement("div");
  chatExpand.textContent = "⋯";
  chatExpand.className = "chat-expand";
  chatExpand.style.cssText = "cursor: ns-resize; user-select: none; text-align: center; height: 10px; line-height: 10px;";
  const setChatHeight = height => {
    chatHeight = Math.max(0, height);
    chatContent.style.setProperty("height", `${chatHeight}px`, "important");
  };
  const scrollChatToBottom = () => {
    if (scrollRaf !== null) return;
    scrollRaf = requestAnimationFrame(() => {
      chatContent.scrollTop = Math.max(0, chatContent.scrollHeight - chatContent.clientHeight);
      scrollRaf = null;
    });
  };
  const notifyChatOpened = () => {
    if (window.__chatAutoScrollHandleChatOpened) {
      window.__chatAutoScrollHandleChatOpened();
    } else {
      scrollChatToBottom();
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollChatToBottom();
      });
    });
  };
  const updateExpandVisibility = () => {
    chatExpand.style.display = chatBox.classList.contains("closed") ? "none" : "";
  };
  const applyChatMaxHeight = () => {
    chatBox.style.setProperty("max-height", "none", "important");
    chatContent.style.setProperty("height", `${chatHeight}px`, "important");
  };
  const resizeChatEvent = event => {
    event.preventDefault();
    setChatHeight(chatHeight + yStart - event.clientY);
    yStart = event.clientY;
    scrollChatToBottom();
  };
  const stopResize = () => {
    chatBox.classList.remove("resizing");
    document.removeEventListener("mousemove", resizeChatEvent);
  };
  const startResize = event => {
    yStart = event.clientY;
    chatHeight = chatContent.getBoundingClientRect().height;
    chatBox.classList.add("resizing");
    document.addEventListener("mousemove", resizeChatEvent);
    document.addEventListener("mouseup", stopResize, { once: true });
  };
  const updateMessageOrder = mutations => {
    if (movingMessage) return;
    let frag = null;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE || !node.matches(".chat-message")) continue;
        if (node.parentElement === chatContent && node !== chatContent.lastElementChild) {
          (frag ||= document.createDocumentFragment()).appendChild(node);
        }
      }
    }
    if (!frag) return;
    movingMessage = true;
    chatContent.appendChild(frag);
    movingMessage = false;
  };
  const handleChatStateChange = () => {
    updateExpandVisibility();
    applyChatMaxHeight();
    if (!chatBox.classList.contains("closed")) notifyChatOpened();
  };
  injectStyle(
    chatStyleId,
    `#chat-content {
      display: flex !important;
      flex-direction: column !important;
      overflow-y: auto !important;
      min-height: 0 !important;
      max-height: none !important;
    }
    #chat-content > .chat-message {
      flex: 0 0 auto;
    }
    #chat-content::before {
      content: "";
      margin-top: auto;
    }`
  );
  chatExpand.addEventListener("mousedown", startResize);
  chatBox.style.setProperty("--chat-max-height", "none");
  applyChatMaxHeight();
  new MutationObserver(updateMessageOrder).observe(chatContent, { childList: true });
  onNewMessages(chatContent, messages => {
    if (!messages.length || chatBox.classList.contains("closed")) return;
    if (window.__chatAutoScrollHandleNewMessages) {
      window.__chatAutoScrollHandleNewMessages(messages.length);
    }
  });
  onChatStateChange(chatBox, handleChatStateChange);
  chatBox.prepend(chatExpand);
  setChatHeight(chatHeight);
  scrollChatToBottom();
  updateExpandVisibility();
}

exports.chatResize = chatResize;