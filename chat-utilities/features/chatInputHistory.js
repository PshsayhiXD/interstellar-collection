function chatInputHistory() {
  const input = document.querySelector("#chat-input");
  if (!input) return;

  const MAX_HISTORY = 50;
  const history = [];
  let index = null;
  let draft = "";

  const setValue = value => {
    input.value = value;
    const end = value.length;
    input.setSelectionRange(end, end);
  };

  const pushHistory = value => {
    const trimmed = (value || "").trim();
    if (!trimmed) return;
    if (history[history.length - 1] === trimmed) return;
    history.push(trimmed);
    if (history.length > MAX_HISTORY) history.shift();
    index = null;
    draft = "";
  };

  const eventManager = window.StellarExports?.["@interstellar/StellarEventManager"]?.default;
  const events = window.StellarExports?.["@interstellar/InterstellarEvents"];
  const sendEvent = events?.ChatMessageSendEvent;

  if (eventManager && sendEvent) {
    eventManager.addEventListener(sendEvent, event => {
      if (event && !event.canceled) pushHistory(event.msg);
    });
  }

  input.addEventListener("keydown", event => {
    if (event.key === "ArrowUp") {
      if (history.length === 0) return;
      event.preventDefault();
      if (index === null) {
        draft = input.value;
        index = history.length - 1;
      } else if (index > 0) {
        index--;
      }
      setValue(history[index]);
    } else if (event.key === "ArrowDown") {
      if (index === null) return;
      event.preventDefault();
      if (index < history.length - 1) {
        index++;
        setValue(history[index]);
      } else {
        index = null;
        setValue(draft);
      }
    }
  });
}

exports.chatInputHistory = chatInputHistory;