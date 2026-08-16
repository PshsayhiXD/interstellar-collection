const { getChatElements, markInitialized, injectStyle, getMessageTextSpan, onNewMessages } = require("../chatCore");

function chatFormatting() {
  const elements = getChatElements();
  if (!elements) return;
  if (markInitialized(elements.chatContent, "chatFormatting")) return;
  injectStyle("chat-formatting", `
    .chat-format-spoiler {
      color: transparent;
      background: #444;
      border-radius: 3px;
      cursor: pointer;
      transition: color 0.15s ease;
    }
    .chat-format-spoiler:hover,
    .chat-format-spoiler.revealed {
      color: inherit;
    }
    .chat-format-highlight {
      background: #fff176;
      color: #111;
      border-radius: 2px;
      padding: 0 2px;
    }
    .chat-format-code {
      padding: 1px 4px;
      border-radius: 3px;
      background: rgba(0, 0, 0, 0.25);
      font-family: monospace;
    }
    .chat-format-quote {
      display: inline-block;
      border-left: 3px solid currentColor;
      padding-left: 8px;
      opacity: 0.85;
    }
  `);
  const patterns = [
    { regex: /^\*\*(.+?)\*\*/, tag: "strong", length: 2 },
    { regex: /^__(.+?)__/, tag: "u", length: 2 },
    { regex: /^~~(.+?)~~/, tag: "del", length: 2 },
    { regex: /^`([^`]+)`/, tag: "code", className: "chat-format-code", length: 1 },
    { regex: /^\|\|(.+?)\|\|/, tag: "span", className: "chat-format-spoiler", length: 2, spoiler: true },
    { regex: /^==(.+?)==/, tag: "span", className: "chat-format-highlight", length: 2 },
    { regex: /^\^(.+?)\^/, tag: "sup", length: 1 },
    { regex: /^~([^~]+)~/, tag: "sub", length: 1 },
    { regex: /^\*(.+?)\*/, tag: "em", length: 1 },
    { regex: /^_(.+?)_/, tag: "em", length: 1 },
    { regex: /^>(?:\s+)?(.+)/, tag: "span", className: "chat-format-quote", length: 1, quote: true }
  ];
  const createElement = (tag, className, content) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    parseText(content).forEach(child => element.append(child));
    return element;
  };
  const parseText = text => {
    const fragment = [];
    let index = 0;
    while (index < text.length) {
      let matched = false;
      for (const pattern of patterns) {
        const value = text.slice(index);
        const match = value.match(pattern.regex);
        if (!match) continue;
        const content = match[1];
        const element = createElement(pattern.tag, pattern.className, content);
        if (pattern.spoiler) {
          element.addEventListener("click", () => element.classList.toggle("revealed"));
        }
        fragment.push(element);
        index += match[0].length;
        matched = true;
        break;
      }
      if (matched) continue;
      const next = findNextFormat(text, index);
      const value = text.slice(index, next);
      fragment.push(document.createTextNode(value));
      index = next;
    }
    return fragment;
  };
  const findNextFormat = (text, start) => {
    let next = text.length;
    for (const pattern of patterns) {
      const match = text.slice(start).search(pattern.regex);
      if (match !== -1) next = Math.min(next, start + match);
    }
    return next > start ? next : start + 1;
  };
  const formatMessage = message => {
    if (message.dataset.chatFormatted === "true") return;
    const span = getMessageTextSpan(message);
    if (!span) return;
    const textNodes = [];
    const walker = document.createTreeWalker(span, NodeFilter.SHOW_TEXT);
    let node;
    while (node = walker.nextNode()) {
      if (node.parentElement?.closest("b, .user-badge-small, .chat-timestamp")) continue;
      textNodes.push(node);
    }
    textNodes.forEach(textNode => {
      const text = textNode.nodeValue;
      const fragment = document.createDocumentFragment();
      parseText(text).forEach(child => fragment.append(child));
      textNode.replaceWith(fragment);
    });
    message.dataset.chatFormatted = "true";
  };
  elements.chatContent.querySelectorAll(".chat-message").forEach(formatMessage);
  onNewMessages(elements.chatContent, messages => messages.forEach(formatMessage));
}

exports.chatFormatting = chatFormatting;