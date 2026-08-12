const {
  getChatElements,
  markInitialized,
  injectStyle,
  getUsername,
  onNewMessages
} = require("../chatCore");

function userChatHighlight() {
  const els = getChatElements();
  if (!els) return;
  const { chatContent } = els;
  if (markInitialized(chatContent, "highlight")) return;
  const styleId = "chat-highlight-style";
  let selectedUser = null;
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
  injectStyle(
    styleId,
    `.chat-message bdi {
      cursor: pointer;
    }
    .chat-message bdi:hover {
      text-decoration: underline;
    }
    .chat-message.chat-highlighted {
      background: rgba(255, 255, 0, 0.12);
      box-shadow: inset 2px 0 0 rgba(255, 220, 0, 0.8);
    }`
  );
  chatContent.addEventListener("click", event => {
    const bdi = event.target.closest("bdi");
    if (!bdi || !chatContent.contains(bdi)) return;
    const messageNode = bdi.closest(".chat-message");
    if (!messageNode) return;
    const username = getUsername(messageNode);
    if (username) selectUser(username);
  });
  onNewMessages(chatContent, messages => {
    if (selectedUser === null) return;
    messages.forEach(node => {
      if (getUsername(node) === selectedUser) node.classList.add("chat-highlighted");
    });
  });
}

exports.userChatHighlight = userChatHighlight;