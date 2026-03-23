class TutorEngine {

  constructor(config = {}) {
    this.config = {
      baseUrl: config.baseUrl || "https://backendnaveen.vercel.app/api/ai-tutor",
      apiKey: config.apiKey || null,
    };

    this.API_URL = this.config.baseUrl + "/generate";
    this.CHAT_START_URL = this.config.baseUrl + "/chat/start";
    this.CHAT_MESSAGE_URL = this.config.baseUrl + "/chat/message";

    this.state = {
      question: null,
      images: [],
      aiCache: {},
      chatHistory: [],
      chatSessionId: null,
      chatStarting: false,
    };
  }

  validateQuestion(q) {
    if (!q) return false;
    if (!q.text && (!q.images || q.images.length === 0)) return false;
    return true;
  }

  loadQuestion(q) {
    if (!this.validateQuestion(q)) {
      throw new Error("Invalid question payload");
    }
    this.state.question = q.text || "";
    this.state.images = q.images || [];
    this.state.chatHistory = [];
    this.state.chatSessionId = null;
    this.state.chatStarting = false;
  }

  async generateSolution() {
    const key = this.state.question + "_" + this.state.images.length;

    if (this.state.aiCache[key]) {
      return this.state.aiCache[key];
    }

    try {
      const res = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.config.apiKey && { "x-api-key": this.config.apiKey }),
        },
        body: JSON.stringify({
          problem: this.state.question,
          images: this.state.images,
        }),
      });

      const data = await res.json();

      if (!data || !data.structured_data) {
        throw new Error("Invalid AI response");
      }

      this.state.aiCache[key] = data;
      return data;
    } catch (err) {
      return { success: false, error: "AI_SERVER_ERROR" };
    }
  }

  async generateBreakdown() {
    return await this.generateSolution();
  }

  async startChatSession() {
    if (this.state.chatSessionId || this.state.chatStarting) {
      return { session_id: this.state.chatSessionId };
    }

    this.state.chatStarting = true;

    try {
      const res = await fetch(this.CHAT_START_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.config.apiKey && { "x-api-key": this.config.apiKey }),
        },
        body: JSON.stringify({
          problem: this.state.question,
          images: this.state.images,
        }),
      });

      const data = await res.json();

      if (!data.session_id) {
        throw new Error("Invalid session");
      }

      this.state.chatSessionId = data.session_id;
      this.state.chatStarting = false;
      this.state.chatHistory.push({
        type: "ai",
        text: data.message || "Let's begin.",
      });

      return data;
    } catch (e) {
      this.state.chatStarting = false;
      return { success: false, error: "CHAT_START_FAILED" };
    }
  }

  async sendMessage(message) {
    if (!message) return { success: false };
    if (!this.state.chatSessionId) {
      await this.startChatSession();
    }

    this.state.chatHistory.push({ type: "user", text: message });

    try {
      const res = await fetch(this.CHAT_MESSAGE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.config.apiKey && { "x-api-key": this.config.apiKey }),
        },
        body: JSON.stringify({
          session_id: this.state.chatSessionId,
          message: message,
        }),
      });

      const data = await res.json();
      this.state.chatHistory.push({ type: "ai", text: data.reply });
      return data;
    } catch (e) {
      this.state.chatHistory.push({
        type: "ai",
        text: "Server error while processing message.",
      });
      return { success: false };
    }
  }

  getChatHistory() {
    return this.state.chatHistory;
  }

  getSessionId() {
    return this.state.chatSessionId;
  }

  getQuestion() {
    return { text: this.state.question, images: this.state.images };
  }

  getCache() {
    return this.state.aiCache;
  }

  reset() {
    this.state = {
      question: null,
      images: [],
      aiCache: {},
      chatHistory: [],
      chatSessionId: null,
      chatStarting: false,
    };
  }

  destroy() {
    this.reset();
  }
}

export default TutorEngine;