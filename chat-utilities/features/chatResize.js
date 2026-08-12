function chatResize() {
  const chatBox = document.querySelector("#chat");
  const chatContent = document.querySelector("#chat-content");
  if (!chatBox || !chatContent) return;
  chatContent.style.setProperty("height", "120px", "important");

  const chatStyleId = "chat-resize-style";
  let yStart = 0;
  let chatHeight = chatContent.getBoundingClientRect().height;
  let movingMessage = false;
  let scrollRaf = null;

  const chatExpand = document.createElement("div");
  chatExpand.textContent = "⋯";
  chatExpand.className = "chat-expand";
  chatExpand.style.cssText =
    "cursor: ns-resize; user-select: none; text-align: center; height: 10px; line-height: 10px;";
  
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
  const notifyMessagesAdded = count => {
    if (window.__chatAutoScrollHandleNewMessages && !chatBox.classList.contains("closed")) {
      window.__chatAutoScrollHandleNewMessages(count);
    }
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
    let addedCount = 0;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE || !node.matches(".chat-message")) continue;
        addedCount++;
        if (node.parentElement === chatContent && node !== chatContent.lastElementChild) {
          (frag ||= document.createDocumentFragment()).appendChild(node);
        }
      }
    }
    if (frag) {
      movingMessage = true;
      chatContent.appendChild(frag);
      movingMessage = false;
    }
    if (addedCount > 0) notifyMessagesAdded(addedCount);
  };
  const handleChatStateChange = () => {
    updateExpandVisibility();
    applyChatMaxHeight();
    if (!chatBox.classList.contains("closed")) notifyChatOpened();
  };
  if (!document.querySelector(`#${chatStyleId}`)) {
    const style = document.createElement("style");
    style.id = chatStyleId;
    style.textContent = `
      #chat-content {
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
      }
    `;
    document.head.appendChild(style);
  }
  chatExpand.addEventListener("mousedown", startResize);
  chatBox.style.setProperty("--chat-max-height", "none");
  applyChatMaxHeight();

  new MutationObserver(updateMessageOrder).observe(chatContent, {
    childList: true
  });
  new MutationObserver(handleChatStateChange).observe(chatBox, {
    attributes: true,
    attributeFilter: ["class"]
  });

  chatBox.prepend(chatExpand);
  setChatHeight(chatHeight);
  scrollChatToBottom();
  updateExpandVisibility();
}

exports.chatResize = chatResize;