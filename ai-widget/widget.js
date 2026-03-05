(function () {
const scriptTag = document.currentScript;
const API_URL = "https://backendnaveen.vercel.app/api/ai-tutor/generate";
let config = {
  theme: scriptTag?.getAttribute("theme") || "light",
  defaultMode: scriptTag?.getAttribute("default-mode") || null,
    enableChat: scriptTag?.getAttribute("enable-chat") !== "false",
      position: scriptTag?.getAttribute("position") || "right",
brandColor: scriptTag?.getAttribute("brand-color") || "#6366f1"

};
config = validateConfig(config);
function validateConfig(config) {

  const validThemes = ["light", "dark"];
  const validModes = ["solution", "breakdown", "chat"];
const validPositions = ["left", "right"];
const hexRegex = /^#([0-9A-F]{3}){1,2}$/i;


  // Validate theme
  if (!validThemes.includes(config.theme)) {
    console.warn(`AIWidget: Invalid theme "${config.theme}". Falling back to "light".`);
    config.theme = "light";
  }

  // Validate default mode
  if (config.defaultMode && !validModes.includes(config.defaultMode)) {
    console.warn(`AIWidget: Invalid default-mode "${config.defaultMode}". Ignoring.`);
    config.defaultMode = null;
  }

  // Conflict: chat disabled but default-mode is chat
  if (config.defaultMode === "chat" && config.enableChat === false) {
    console.warn("AIWidget: default-mode='chat' ignored because enable-chat='false'.");
    config.defaultMode = null;
  }

  //Validate position
  if (!validPositions.includes(config.position)) {
  console.warn(`AIWidget: Invalid position "${config.position}". Falling back to "right".`);
  config.position = "right";
}

    // Validate brand color

let colors = config.brandColor.split(",");

if (colors.length === 1) {
  // Solid mode
  if (!hexRegex.test(colors[0].trim())) {
    console.warn(`AIWidget: Invalid brand-color "${config.brandColor}". Falling back to default.`);
    config.brandColor = "#6366f1";
  }
} else if (colors.length === 2) {
  // Gradient mode
  const c1 = colors[0].trim();
  const c2 = colors[1].trim();

  if (!hexRegex.test(c1) || !hexRegex.test(c2)) {
    console.warn(`AIWidget: Invalid gradient colors "${config.brandColor}". Falling back.`);
    config.brandColor = "#6366f1";
  } else {
    config.brandColor = `${c1},${c2}`;
  }
} else {
  console.warn(`AIWidget: Invalid brand-color format. Falling back.`);
  config.brandColor = "#6366f1";
}
  return config;
}
  const state = {
    question: null,
    mode: null,
  theme: config.theme === "dark" ? "dark" : "light",
  aiCache: {} ,
  homeView: "landing",
   chatHistory: [] 
  };

  const container = document.createElement("div");
  document.body.appendChild(container);
  const shadow = container.attachShadow({ mode: "open" });

  shadow.innerHTML = `
    <style>
      :host {
  ${config.brandColor.includes(",")
    ? `
      --brand-gradient: linear-gradient(135deg, ${config.brandColor});
      --brand-solid: ${config.brandColor.split(",")[0]};
    `
    : `
      --brand-gradient: linear-gradient(135deg, ${config.brandColor}, ${config.brandColor});
      --brand-solid: ${config.brandColor};
    `};
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

  ${config.position === "left" ? "left: 24px;" : "right: 24px;"}

  width: 64px;
  height: 64px;
  border-radius: 50%;
background: var(--brand-gradient);
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

  ${config.position === "left" ? "left: 0;" : "right: 0;"}

  width: 420px;
  max-width: 100%;
  height: 100vh;

  background: var(--bg);
  color: var(--text);

  box-shadow: ${config.position === "left"
    ? "8px 0 30px rgba(0,0,0,0.15)"
    : "-8px 0 30px rgba(0,0,0,0.15)"};

  transform: translateX(${config.position === "left" ? "-100%" : "100%"});
  transition: transform 0.35s ease;

  display: flex;
  flex-direction: column;

  z-index: 999998;
  overflow: hidden;
}

      .panel.open {
        transform: translateX(0);
      }

      .header {
        padding: 18px;
background: var(--brand-gradient);

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
        border-color:var(--brand-solid);
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
background: var(--brand-solid);
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
background: var(--brand-solid);
        color: white;
      }

      /* ================= MOBILE STYLE HOME ================= */
/* ================= PREMIUM MOBILE HOME ================= */

.app-home {
  padding: 20px 12px 30px 12px;
}

.home-top {
  text-align: center;
  margin-top: 10px;
  margin-bottom: 28px;
}
.home-avatar {
  width: 70px;
  height: 70px;
  margin: 0 auto 20px auto;
  border-radius: 50%;
  position: relative;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 30px;

  background: radial-gradient(circle at 30% 30%, #1e293b, #0f172a);

  box-shadow:
    0 0 0 3px rgba(255,255,255,0.08),
    0 0 0 6px rgba(99,102,241,0.3),
    0 12px 30px rgba(0,0,0,0.6);
}
.home-heading {
  font-size: 26px;
  font-weight: 600;
  line-height: 1.3;
}

.home-pill {
  margin: 20px 0 30px 0;
  background: rgba(255,255,255,0.08);
  backdrop-filter: blur(12px);
  border-radius: 30px;
  padding: 14px 18px;
  text-align: left;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.home-pill:hover {
  border-color: var(--brand-solid);
}

/* ================= SOLUTION CARD PREMIUM ================= */

.widget-solution {
  border-radius: 22px;
  padding: 20px;
  margin-bottom: 20px;
  cursor: pointer;

background: linear-gradient(145deg, #2a3341, #212936);

  border: 1px solid rgba(99,102,241,0.5);
  box-shadow:
    0 0 0 1px rgba(99,102,241,0.2),
    0 12px 30px rgba(0,0,0,0.4);

  transition: all 0.3s ease;
}

.widget-solution:hover {
  transform: translateY(-4px);
  box-shadow:
    0 0 0 1px rgba(99,102,241,0.4),
    0 20px 40px rgba(0,0,0,0.5);
}

.solution-title {
  font-size: 20px;
  font-weight: 600;
  color: white;
  margin-bottom: 8px;
}

.solution-desc {
  font-size: 14px;
  color: rgba(255,255,255,0.85);
  margin-bottom: 16px;
  line-height: 1.4;
}

.solution-preview {
  display: flex;
  gap: 12px;
}

.solution-preview img {
  border-radius: 12px;
  object-fit: cover;
}

.sol-preview-left {
  width: 55%;
  height: 90px;
}

.sol-preview-right {
  width: 35%;
  height: 90px;
  opacity: 0.9;
}


/* ================= DECONSTRUCTION CARD PREMIUM ================= */
.dec-preview-left {
  width: 35%;
  height: 65px;
}

.dec-preview-right {
  width: 65%;
  height: 65px;
  opacity: 0.9;
}
.widget-deconstruction {
  border-radius: 22px;
  padding: 20px;
  margin-bottom: 20px;
  cursor: pointer;

  background: linear-gradient(
    160deg,
    #0f172a,
    #1e293b
  );

  border: 1px solid rgba(139,92,246,0.5);
  box-shadow:
    0 0 0 1px rgba(139,92,246,0.2),
    0 12px 30px rgba(0,0,0,0.5);

  transition: all 0.3s ease;
}

.widget-deconstruction:hover {
  transform: translateY(-4px);
  box-shadow:
    0 0 0 1px rgba(139,92,246,0.4),
    0 20px 40px rgba(0,0,0,0.6);
}

.deconstruction-title {
  font-size: 20px;
  font-weight: 600;
  color: white;
  margin-bottom: 8px;
}

.deconstruction-desc {
  font-size: 14px;
  color: rgba(255,255,255,0.85);
  margin-bottom: 16px;
  line-height: 1.4;
}

.deconstruction-preview {
  display: flex;
  gap: 5px;
}

.deconstruction-preview img {
  border-radius: 12px;
  object-fit: stretch;
}


  /* MINI ACTIONS WHEN CHAT EXISTS */

.home-mini-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.mini-btn {
  background: var(--brand-solid);
  color: white;
  border: none;
  border-radius: 18px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
}

/* BACK BAR */

.back-bar {
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 14px;
  opacity: 0.8;
}
.home-pill {
  background: rgba(255,255,255,0.08);
  padding: 14px;
  border-radius: 28px;
  text-align: center;
  cursor: pointer;
  margin-bottom: 24px;
}

.mini-top-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.mini-btn {
  background: var(--brand-solid);
  color: white;
  border: none;
  border-radius: 16px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
}


.widgets-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 1.6px;
  text-transform: uppercase;

  margin-bottom: 16px;
  padding-left: 4px;

  color: var(--text);
  opacity: 0.45;
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

  // Always reset view when opening
  state.mode = null;

  questionEl.innerHTML = "";
  responseEl.innerHTML = "";
  footer.classList.remove("active");

  renderModes();   // Always show home first
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
    <div class="app-home">

      <div class="home-top">
        <div class="home-avatar">🤖</div>
        <div class="home-heading">
          Welcome to <br/> AI Chat
        </div>
      </div>

      <div class="home-pill" id="homePill">
        Ask me anything...
      </div>

      <div class="widgets-label">WIDGETS</div>

      <div class="widget-solution" data-mode="solution">
  <div class="solution-title">1. Solution</div>
  <div class="solution-desc">
    This gadget provides you the solution with the explanation and the image.
  </div>

  <div class="solution-preview">
    <img src="assets/chat-preview.png" class="sol-preview-left" />
    <img src="assets/image-preview.png" class="sol-preview-right" />
  </div>
</div>

      <div class="widget-deconstruction" data-mode="breakdown">
  <div class="deconstruction-title">2. Deconstruction</div>
  <div class="deconstruction-desc">
    Get a guide from Navin to understand how to think like a pro.
  </div>

  <div class="deconstruction-preview">
    <img src="assets/deconstruction-left.png" class="dec-preview-left" />
    <img src="assets/deconstruction-right.png" class="dec-preview-right" />
  </div>
</div>

    </div>
  `;

  // Chat pill click
  shadow.getElementById("homePill").onclick = () => {
    state.mode = "chat";
    modesEl.innerHTML = "";
    renderResponse();
  };

  // Card click
// Card click
shadow
  .querySelectorAll(".widget-solution, .widget-deconstruction")
  .forEach(card => {
    card.onclick = () => {
      state.mode = card.dataset.mode;
      modesEl.innerHTML = "";
      renderResponse();
    };
  });
}
function fetchAIResult(questionText, callback) {

  const key = questionText;

  if (state.aiCache[key]) {
    callback(state.aiCache[key]);
    return;
  }

  responseEl.innerHTML = `
    <div class="response-box" style="text-align:center;">
      <div style="font-weight:600;">🧠 Processing...</div>
      <div style="opacity:0.7;font-size:13px;">Building structured reasoning</div>
    </div>
  `;

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ problem: questionText })
  })
  .then(res => res.json())
  .then(data => {

    if (!data.structured_data) {
      responseEl.innerHTML = `
        <div class="response-box">Failed to generate result.</div>
      `;
      return;
    }

    state.aiCache[key] = data; // ✅ cache once
    callback(data);

  })
  .catch(() => {
    responseEl.innerHTML = `
      <div class="response-box">Server connection error.</div>
    `;
  });
}
function renderResponse() {

  footer.classList.remove("active");

  // No question loaded
 if (!state.question && (state.mode === "solution" || state.mode === "breakdown")) {
  responseEl.innerHTML = `
    <div class="response-box">
      No question loaded.
    </div>
  `;
  return;
}

  // Chat disabled protection
  if (state.mode === "chat" && !config.enableChat) {
    return;
  }

  // ===============================
  // SOLUTION OR BREAKDOWN (Single API Call Logic)
  // ===============================
  if (state.mode === "solution" || state.mode === "breakdown") {
questionEl.innerHTML = `
  <div class="back-bar">
    ← Back
  </div>
`;

shadow.querySelector(".back-bar").onclick = () => {
  state.mode = null;
  questionEl.innerHTML = "";      // ← THIS WAS MISSING
  responseEl.innerHTML = "";
  footer.classList.remove("active");
  renderModes();
};
    const questionKey = state.question.text;

    // If already cached → render immediately
    if (state.aiCache && state.aiCache[questionKey]) {

      const cachedData = state.aiCache[questionKey];

      if (state.mode === "solution") {
        renderSolutionUI(cachedData);
      } else {
        renderBreakdownUI(cachedData);
      }

      return;
    }

    // Show loading UI
    responseEl.innerHTML = `
      <div class="response-box" style="text-align:center;">
        <div style="font-weight:600;margin-bottom:6px;">
          🧠 Processing...
        </div>
        <div style="opacity:0.7;font-size:13px;">
          Generating structured intelligence
        </div>
      </div>
    `;

    // Call API once
    fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        problem: state.question.text
      })
    })
    .then(res => res.json())
    .then(data => {

      if (!data || !data.structured_data) {
        responseEl.innerHTML = `
          <div class="response-box">
            Failed to generate AI response.
          </div>
        `;
        return;
      }

      // Ensure cache object exists
      if (!state.aiCache) {
        state.aiCache = {};
      }

      // Save once
      state.aiCache[questionKey] = data;

      // Render according to active mode
      if (state.mode === "solution") {
        renderSolutionUI(data);
      } else {
        renderBreakdownUI(data);
      }

    })
    .catch(() => {
      responseEl.innerHTML = `
        <div class="response-box">
          Error connecting to AI server.
        </div>
      `;
    });

    return;
  }

  // ===============================
  // CHAT MODE (unchanged)
  // ===============================
  // ===============================
