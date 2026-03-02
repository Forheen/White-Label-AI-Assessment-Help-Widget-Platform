(function () {
const scriptTag = document.currentScript;

const config = {
  theme: scriptTag?.getAttribute("theme") || "light",
  defaultMode: scriptTag?.getAttribute("default-mode") || null,
    enableChat: scriptTag?.getAttribute("enable-chat") !== "false"

};
if (config.defaultMode === "chat" && !config.enableChat) {
  console.warn("AIWidget: default-mode='chat' ignored because enable-chat='false'");
  config.defaultMode = null;
}
  const state = {
    question: null,
    mode: null,
  theme: config.theme === "dark" ? "dark" : "light"
  };

  const container = document.createElement("div");
  document.body.appendChild(container);
  const shadow = container.attachShadow({ mode: "open" });

  shadow.innerHTML = `
    <style>
      :host {
        font-family: Inter, system-ui, -apple-system, sans-serif;
      }

      /* THEME VARIABLES */
      .light {
        --bg: #ffffff;
        --text: #111827;
        --card: #f3f4f6;
        --border: #e5e7eb;
      }

      .dark {
        --bg: #111827;
        --text: #f9fafb;
        --card: #1f2937;
        --border: #374151;
      }

      .floating-btn {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: linear-gradient(135deg, #4f46e5, #6366f1);
        border: none;
        font-size: 26px;
        cursor: pointer;
        box-shadow: 0 10px 25px rgba(79,70,229,0.4);
        transition: all 0.25s ease;
        z-index: 999999;
      }

      .floating-btn.hidden {
        opacity: 0;
        pointer-events: none;
        transform: scale(0.8);
      }

      .panel {
        position: fixed;
        top: 0;
        right: 0;
        width: 420px;
        height: 100%;
        background: var(--bg);
        color: var(--text);
        box-shadow: -10px 0 40px rgba(0,0,0,0.2);
        transform: translateX(100%);
        transition: transform 0.35s ease;
        display: flex;
        flex-direction: column;
        z-index: 999998;
      }

      .panel.open {
        transform: translateX(0);
      }

      .header {
        padding: 18px;
        background: linear-gradient(135deg, #4f46e5, #6366f1);
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;
      }

      .header-icons span {
        margin-left: 12px;
        cursor: pointer;
        font-size: 18px;
      }

      .content {
        flex: 1;
        padding: 18px;
        overflow-y: auto;
        transition: opacity 0.25s ease, transform 0.25s ease;
      }

      .question-box {
        background: var(--card);
        padding: 14px;
        border-radius: 10px;
        margin-bottom: 18px;
        font-size: 14px;
        border: 1px solid var(--border);
      }

      .mode-card {
        padding: 14px;
        border-radius: 12px;
        background: var(--card);
        margin-bottom: 12px;
        cursor: pointer;
        border: 1px solid var(--border);
        transition: all 0.2s ease;
      }

      .mode-card:hover {
        transform: translateY(-2px);
        border-color: #6366f1;
      }

      .response-box {
        margin-top: 16px;
        padding: 14px;
        border-radius: 12px;
        background: var(--card);
        font-size: 14px;
        border: 1px solid var(--border);
      }

      .chat-area {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .chat-msg {
        padding: 10px 14px;
        border-radius: 16px;
        max-width: 75%;
        font-size: 14px;
      }

      .user {
        align-self: flex-end;
        background: #4f46e5;
        color: white;
      }

      .ai {
        align-self: flex-start;
        background: var(--card);
        border: 1px solid var(--border);
      }

      .typing {
        display: flex;
        gap: 4px;
      }

      .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: gray;
        animation: blink 1.4s infinite both;
      }

      .dot:nth-child(2) { animation-delay: .2s; }
      .dot:nth-child(3) { animation-delay: .4s; }

      @keyframes blink {
        0% { opacity: .2; }
        20% { opacity: 1; }
        100% { opacity: .2; }
      }

      .footer {
        padding: 14px;
        border-top: 1px solid var(--border);
        display: none;
        gap: 6px;
      }

      .footer.active {
        display: flex;
      }

      .footer input {
        flex: 1;
        padding: 10px;
        border-radius: 10px;
        border: 1px solid var(--border);
        background: var(--card);
        color: var(--text);
        outline: none;
      }

      .footer button {
        padding: 10px 12px;
        border-radius: 10px;
        border: none;
        cursor: pointer;
        background: #4f46e5;
        color: white;
      }

    </style>

    <button class="floating-btn">🤖</button>

    <div class="panel ${state.theme}">
      <div class="header">
        AI Tutor
        <div class="header-icons">
          <span id="themeToggle">🌙</span>
          <span id="closeBtn">✕</span>
        </div>
      </div>
      <div class="content">
        <div id="question"></div>
        <div id="modes"></div>
        <div id="response"></div>
      </div>
      <div class="footer">
        <input placeholder="Ask your doubt..." />
        <button>➤</button>
      </div>
    </div>
  `;

  const btn = shadow.querySelector(".floating-btn");
  const panel = shadow.querySelector(".panel");
  const closeBtn = shadow.querySelector("#closeBtn");
  const themeToggle = shadow.querySelector("#themeToggle");
  const questionEl = shadow.querySelector("#question");
  const modesEl = shadow.querySelector("#modes");
  const responseEl = shadow.querySelector("#response");
  const footer = shadow.querySelector(".footer");
  const input = shadow.querySelector("input");
  const sendBtn = shadow.querySelector("button:last-child");

 btn.onclick = () => {
  panel.classList.add("open");
  btn.classList.add("hidden");

  // If default mode is defined and question exists
  if (config.defaultMode && state.question) {
    state.mode = config.defaultMode;
    renderResponse();
  }
};

  closeBtn.onclick = () => {
    panel.classList.remove("open");
    btn.classList.remove("hidden");
    footer.classList.remove("active");
  };

  themeToggle.onclick = () => {
    if (state.theme === "light") {
      panel.classList.remove("light");
      panel.classList.add("dark");
      themeToggle.textContent = "☀️";
      state.theme = "dark";
    } else {
      panel.classList.remove("dark");
      panel.classList.add("light");
      themeToggle.textContent = "🌙";
      state.theme = "light";
    }
  };

function renderModes() {
  modesEl.innerHTML = `
    <div class="mode-card" data-mode="solution">
      <strong>📘 View Full Solution</strong>
      <div style="font-size:13px;opacity:0.8;">
        Get the complete answer instantly.
      </div>
    </div>

    <div class="mode-card" data-mode="breakdown">
      <strong>🧠 Understand Step-by-Step</strong>
      <div style="font-size:13px;opacity:0.8;">
        Learn the reasoning behind the solution.
      </div>
    </div>

    ${config.enableChat ? `
      <div class="mode-card" data-mode="chat">
        <strong>💬 Guided Tutor Chat</strong>
        <div style="font-size:13px;opacity:0.8;">
          Solve interactively with hints.
        </div>
      </div>
    ` : ""}
  `;

  shadow.querySelectorAll(".mode-card").forEach(card => {
    card.onclick = () => {
      state.mode = card.dataset.mode;
      renderResponse();
    };
  });
}
  function renderResponse() {

    footer.classList.remove("active");
if (state.mode === "chat" && !config.enableChat) {
  return;
}
    if (state.mode === "solution") {
      responseEl.innerHTML = `
        <div class="response-box">
          Final Answer: x = 5
        </div>
      `;
    }

    if (state.mode === "breakdown") {
      responseEl.innerHTML = `
        <div class="response-box">
          Step 1: Subtract 5<br/>
          Step 2: 2x = 10<br/>
          Step 3: Divide by 2 → x = 5
        </div>
      `;
    }

    if (state.mode === "chat") {
      responseEl.innerHTML = `<div class="chat-area" id="chatArea"></div>`;
      footer.classList.add("active");

      const chatArea = shadow.querySelector("#chatArea");

      function addMsg(text, type) {
        const msg = document.createElement("div");
        msg.className = "chat-msg " + type;
        msg.innerText = text;
        chatArea.appendChild(msg);
      }

      function showTyping() {
        const typing = document.createElement("div");
        typing.className = "chat-msg ai typing";
        typing.innerHTML = `
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        `;
        typing.id = "typing";
        chatArea.appendChild(typing);
      }

      function removeTyping() {
        const typing = shadow.querySelector("#typing");
        if (typing) typing.remove();
      }

      sendBtn.onclick = () => {
        if (!input.value.trim()) return;
        addMsg(input.value, "user");
        input.value = "";
        showTyping();
        setTimeout(() => {
          removeTyping();
          addMsg("Let’s isolate x first. What should we subtract?", "ai");
        }, 1200);
      };
    }
  }

  window.AIWidget = {
    loadQuestion: function (q) {
      state.question = q;
      questionEl.innerHTML =
        `<div class="question-box">${q.text}</div>`;
      renderModes();
    }
  };

})();