const { getChatElements, markInitialized, injectStyle, onNewMessages, copyToClipboard } = require("../chatCore");

async function chatInviteLinkResolver() {
  const els = getChatElements();
  if (!els) return;
  const { chatContent } = els;
  if (markInitialized(chatContent, "inviteLinkResolver")) return;
  const styleId = "chat-invite-link-style";
  const cache = new Map();
  const pending = new Map();
  const invitePattern = /^https?:\/\/drednot.io\/invite\/[A-Za-z0-9_-]+\/?$/i;
  const getShipFromLink = async link => {
    if (cache.has(link)) return cache.get(link);
    if (pending.has(link)) return pending.get(link);
    const request = fetch(link, {
      credentials: "include",
      cache: "no-store"
    }).then(async res => {
      if (!res.ok) return {};
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const ogTitle = doc.querySelector('meta[property="og\\:title"]')?.content || "";
      const ogImage = doc.querySelector('meta[property="og\\:image"]')?.content || null;
      const shipName = ogTitle
        .replace(/^(Invite:|Ship:)\s\*/i, "")
        .replace(/\s\*[-|]\s\*drednot.io$/i, "")
        .trim();
      if (!shipName || shipName === "Deep Space Airships") return {};
      return {
        valid: true,
        shipName,
        shipImage: ogImage
      };
    }).catch(() => ({}));
    pending.set(link, request);
    const result = await request;
    pending.delete(link);
    cache.set(link, result);
    return result;
  };
  const createCard = (link, ship) => {
    const card = document.createElement("span");
    card.className = "chat-invite-card";
    const image = document.createElement("img");
    image.className = "chat-invite-image";
    image.src = ship.shipImage || "";
    image.alt = "";
    image.loading = "lazy";
    const content = document.createElement("span");
    content.className = "chat-invite-content";
    const name = document.createElement("span");
    name.className = "chat-invite-name";
    name.textContent = ship.shipName || "Unknown Ship";
    const actions = document.createElement("span");
    actions.className = "chat-invite-actions";
    const open = document.createElement("button");
    open.className = "chat-invite-button";
    open.type = "button";
    open.textContent = "Open";
    open.addEventListener("click", event => {
      event.stopPropagation();
      window.open(link, "_blank", "noopener,noreferrer");
    });
    const join = document.createElement("button");
    join.className = "chat-invite-button";
    join.type = "button";
    join.textContent = "Join";
    join.addEventListener("click", event => {
      event.stopPropagation();
      window.location.href = link;
    });
    const copy = document.createElement("button");
    copy.className = "chat-invite-button";
    copy.type = "button";
    copy.textContent = "Copy";
    copy.addEventListener("click", async event => {
      event.stopPropagation();
      await copyToClipboard(link);
      copy.textContent = "Copied";
      setTimeout(() => {
        copy.textContent = "Copy";
      }, 1000);
    });
    actions.append(open, join, copy);
    content.append(name, actions);
    card.append(image, content);
    card.dataset.inviteLink = link;
    return card;
  };
  const findInviteLinks = messageNode => {
    const links = new Set();
    const anchors = [...messageNode.querySelectorAll("a[href]")];
    for (const anchor of anchors) {
      if (invitePattern.test(anchor.href)) links.add(anchor.href);
    }
    return [...links];
  };
  const resolveLink = async (messageNode, link) => {
    if (!messageNode.isConnected) return;
    const ship = await getShipFromLink(link);
    if (!ship.valid) return;
    if (!messageNode.isConnected) return;
    const anchor = [...messageNode.querySelectorAll("a[href]")].find(node => node.href === link);
    if (!anchor) return;
    if (messageNode.querySelector(`.chat-invite-card[data-invite-link="${CSS.escape(link)}"]`)) return;
    const card = createCard(link, ship);
    anchor.replaceWith(card);
  };
  const processMessage = async messageNode => {
    if (!messageNode.isConnected) return;
    if (messageNode.querySelector(".chat-invite-card")) return;
    for (let attempt = 0; attempt < 20; attempt++) {
      if (!messageNode.isConnected) return;
      const links = findInviteLinks(messageNode);
      if (links.length) {
        for (const link of links) await resolveLink(messageNode, link);
        return;
      }
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
  };
  const observeMessage = messageNode => {
    if (!messageNode?.matches?.(".chat-message")) return;
    intersectionObserver.observe(messageNode);
  };
  injectStyle(
    styleId,
    `.chat-invite-card {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      max-width: 100%;
      margin: 2px 0;
      padding: 5px 7px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.04);
      vertical-align: middle;
    }
    .chat-invite-image {
      width: 42px;
      height: 42px;
      flex: 0 0 42px;
      object-fit: cover;
      border-radius: 4px;
      background: rgba(0, 0, 0, 0.2);
    }
    .chat-invite-content {
      display: inline-flex;
      min-width: 0;
      flex-direction: column;
      gap: 4px;
    }
    .chat-invite-name {
      max-width: 260px;
      overflow: hidden;
      font-size: 12px;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .chat-invite-actions {
      display: inline-flex;
      gap: 4px;
    }
    .chat-invite-button {
      padding: 2px 6px;
      border: 0;
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.08);
      color: inherit;
      font-size: 10px;
      cursor: pointer;
    }
    .chat-invite-button:hover {
      background: rgba(255, 255, 255, 0.16);
    }`
  );
  const intersectionObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      intersectionObserver.unobserve(entry.target);
      processMessage(entry.target).catch(() => {});
    }
  }, {
    root: chatContent,
    rootMargin: "300px"
  });
  const initialMessages = chatContent.querySelectorAll(".chat-message");
  initialMessages.forEach(observeMessage);
  onNewMessages(chatContent, messages => {
    messages.forEach(observeMessage);
  }, {
    subtree: true
  });
}

exports.chatInviteLinkResolver = chatInviteLinkResolver;