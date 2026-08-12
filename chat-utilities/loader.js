const script = require("@interstellar/InterstellarScriptingMod");;

class ChatUtilities extends script.default {
  load() {
    const { chatResize } = require("./features/chatResize");
    const { chatTimestamp } = require("./features/chatTimestamp");
    const { userChatHighlight } = require("./features/chatHighlight");
    const { chatLink } = require("./features/chatLink");
    const { chatSearchFilter } = require("./features/chatSearchFilter");
    const { chatInputHistory } = require("./features/chatInputHistory");
    const { chatAutoScroll } = require("./features/chatAutoScroll")
    chatResize();
    chatTimestamp();
    userChatHighlight();
    chatLink();
    chatSearchFilter();
    chatInputHistory();
    chatAutoScroll();
  }
}

exports.default = ChatUtilities;