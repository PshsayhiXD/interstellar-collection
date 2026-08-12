function chatTimestamp() {
  const chatContent = document.querySelector("#chat-content");
  if (!chatContent) return;
  const styleId = "chat-timestamp-style";

  const formatExact = date =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

  const formatRelative = date => {
    const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    if (seconds < 1) return "now";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const stampMessage = node => {
    if (node.querySelector(":scope > .chat-timestamp")) return;
    const el = document.createElement("span");
    el.className = "chat-timestamp";
    el.dataset.time = String(Date.now());
    node.appendChild(el);
  };

  const updateBadge = messageNode => {
    const badge = messageNode.querySelector(":scope > .chat-timestamp");
    if (!badge) return;
    const time = new Date(Number(badge.dataset.time));
    badge.textContent = `${formatRelative(time)} · ${formatExact(time)}`;
  };

  if (!document.querySelector(`#${styleId}`)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .chat-message {
        position: relative;
      }
      .chat-timestamp {
        position: absolute;
        bottom: 2px;
        right: 15%;
        padding: 1px 5px;
        border-radius: 3px;
        background: rgba(0, 0, 0, 0.6);
        color: #ccc;
        font-size: 11px;
        line-height: 1.4;
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.15s ease;
      }
      .chat-message:hover .chat-timestamp {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
  }

  chatContent.querySelectorAll(".chat-message").forEach(stampMessage);
  chatContent.addEventListener("mouseover", event => {
    const messageNode = event.target.closest(".chat-message");
    if (messageNode && chatContent.contains(messageNode)) {
      updateBadge(messageNode);
    }
  });

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE && node.matches(".chat-message")) {
          stampMessage(node);
        }
      }
    }
  });
  observer.observe(chatContent, { childList: true });
}

exports.chatTimestamp = chatTimestamp;