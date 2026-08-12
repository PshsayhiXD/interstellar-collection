const script = require("@interstellar/InterstellarScriptingMod");
const checkForUpdate = require("./update").default;

class ChatUtilities extends script.default {
  async load() {
    console.log("[ChatUtilities] load()");
    const { chatResize } = require("./features/chatResize");
    const { chatTimestamp } = require("./features/chatTimestamp");
    const { userChatHighlight } = require("./features/chatHighlight");
    const { chatLink } = require("./features/chatLink");
    const { chatSearchFilter } = require("./features/chatSearchFilter");
    const { chatInputHistory } = require("./features/chatInputHistory");
    const { chatAutoScroll } = require("./features/chatAutoScroll");
    const { chatInviteLinkResolver } = require("./features/chatInviteLinkResolver");
    const { chatSettings } = require("./features/chatSettings");
    const { chatVersion } = require("./features/chatVersion");
    console.log("[ChatUtilities] features loaded");
    chatResize();
    chatTimestamp();
    userChatHighlight();
    chatLink();
    chatSearchFilter();
    chatInputHistory();
    chatAutoScroll();
    await chatInviteLinkResolver();
    chatSettings();
    chatVersion();
    await checkForUpdate("chat-utilities");
  }
}

exports.default = ChatUtilities;