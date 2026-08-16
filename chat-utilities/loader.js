const script = require("@interstellar/InterstellarScriptingMod");
const checkForUpdate = require("./update").default;

class ChatUtilities extends script.default {
  async load() {
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
    const { chatFormatting } = require("./features/chatFormatting");
    const { chatClear } = require("./features/chatClear");
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
    chatFormatting();
    chatClear()
    await checkForUpdate("chat-utilities");
  }
}

exports.default = ChatUtilities;