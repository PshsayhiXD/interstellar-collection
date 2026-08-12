function chatSearchFilter() {
  const chatBox = document.querySelector("#chat");
  const chatContent = document.querySelector("#chat-content");
  if (!chatBox || !chatContent) return;

  const styleId = "chat-search-filter-style";
  const barId = "chat-search-filter-bar";
  if (document.querySelector(`#${barId}`)) return;

  let debounceTimer = null;
  let currentQuery = { user: null, text: null };
  let queryError = false;

  const getUsername = messageNode => {
    const bdi = messageNode.querySelector(":scope bdi");
    return bdi ? bdi.textContent.trim() : "";
  };

  const getMessageText = messageNode => {
    const span = Array.from(messageNode.children).find(
      child => child.tagName === "SPAN" && child.querySelector(":scope > b")
    );
    if (!span) return messageNode.textContent;
    return Array.from(span.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE || node.nodeName === "A")
      .map(node => node.textContent)
      .join("");
  };

  const compileMatcher = raw => {
    const regexForm = raw.match(/^\/(.*)\/([a-z]*)$/i);
    if (regexForm) {
      try {
        const re = new RegExp(regexForm[1], regexForm[2].includes("i") ? regexForm[2] : `${regexForm[2]}i`);
        return { test: str => re.test(str) };
      } catch {
        return null;
      }
    }
    const needle = raw.toLowerCase();
    return { test: str => str.toLowerCase().includes(needle) };
  };

  const parseQuery = raw => {
    const tokenRegex = /(from|text):/gi;
    const tokens = [];
    let match;
    while ((match = tokenRegex.exec(raw)) !== null) {
      tokens.push({ type: match[1].toLowerCase(), valueStart: tokenRegex.lastIndex, start: match.index });
    }
    const rawValues = { user: "", text: "" };
    if (tokens.length === 0) {
      rawValues.text = raw.trim();
    } else {
      tokens.forEach((token, i) => {
        const end = i + 1 < tokens.length ? tokens[i + 1].start : raw.length;
        rawValues[token.type === "from" ? "user" : "text"] = raw.slice(token.valueStart, end).replace(/:$/, "").trim();
      });
    }

    const result = { user: null, text: null };
    let hadError = false;
    if (rawValues.user) {
      result.user = compileMatcher(rawValues.user);
      if (!result.user) hadError = true;
    }
    if (rawValues.text) {
      result.text = compileMatcher(rawValues.text);
      if (!result.text) hadError = true;
    }
    return { result, hadError };
  };

  const messageMatches = messageNode => {
    if (currentQuery.user && !currentQuery.user.test(getUsername(messageNode))) return false;
    if (currentQuery.text && !currentQuery.text.test(getMessageText(messageNode))) return false;
    return true;
  };

  const applyFilter = () => {
    const active = Boolean(currentQuery.user || currentQuery.text);
    let visibleCount = 0;
    chatContent.querySelectorAll(".chat-message").forEach(messageNode => {
      const show = !active || (!queryError && messageMatches(messageNode));
      messageNode.classList.toggle("chat-filtered-out", !show);
      if (show) visibleCount++;
    });
    countLabel.textContent = queryError ? "invalid regex" : active ? `${visibleCount} match${visibleCount === 1 ? "" : "es"}` : "";
    searchInput.classList.toggle("chat-search-active", active && !queryError);
    searchInput.classList.toggle("chat-search-error", queryError);
    clearBtn.style.visibility = searchInput.value ? "visible" : "hidden";
  };

  const scheduleApplyFilter = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const { result, hadError } = parseQuery(searchInput.value);
      currentQuery = result;
      queryError = hadError;
      applyFilter();
    }, 120);
  };

  if (!document.querySelector(`#${styleId}`)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      #${barId} {
        padding: 4px 0 6px;
      }
      #${barId} .chat-search-row {
        position: relative;
        display: flex;
        align-items: center;
      }
      #${barId} .chat-search-input {
        width: 100%;
        box-sizing: border-box;
        padding: 4px 44px 4px 8px;
        font-size: 12px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 4px;
        color: #ddd;
        outline: none;
      }
      #${barId} .chat-search-input::placeholder {
        color: #888;
      }
      #${barId} .chat-search-input.chat-search-active {
        border-color: rgba(90, 170, 255, 0.6);
      }
      #${barId} .chat-search-input.chat-search-error {
        border-color: rgba(255, 90, 90, 0.7);
      }
      #${barId} .chat-search-count {
        position: absolute;
        right: 22px;
        font-size: 11px;
        color: #888;
        pointer-events: none;
        white-space: nowrap;
      }
      #${barId} .chat-search-input.chat-search-error ~ .chat-search-count {
        color: #f77;
      }
      #${barId} .chat-search-clear {
        position: absolute;
        right: 6px;
        cursor: pointer;
        color: #999;
        font-size: 12px;
        line-height: 1;
        visibility: hidden;
      }
      #${barId} .chat-search-clear:hover {
        color: #ddd;
      }
      #${barId} .chat-search-hint {
        margin-top: 2px;
        font-size: 10px;
        color: #777;
        font-style: italic;
      }
      .chat-message.chat-filtered-out {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  const bar = document.createElement("div");
  bar.id = barId;

  const row = document.createElement("div");
  row.className = "chat-search-row";

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.className = "chat-search-input";
  searchInput.placeholder = "Search chat…";
  searchInput.autocomplete = "off";

  const countLabel = document.createElement("span");
  countLabel.className = "chat-search-count";

  const clearBtn = document.createElement("span");
  clearBtn.className = "chat-search-clear";
  clearBtn.textContent = "✕";
  clearBtn.title = "Clear search";

  const hint = document.createElement("div");
  hint.className = "chat-search-hint";
  hint.textContent = "from:USERNAME, text:WORD, from:USERNAME:text:WORD or /regex/ for either";

  searchInput.addEventListener("input", scheduleApplyFilter);
  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    currentQuery = { user: null, text: null };
    queryError = false;
    applyFilter();
    searchInput.focus();
  });

  row.append(searchInput, countLabel, clearBtn);
  bar.append(row, hint);
  chatContent.insertAdjacentElement("beforebegin", bar);

  const updateBarVisibility = () => {
    bar.style.display = chatBox.classList.contains("closed") ? "none" : "";
  };
  updateBarVisibility();
  new MutationObserver(updateBarVisibility).observe(chatBox, {
    attributes: true,
    attributeFilter: ["class"],
  });

  const observer = new MutationObserver(mutations => {
    if (!currentQuery.user && !currentQuery.text) return;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE && node.matches(".chat-message")) {
          node.classList.toggle("chat-filtered-out", queryError || !messageMatches(node));
        }
      }
    }
  });
  observer.observe(chatContent, { childList: true });
}

exports.chatSearchFilter = chatSearchFilter;