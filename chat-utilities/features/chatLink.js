const { getChatElements, getMessageTextSpan, markInitialized, injectStyle, onNewMessages, copyToClipboard } = require("../chatCore");

function chatLink() {
  const els = getChatElements();
  if (!els) return;
  const { chatContent } = els;
  if (markInitialized(chatContent, "link")) return;
  const styleId = "chat-autolink-style";
  const URL_RE = /\b(?:https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;
  const linkifyTextNode = textNode => {
    const text = textNode.nodeValue;
    URL_RE.lastIndex = 0;
    if (!URL_RE.test(text)) return;
    URL_RE.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let lastIndex = 0;
    let match;
    while ((match = URL_RE.exec(text)) !== null) {
      if (match.index > lastIndex) frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      const raw = match[0];
      const href = raw.startsWith("www.") ? `https://${raw}` : raw;
      const a = document.createElement("a");
      a.href = href;
      a.textContent = raw;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.className = "chat-autolink";
      a.addEventListener("contextmenu", event => {
        event.preventDefault();
        copyToClipboard(href);
      });
      frag.appendChild(a);
      lastIndex = match.index + raw.length;
    }
    if (lastIndex < text.length) frag.appendChild(document.createTextNode(text.slice(lastIndex)));
    textNode.replaceWith(frag);
  };
  const linkifyMessage = messageNode => {
    if (messageNode.dataset.autolinked === "true") return;
    const span = getMessageTextSpan(messageNode);
    if (!span) return;
    messageNode.dataset.autolinked = "true";
    Array.from(span.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .forEach(linkifyTextNode);
  };
  injectStyle(
    styleId,
    `a.chat-autolink {
      color: #6cf;
      text-decoration: underline;
      word-break: break-all;
    }
    a.chat-autolink:hover {
      color: #9df;
    }`
  );
  chatContent.querySelectorAll(".chat-message").forEach(linkifyMessage);
  onNewMessages(chatContent, messages => messages.forEach(linkifyMessage));
}

exports.chatLink = chatLink;