// CHAT MODE (FULLY FIXED)
// ===============================
if (state.mode === "chat") {

  questionEl.innerHTML = `
    <div class="back-bar">← Back</div>
  `;

shadow.querySelector(".back-bar").onclick = () => {
  state.mode = null;
  questionEl.innerHTML = "";      // ← CLEAR BACK
  responseEl.innerHTML = "";
  footer.classList.remove("active");
  renderModes();
};

  const hasChatStarted = state.chatHistory.length > 0;


    modesEl.innerHTML = `
      <div class="mini-top-actions">
        <button class="mini-btn" data-mode="solution">Go to solution directly</button>
        <button class="mini-btn" data-mode="breakdown">Go to guided breakdown</button>
      </div>
    `;

    shadow.querySelectorAll(".mini-btn").forEach(btn => {
      btn.onclick = () => {
        state.mode = btn.dataset.mode;
        renderResponse();
      };
    });
 
  // Render chat area
  responseEl.innerHTML = `<div class="chat-area" id="chatArea"></div>`;
  footer.classList.add("active");

  const chatArea = shadow.querySelector("#chatArea");

  // Render existing history
  state.chatHistory.forEach(msg => {
    const msgDiv = document.createElement("div");
    msgDiv.className = "chat-msg " + msg.type;
    msgDiv.innerText = msg.text;
    chatArea.appendChild(msgDiv);
  });

  // Send logic
  sendBtn.onclick = () => {
    if (!input.value.trim()) return;

    const userText = input.value;

    // Add user message
    state.chatHistory.push({ type: "user", text: userText });

    input.value = "";

    renderResponse(); // Re-render immediately

    // Fake AI reply
    setTimeout(() => {
      state.chatHistory.push({
        type: "ai",
        text: "Let’s think structurally..."
      });

      renderResponse(); // Re-render again
    }, 800);
  };

  return;
}
}
function renderBreakdownUI(data) {

  const structured = data.structured_data;
  let html = "";

  html += `
    <div style="margin-bottom:18px;">
      <div style="
        font-weight:700;
        font-size:16px;
        margin-bottom:4px;
        color:var(--brand-solid);
      ">
        🧠 Mentored Guided Thinking
      </div>
      <div style="font-size:13px;opacity:0.7;">
        Structured reasoning aligned with conceptual insight
      </div>
    </div>
  `;

  // Step Cards
  structured.reasoning_stages?.forEach((stage, index) => {
    html += `
      <div style="
        margin-bottom:16px;
        padding:16px;
        border-radius:14px;
        background: var(--card);
        border:1px solid var(--border);
        box-shadow:0 4px 12px rgba(0,0,0,0.05);
        transition:all 0.2s ease;
      ">
        <div style="
          font-weight:600;
          margin-bottom:8px;
          color:var(--brand-solid);
        ">
          Step ${index + 1}
        </div>

        <div style="margin-bottom:6px;">
          <strong>Goal</strong><br/>
          <span style="opacity:0.85;">${stage.goal}</span>
        </div>

        <div style="margin-bottom:6px;">
          <strong>Concept Focus</strong><br/>
          <span style="opacity:0.85;">${stage.concept_focus}</span>
        </div>

        <div>
          <strong>Expected Student Action</strong><br/>
          <span style="opacity:0.85;">${stage.expected_student_action}</span>
        </div>
      </div>
    `;
  });

  // Final Answer
  if (structured.final_answer) {
    html += `
      <div style="
        margin-top:10px;
        padding:16px;
        border-radius:14px;
        background: rgba(99,102,241,0.08);
        border:1px solid var(--brand-solid);
        font-weight:600;
      ">
        🎯 Final Structural Answer<br/>
        <div style="margin-top:6px;font-size:15px;">
          ${structured.final_answer}
        </div>
      </div>
    `;
  }

  // Image (Expandable)
  if (data.image && data.image.image_base64) {
    html += `
      <div style="margin-top:16px;text-align:center;">
        <img 
          id="expandableImg"
          src="data:${data.image.mime_type};base64,${data.image.image_base64}" 
          style="
            width:100%;
            border-radius:12px;
            cursor:pointer;
            box-shadow:0 6px 18px rgba(0,0,0,0.15);
            transition:transform 0.2s ease;
          "
        />
      </div>
    `;
  }

  responseEl.innerHTML = html;

  // Attach expand logic
  const img = shadow.querySelector("#expandableImg");
  if (img) {
    img.onclick = () => openFullscreenImage(img.src);
  }
}
function renderSolutionUI(data) {

  const structured = data.structured_data;
  let html = "";

  html += `
    <div style="margin-bottom:18px;">
      <div style="
        font-weight:700;
        font-size:16px;
        color:var(--brand-solid);
      ">
        Complete Solution
      </div>
    </div>
  `;

  if (structured.final_answer) {
    html += `
      <div style="
        padding:16px;
        border-radius:14px;
        background: rgba(99,102,241,0.08);
        border:1px solid var(--brand-solid);
        font-weight:600;
        margin-bottom:12px;
      ">
        Final Answer:<br/>
        <div style="margin-top:6px;font-size:15px;">
          ${structured.final_answer}
        </div>
      </div>
    `;
  }

  if (structured.normal_explanation) {
    html += `
      <div style="
        padding:16px;
        border-radius:14px;
        background: var(--card);
        border:1px solid var(--border);
        margin-bottom:12px;
      ">
        <strong>Explanation</strong><br/><br/>
        ${structured.normal_explanation}
      </div>
    `;
  }

  if (data.image && data.image.image_base64) {
    html += `
      <div style="text-align:center;margin-top:12px;">
        <img 
          id="expandableImg"
          src="data:${data.image.mime_type};base64,${data.image.image_base64}" 
          style="
            width:100%;
            border-radius:12px;
            cursor:pointer;
            box-shadow:0 6px 18px rgba(0,0,0,0.15);
          "
        />
      </div>
    `;
  }

  responseEl.innerHTML = html;

  const img = shadow.querySelector("#expandableImg");
  if (img) {
    img.onclick = () => openFullscreenImage(img.src);
  }
}
function openFullscreenImage(src) {

  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.background = "rgba(0,0,0,0.85)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "9999999";

  overlay.innerHTML = `
    <div style="position:relative;width:90%;max-width:900px;">
      <span id="closeOverlay" style="
        position:absolute;
        top:-40px;
        right:0;
        color:white;
        font-size:28px;
        cursor:pointer;
      ">✕</span>
      <img src="${src}" style="
        width:100%;
        border-radius:12px;
        box-shadow:0 10px 30px rgba(0,0,0,0.5);
      " />
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector("#closeOverlay").onclick = () => overlay.remove();
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };
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