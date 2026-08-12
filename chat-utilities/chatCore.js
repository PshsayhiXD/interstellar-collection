function getChatElements() {
  const chatBox = document.querySelector("#chat");
  const chatContent = document.querySelector("#chat-content");
  if (!chatBox || !chatContent) return null;
  return { chatBox, chatContent };
}

function markInitialized(node, key) {
  const flag = `chatInit_${key}`;
  if (node.dataset[flag]) return true;
  node.dataset[flag] = "1";
  return false;
}

function injectStyle(id, css) {
  if (document.querySelector(`#${id}`)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}

function getMessageTextSpan(messageNode) {
  for (const child of messageNode.children) {
    if (child.tagName === "SPAN" && child.querySelector(":scope > b")) return child;
  }
  return null;
}

function getUsername(messageNode) {
  const bdi = messageNode.querySelector(":scope bdi");
  return bdi ? bdi.textContent.trim() : "";
}

function getRole(messageNode) {
  const bdi = messageNode.querySelector(":scope bdi");
  const role = bdi?.previousElementSibling;
  return role?.tagName === "SPAN" ? role.textContent.trim() : "";
}

function getMessageText(messageNode) {
  const span = getMessageTextSpan(messageNode);
  if (!span) return messageNode.textContent;
  return Array.from(span.childNodes)
    .filter(node => node.nodeType === Node.TEXT_NODE || node.nodeName === "A")
    .map(node => node.textContent)
    .join("");
}

function normalizeMessageText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function getEventSender(event) {
  const root = event?.packet?.text?.[0]?.c?.[0]?.[0];
  if (!Array.isArray(root)) return { role: "", username: "", badges: [] };
  let role = "";
  let username = "";
  let badges = [];
  for (const value of root) {
    if (!value || typeof value !== "object") continue;
    if (typeof value.t === "string" && value.t.startsWith("span")) role = String(value.c || "").trim();
    if (typeof value.t === "string" && value.t.startsWith("bdi")) username = String(value.c || "").trim();
    if (Array.isArray(value.b)) badges = value.b;
  }
  return { role, username, badges };
}

function getEventMessageText(event) {
  return normalizeMessageText(event?.packet?.bubble?.msg || "");
}

function getEventKey(event) {
  const sender = getEventSender(event);
  const text = getEventMessageText(event);
  return `${sender.username}|${sender.role}|${text}`;
}

function resolveMessageElement(chatContent, event) {
  const links = getEventLinks(event);
  if (links.length) {
    for (const link of links) {
      const message = [...chatContent.querySelectorAll(".chat-message")].reverse().find(message => {
        return [...message.querySelectorAll("a[href]")].some(anchor => anchor.href === link);
      });
      if (message) return message;
    }
    return null;
  }
  const sender = getEventSender(event);
  const targetText = getEventMessageText(event);
  if (!sender.username && !targetText) return null;
  const messages = [...chatContent.querySelectorAll(".chat-message")].slice(-20).reverse();
  for (const message of messages) {
    const username = normalizeMessageText(getUsername(message));
    const role = normalizeMessageText(getRole(message));
    const text = normalizeMessageText(getMessageText(message));
    if (sender.username && username !== sender.username) continue;
    if (sender.role && role !== sender.role) continue;
    if (targetText && text !== targetText && !text.startsWith(targetText) && !targetText.startsWith(text)) continue;
    return message;
  }
  return null;
}

function getEventLinks(event) {
  const links = [];
  const walk = value => {
    if (typeof value === "string") {
      const matches = value.match(/https?:\/\/drednot\.io\/invite\/[A-Za-z0-9_-]+\/?/gi);
      if (matches) links.push(...matches);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (value && typeof value === "object") {
      Object.values(value).forEach(walk);
    }
  };
  walk(event?.raw);
  return [...new Set(links)];
}

function onNewMessages(root, callback) {
  const chatContent = root?.matches?.("#chat-content")
    ? root
    : root?.querySelector?.("#chat-content") || document.querySelector("#chat-content");
  if (!chatContent) return null;
  const eventManager = StellarExports?.["@interstellar/StellarEventManager"]?.default;
  const events = StellarExports?.["@interstellar/InterstellarEvents"];
  const eventType = events?.ChatMessageRecieveEvent;
  if (!eventManager || !eventType) return null;
  const recentEventKeys = new Map();
  const listener = event => {
    const key = getEventKey(event);
    const now = Date.now();
    const previous = recentEventKeys.get(key);
    if (previous && now - previous < 1000) return;
    recentEventKeys.set(key, now);
    for (const [eventKey, time] of recentEventKeys) {
      if (now - time >= 1000) recentEventKeys.delete(eventKey);
    }
    const sender = getEventSender(event);
    const text = getEventMessageText(event);
    if (!sender.username && !text) return;
    requestAnimationFrame(() => {
      const message = resolveMessageElement(chatContent, event);
      if (message) callback([message], event);
    });
  };
  eventManager.addEventListener(eventType, listener);
  return { eventManager, eventType, listener };
}

function onChatStateChange(chatBox, callback) {
  const observer = new MutationObserver(callback);
  observer.observe(chatBox, { attributes: true, attributeFilter: ["class"] });
  return observer;
}

function isChatClosed(chatBox) {
  return chatBox.classList.contains("closed");
}

function isWarningMessage(messageNode) {
  return Boolean(messageNode?.querySelector("b.warning"));
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {}
  const input = document.createElement("textarea");
  input.value = text;
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}

exports.getChatElements = getChatElements;
exports.markInitialized = markInitialized;
exports.injectStyle = injectStyle;
exports.getMessageTextSpan = getMessageTextSpan;
exports.getUsername = getUsername;
exports.getRole = getRole;
exports.getMessageText = getMessageText;
exports.getEventSender = getEventSender;
exports.getEventMessageText = getEventMessageText;
exports.resolveMessageElement = resolveMessageElement;
exports.onNewMessages = onNewMessages;
exports.onChatStateChange = onChatStateChange;
exports.isChatClosed = isChatClosed;
exports.isWarningMessage = isWarningMessage;
exports.copyToClipboard = copyToClipboard;