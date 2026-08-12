function userChatHighlight() {
  const chatContent = document.querySelector("#chat-content");
  if (!chatContent) return;

  const styleId = "chat-highlight-style";
  let selectedUser = null;

  const getUsername = messageNode => {
    const bdi = messageNode.querySelector(":scope bdi");
    return bdi ? bdi.textContent.trim() : null;
  };

  const applyHighlight = () => {
    chatContent.querySelectorAll(".chat-message").forEach(messageNode => {
      const isMatch = selectedUser !== null && getUsername(messageNode) === selectedUser;
      messageNode.classList.toggle("chat-highlighted", isMatch);
    });
  };

  const selectUser = username => {
    selectedUser = selectedUser === username ? null : username;
    applyHighlight();
  };

  if (!document.querySelector(`#${styleId}`)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .chat-message bdi {
        cursor: pointer;
      }
      .chat-message bdi:hover {
        text-decoration: underline;
      }
      .chat-message.chat-highlighted {
        background: rgba(255, 255, 0, 0.12);
        box-shadow: inset 2px 0 0 rgba(255, 220, 0, 0.8);
      }
    `;
    document.head.appendChild(style);
  }

  chatContent.addEventListener("click", event => {
    const bdi = event.target.closest("bdi");
    if (!bdi || !chatContent.contains(bdi)) return;
    const messageNode = bdi.closest(".chat-message");
    if (!messageNode) return;
    const username = getUsername(messageNode);
    if (username) selectUser(username);
  });

  const observer = new MutationObserver(mutations => {
    if (selectedUser === null) return;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          node.matches(".chat-message") &&
          getUsername(node) === selectedUser
        ) {
          node.classList.add("chat-highlighted");
        }
      }
    }
  });
  observer.observe(chatContent, { childList: true });
}

exports.userChatHighlight = userChatHighlight;