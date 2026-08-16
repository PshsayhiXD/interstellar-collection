const { getChatElements, markInitialized, injectStyle, onNewMessages, copyToClipboard } = require("../chatCore");

function chatTimestamp() {
  const els = getChatElements();
  if (!els) return;
  const { chatContent } = els;
  if (markInitialized(chatContent, "timestamp")) return;
  const styleId = "chat-timestamp-style";
  let hoveredMessage = null;
  let timer = null;
  const modes = ["relative", "exact", "both"];
  let mode = 2;
  const formatExact = date =>
    `${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })} ${formatOffset(date)}`;
  const formatOffset = date => {
    const offset = -date.getTimezoneOffset();
    const sign = offset >= 0 ? "+" : "-";
    const hours = Math.floor(Math.abs(offset) / 60);
    const minutes = Math.abs(offset) % 60;
    return `UTC${sign}${hours}${minutes ? `:${String(minutes).padStart(2, "0")}` : ""}`;
  };
  const formatRelative = date => {
    const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    if (seconds < 1) return "now";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s ago`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours < 24) return `${hours}h ${remainingMinutes}m ago`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h ago`;
  };
  const stampMessage = node => {
    if (node.querySelector(":scope > .chat-timestamp")) return;
    const el = document.createElement("span");
    el.className = "chat-timestamp";
    el.dataset.time = String(Date.now());
    el.dataset.mode = String(mode);
    node.appendChild(el);
  };
  const updateBadge = messageNode => {
    const badge = messageNode?.querySelector(":scope > .chat-timestamp");
    if (!badge) return;
    const time = new Date(Number(badge.dataset.time));
    const relative = formatRelative(time);
    const exact = formatExact(time);
    badge.textContent = mode === 0
      ? ` · ${relative}`
      : mode === 1
        ? ` · ${exact}`
        : ` · ${relative} · ${exact}`;
    badge.dataset.mode = String(mode);
  };
  const updateAllBadges = () => {
    chatContent.querySelectorAll(":scope > .chat-message > .chat-timestamp").forEach(badge => {
      const messageNode = badge.parentElement;
      if (messageNode) updateBadge(messageNode);
    });
  };
  const startTimer = messageNode => {
    if (hoveredMessage === messageNode) return;
    if (timer) clearInterval(timer);
    hoveredMessage = messageNode;
    updateBadge(messageNode);
    timer = setInterval(() => {
      if (!hoveredMessage?.isConnected) {
        clearInterval(timer);
        timer = null;
        hoveredMessage = null;
        return;
      }
      if (mode === 0 || mode === 2) updateBadge(hoveredMessage);
    }, 1000);
  };
  const stopTimer = messageNode => {
    if (hoveredMessage !== messageNode) return;
    if (timer) clearInterval(timer);
    timer = null;
    hoveredMessage = null;
  };
  injectStyle(
    styleId,
    `.chat-timestamp {
      display: none;
      margin-left: 4px;
      color: #999;
      font-size: 10px;
      font-weight: normal;
      line-height: 1;
      white-space: nowrap;
      opacity: 0.7;
      vertical-align: baseline;
      user-select: none;
      -webkit-user-select: none;
      cursor: pointer;
    }
    .chat-message:hover .chat-timestamp {
      display: inline;
    }`
  );
  chatContent.querySelectorAll(".chat-message").forEach(stampMessage);
  chatContent.addEventListener("pointerover", event => {
    const messageNode = event.target.closest(".chat-message");
    if (!messageNode || !chatContent.contains(messageNode)) return;
    if (messageNode.contains(event.relatedTarget)) return;
    startTimer(messageNode);
  });
  chatContent.addEventListener("pointerout", event => {
    const messageNode = event.target.closest(".chat-message");
    if (!messageNode || !chatContent.contains(messageNode)) return;
    if (messageNode.contains(event.relatedTarget)) return;
    stopTimer(messageNode);
  });
  chatContent.addEventListener("click", event => {
    const timestampNode = event.target.closest(".chat-timestamp");
    if (!timestampNode || !chatContent.contains(timestampNode)) return;
    event.preventDefault();
    event.stopPropagation();
    mode = (mode + 1) % modes.length;
    updateAllBadges();
  });
  chatContent.addEventListener("contextmenu", event => {
    const timestampNode = event.target.closest(".chat-timestamp");
    if (!timestampNode || !chatContent.contains(timestampNode)) return;
    event.preventDefault();
    event.stopPropagation();
    const time = new Date(Number(timestampNode.dataset.time));
    copyToClipboard(formatExact(time));
  });
  onNewMessages(chatContent, messages => messages.forEach(stampMessage));
}

exports.chatTimestamp = chatTimestamp;