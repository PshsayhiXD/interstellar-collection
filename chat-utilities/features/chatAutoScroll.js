const {
  getChatElements,
  markInitialized,
  injectStyle,
  onNewMessages,
  onChatStateChange
} = require("../chatCore");

function chatAutoScroll() {
  const els = getChatElements();
  if (!els) return;
  const { chatBox, chatContent } = els;
  if (markInitialized(chatContent, "autoScroll")) return;
  const styleId = "chat-autoscroll-style";
  const BOTTOM_THRESHOLD = 40;
  let isPinned = true;
  let unreadCount = 0;
  let scrollRaf = null;
  const distanceFromBottom = () =>
    chatContent.scrollHeight - chatContent.scrollTop - chatContent.clientHeight;
  const scrollToBottomNow = () => {
    if (scrollRaf !== null) return;
    scrollRaf = requestAnimationFrame(() => {
      chatContent.scrollTop = chatContent.scrollHeight;
      scrollRaf = null;
    });
  };
  const updatePill = () => {
    pill.textContent = unreadCount > 0
      ? `↓ ${unreadCount} new message${unreadCount === 1 ? "" : "s"}`
      : "↓";
    pill.style.display = isPinned ? "none" : "flex";
  };
  const setPinned = pinned => {
    isPinned = pinned;
    if (isPinned) unreadCount = 0;
    updatePill();
  };
  const handleScroll = () => {
    setPinned(distanceFromBottom() <= BOTTOM_THRESHOLD);
  };
  const jumpToLatest = () => {
    scrollToBottomNow();
    setPinned(true);
  };
  const handleNewMessages = messages => {
    if (!messages.length) return;
    if (isPinned) {
      scrollToBottomNow();
    } else {
      unreadCount += messages.length;
      updatePill();
    }
  };
  const handleChatStateChange = () => {
    if (chatBox.classList.contains("closed")) return;
    setPinned(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        chatContent.scrollTop = chatContent.scrollHeight;
      });
    });
  };
  injectStyle(
    styleId,
    `.chat-jump-latest {
      display: none;
      position: absolute;
      bottom: 34px;
      left: 50%;
      transform: translateX(-50%);
      align-items: center;
      gap: 4px;
      padding: 3px 10px;
      border-radius: 999px;
      background: rgba(30, 30, 40, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.25);
      color: #ddd;
      font-size: 11px;
      cursor: pointer;
      z-index: 5;
      white-space: nowrap;
    }
    .chat-jump-latest:hover {
      background: rgba(50, 50, 65, 0.95);
      border-color: rgba(120, 180, 255, 0.6);
    }
    #chat.closed .chat-jump-latest {
      display: none !important;
    }`
  );
  const pill = document.createElement("div");
  pill.className = "chat-jump-latest";
  pill.addEventListener("click", jumpToLatest);
  chatBox.appendChild(pill);
  chatContent.addEventListener("scroll", handleScroll, { passive: true });
  onNewMessages(chatContent, handleNewMessages);
  onChatStateChange(chatBox, handleChatStateChange);
  updatePill();
}

exports.chatAutoScroll = chatAutoScroll;