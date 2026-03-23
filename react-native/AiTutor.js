import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
  StatusBar,
  Platform,
  SafeAreaView,
  KeyboardAvoidingView,
} from "react-native";

import TutorEngine from "../core/tutorEngine.js";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

/* =========================================================
   DEFAULT PROPS / CONFIG
   ========================================================= */

const THEMES = {
  light: {
    bg: "#ffffff",
    text: "#111827",
    card: "#f3f4f6",
    border: "#e5e7eb",
    subText: "#6b7280",
  },
  dark: {
    bg: "#111827",
    text: "#f9fafb",
    card: "#1f2937",
    border: "#374151",
    subText: "#9ca3af",
  },
};

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export default function AiTutor({
  question = "",
  images = [],
  baseUrl,
  apiKey,
  theme: initialTheme = "dark",
  enableChat = true,
  brandColor = "#6366f1",
  onClose,
}) {
  /* ---- engine ---- */
  const engineRef = useRef(
    new TutorEngine({ baseUrl, apiKey })
  );
  const engine = engineRef.current;

  /* ---- state ---- */
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("home"); // home | solution | breakdown | chat
  const [theme, setTheme] = useState(initialTheme === "dark" ? "dark" : "light");
  const [loading, setLoading] = useState(false);
  const [solutionData, setSolutionData] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatTyping, setChatTyping] = useState(false);
  const [fullscreenImg, setFullscreenImg] = useState(null);

  const scrollRef = useRef(null);
  const colors = THEMES[theme];

  /* ---- helpers ---- */

  function loadQuestion() {
    engine.loadQuestion({ text: question, images });
  }

  function openTutor() {
    loadQuestion();
    setMode("home");
    setSolutionData(null);
    setChatMessages([]);
    setOpen(true);
  }

  function closeTutor() {
    setOpen(false);
    if (onClose) onClose();
  }

  function goHome() {
    setMode("home");
    setSolutionData(null);
    setLoading(false);
  }

  function toggleTheme() {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }

  /* ---- API: solution / breakdown ---- */

  async function fetchAI(targetMode) {
    setMode(targetMode);
    setLoading(true);

    try {
      const res = await engine.generateSolution();

      if (res && res.success === false) {
        setSolutionData({ error: res.error || "AI_SERVER_ERROR" });
      } else {
        setSolutionData(res);
      }
    } catch {
      setSolutionData({ error: "AI_SERVER_ERROR" });
    }

    setLoading(false);
  }

  /* ---- API: chat ---- */

  async function startChat() {
    setMode("chat");
    setLoading(true);

    try {
      await engine.startChatSession();
      setChatMessages([...engine.getChatHistory()]);
    } catch {
      setChatMessages([{ type: "ai", text: "Unable to start AI session." }]);
    }

    setLoading(false);
  }

  async function sendChatMessage() {
    const msg = chatInput.trim();
    if (!msg) return;

    setChatInput("");
    setChatTyping(true);

    // Optimistically show user message
    const optimistic = [...engine.getChatHistory(), { type: "user", text: msg }];
    setChatMessages(optimistic);

    await engine.sendMessage(msg);
    setChatMessages([...engine.getChatHistory()]);
    setChatTyping(false);

    setTimeout(() => {
      scrollRef.current?.scrollToEnd?.({ animated: true });
    }, 100);
  }

  /* =========================================================
     RENDER: HOME
     ========================================================= */

  function renderHome() {
    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
      >
        {/* Question display */}
        <View style={[s.questionBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.questionText, { color: colors.text }]}>
            {question || "No question loaded"}
          </Text>
        </View>

        {/* Image thumbnails */}
        {images && images.length > 0 && (
          <View style={s.imageRow}>
            {images.map((img, i) => (
              <TouchableOpacity key={i} onPress={() => setFullscreenImg(img)}>
                <Image
                  source={{ uri: `data:image/png;base64,${img}` }}
                  style={[s.thumb, { borderColor: colors.border }]}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Section label */}
        <Text style={[s.widgetLabel, { color: colors.subText }]}>WIDGETS</Text>

        {/* Solution card */}
        <TouchableOpacity
          style={s.cardSolution}
          activeOpacity={0.85}
          onPress={() => fetchAI("solution")}
        >
          <Text style={s.cardTitle}>Solution</Text>
          <Text style={s.cardDesc}>
            Get the complete solution with explanation and visual aid.
          </Text>
        </TouchableOpacity>

        {/* Breakdown card */}
        <TouchableOpacity
          style={s.cardBreakdown}
          activeOpacity={0.85}
          onPress={() => fetchAI("breakdown")}
        >
          <Text style={s.cardTitle}>Deconstruction</Text>
          <Text style={s.cardDesc}>
            Guided reasoning — understand how to think like a pro.
          </Text>
        </TouchableOpacity>

        {/* Chat card */}
        {enableChat && (
          <TouchableOpacity
            style={s.cardChat}
            activeOpacity={0.85}
            onPress={startChat}
          >
            <Text style={s.cardTitle}>Chat</Text>
            <Text style={s.cardDesc}>
              Get hints and guidance until you reach the solution on your own.
            </Text>
            <View style={s.chatBubbleRow}>
              <View style={[s.chatBubble, { width: 70 }]} />
              <View style={[s.chatBubble, s.chatBubbleSmall]} />
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  }

  /* =========================================================
     RENDER: SOLUTION
     ========================================================= */

  function renderSolution() {
    if (loading) return <Loader colors={colors} />;

    if (!solutionData || solutionData.error) {
      return (
        <View style={{ padding: 20 }}>
          <Text style={{ color: colors.text }}>
            {solutionData?.error === "AI_SERVER_ERROR"
              ? "Error connecting to AI server."
              : "Failed to generate AI response."}
          </Text>
        </View>
      );
    }

    const sd = solutionData.structured_data || {};
    const img = solutionData.image;

    return (
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        {/* Header */}
        <Text style={[s.sectionHeader, { color: brandColor }]}>
          Complete Solution
        </Text>

        {/* Final answer */}
        {sd.final_answer ? (
          <View style={[s.answerBox, { borderColor: brandColor }]}>
            <Text style={[s.answerLabel, { color: colors.text }]}>Final Answer:</Text>
            <Text style={[s.answerText, { color: colors.text }]}>{sd.final_answer}</Text>
          </View>
        ) : null}

        {/* Explanation */}
        {sd.normal_explanation ? (
          <View style={[s.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.infoLabel, { color: colors.text }]}>Explanation</Text>
            <Text style={[s.infoBody, { color: colors.text }]}>{sd.normal_explanation}</Text>
          </View>
        ) : null}

        {/* Image */}
        {img && img.image_base64 ? (
          <TouchableOpacity
            style={s.solutionImageWrap}
            onPress={() => setFullscreenImg(`${img.mime_type};base64,${img.image_base64}`)}
          >
            <Image
              source={{ uri: `data:${img.mime_type};base64,${img.image_base64}` }}
              style={s.solutionImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    );
  }

  /* =========================================================
     RENDER: BREAKDOWN
     ========================================================= */

  function renderBreakdown() {
    if (loading) return <Loader colors={colors} />;

    if (!solutionData || solutionData.error) {
      return (
        <View style={{ padding: 20 }}>
          <Text style={{ color: colors.text }}>
            {solutionData?.error === "AI_SERVER_ERROR"
              ? "Error connecting to AI server."
              : "Failed to generate AI response."}
          </Text>
        </View>
      );
    }

    const sd = solutionData.structured_data || {};
    const img = solutionData.image;

    return (
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        {/* Header */}
        <Text style={[s.sectionHeader, { color: brandColor }]}>
          Guided Breakdown
        </Text>
        <Text style={[s.sectionSub, { color: colors.subText }]}>
          Understanding the reasoning behind the solution
        </Text>

        {/* Reasoning stages */}
        {sd.reasoning_stages && sd.reasoning_stages.length > 0 && (
          <>
            <Text style={[s.stageHeader, { color: brandColor }]}>
              🧭 Reasoning Path
            </Text>

            {sd.reasoning_stages.map((stage, i) => (
              <View
                key={i}
                style={[s.stageCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Text style={[s.stageTitle, { color: colors.text }]}>
                  Stage {stage.stage}
                </Text>

                {stage.goal ? (
                  <Text style={[s.stageMeta, { color: colors.subText }]}>
                    Goal: {stage.goal}
                  </Text>
                ) : null}

                {stage.concept_focus ? (
                  <Text style={[s.stageBody, { color: colors.text }]}>
                    Concept: {stage.concept_focus}
                  </Text>
                ) : null}

                {stage.expected_student_action ? (
                  <Text style={[s.stageBody, { color: colors.text }]}>
                    Action: {stage.expected_student_action}
                  </Text>
                ) : null}
              </View>
            ))}
          </>
        )}

        {/* Explanation */}
        {sd.normal_explanation ? (
          <View style={[s.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.infoLabel, { color: colors.text }]}>Explanation</Text>
            <Text style={[s.infoBody, { color: colors.text }]}>{sd.normal_explanation}</Text>
          </View>
        ) : null}

        {/* Final answer */}
        {sd.final_answer ? (
          <View style={[s.answerBox, { borderColor: brandColor }]}>
            <Text style={[s.answerLabel, { color: colors.text }]}>🎯 Final Answer</Text>
            <Text style={[s.answerText, { color: colors.text }]}>{sd.final_answer}</Text>
          </View>
        ) : null}

        {/* Key insights */}
        {sd.key_reasoning_lessons && sd.key_reasoning_lessons.length > 0 && (
          <>
            <Text style={[s.insightLabel, { color: colors.subText }]}>
              KEY INSIGHTS
            </Text>

            {sd.key_reasoning_lessons.map((lesson, i) => (
              <View
                key={i}
                style={[s.insightCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Text style={{ fontSize: 16, marginRight: 8 }}>💡</Text>
                <Text style={[s.insightText, { color: colors.text }]}>{lesson}</Text>
              </View>
            ))}
          </>
        )}

        {/* Image */}
        {img && img.image_base64 ? (
          <TouchableOpacity
            style={s.solutionImageWrap}
            onPress={() => setFullscreenImg(`${img.mime_type};base64,${img.image_base64}`)}
          >
            <Image
              source={{ uri: `data:${img.mime_type};base64,${img.image_base64}` }}
              style={s.solutionImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    );
  }

  /* =========================================================
     RENDER: CHAT
     ========================================================= */

  function renderChat() {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Mini nav */}
        <View style={s.miniNav}>
          <TouchableOpacity
            style={[s.miniBtn, { backgroundColor: brandColor }]}
            onPress={() => fetchAI("solution")}
          >
            <Text style={s.miniBtnText}>Go to solution</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.miniBtn, { backgroundColor: brandColor }]}
            onPress={() => fetchAI("breakdown")}
          >
            <Text style={s.miniBtnText}>Guided breakdown</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 14, paddingBottom: 10 }}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd?.({ animated: true })
          }
        >
          {chatMessages.map((m, i) => (
            <View
              key={i}
              style={[
                s.chatMsg,
                m.type === "user"
                  ? [s.chatUser, { backgroundColor: brandColor }]
                  : [s.chatAi, { backgroundColor: colors.card, borderColor: colors.border }],
              ]}
            >
              <Text style={{ color: m.type === "user" ? "#fff" : colors.text, fontSize: 14 }}>
                {m.text}
              </Text>
            </View>
          ))}

          {chatTyping && (
            <View style={[s.chatMsg, s.chatAi, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={{ color: colors.subText, fontSize: 13 }}>typing...</Text>
            </View>
          )}

          {loading && chatMessages.length === 0 && (
            <ActivityIndicator color={brandColor} style={{ marginTop: 20 }} />
          )}
        </ScrollView>

        {/* Input */}
        <View style={[s.chatFooter, { borderColor: colors.border }]}>
          <TextInput
            value={chatInput}
            onChangeText={setChatInput}
            placeholder="Ask your doubt..."
            placeholderTextColor={colors.subText}
            style={[
              s.chatInput,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            onSubmitEditing={sendChatMessage}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[s.chatSendBtn, { backgroundColor: brandColor }]}
            onPress={sendChatMessage}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  /* =========================================================
     RENDER: FULLSCREEN IMAGE MODAL
     ========================================================= */

  function renderFullscreenImage() {
    if (!fullscreenImg) return null;

    // Support both raw base64 and full data URI
    const uri = fullscreenImg.startsWith("data:")
      ? fullscreenImg
      : `data:${fullscreenImg}`;

    return (
      <Modal visible transparent animationType="fade">
        <View style={s.fullscreenOverlay}>
          <TouchableOpacity style={s.fullscreenClose} onPress={() => setFullscreenImg(null)}>
            <Text style={{ color: "#fff", fontSize: 22 }}>✕</Text>
          </TouchableOpacity>
          <Image
            source={{ uri }}
            style={s.fullscreenImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    );
  }

  /* =========================================================
     MAIN RETURN
     ========================================================= */

  return (
    <>
      {/* Floating button */}
      <TouchableOpacity
        style={[s.floating, { backgroundColor: brandColor }]}
        onPress={openTutor}
        activeOpacity={0.85}
      >
        <Text style={{ fontSize: 26 }}>🤖</Text>
      </TouchableOpacity>

      {/* Panel modal */}
      <Modal visible={open} animationType="slide" onRequestClose={closeTutor}>
        <SafeAreaView style={[s.panel, { backgroundColor: colors.bg }]}>
          <StatusBar
            barStyle={theme === "dark" ? "light-content" : "dark-content"}
          />

          {/* Header */}
          <View style={[s.header, { backgroundColor: brandColor }]}>
            <Text style={s.headerTitle}>AI Tutor</Text>
            <View style={s.headerIcons}>
              <TouchableOpacity onPress={toggleTheme} style={s.headerBtn}>
                <Text style={{ fontSize: 18 }}>
                  {theme === "light" ? "🌙" : "☀️"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={closeTutor} style={s.headerBtn}>
                <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Back bar (non-home) */}
          {mode !== "home" && (
            <TouchableOpacity style={[s.backBar, { borderColor: colors.border }]} onPress={goHome}>
              <Text style={{ color: colors.text, fontSize: 14 }}>← Back</Text>
            </TouchableOpacity>
          )}

          {/* Content */}
          <View style={{ flex: 1 }}>
            {mode === "home" && renderHome()}
            {mode === "solution" && renderSolution()}
            {mode === "breakdown" && renderBreakdown()}
            {mode === "chat" && renderChat()}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Fullscreen image */}
      {renderFullscreenImage()}
    </>
  );
}

/* =========================================================
   LOADER COMPONENT
   ========================================================= */

function Loader({ colors }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 40 }}>
      <ActivityIndicator size="large" color="#6366f1" />
      <Text style={{ color: colors.text, fontWeight: "600", marginTop: 14, fontSize: 15 }}>
        🧠 Processing...
      </Text>
      <Text style={{ color: colors.subText, fontSize: 13, marginTop: 4 }}>
        Generating structured intelligence
      </Text>
    </View>
  );
}

/* =========================================================
   STYLES
   ========================================================= */

const s = StyleSheet.create({

  /* Floating button */
  floating: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },

  /* Panel */
  panel: {
    flex: 1,
  },

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  headerBtn: {
    padding: 4,
  },

  /* Back bar */
  backBar: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },

  /* Home: question box */
  questionBox: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 18,
  },
  questionText: {
    fontSize: 14,
    lineHeight: 20,
  },

  /* Home: image row */
  imageRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18,
  },
  thumb: {
    width: 70,
    height: 70,
    borderRadius: 8,
    borderWidth: 1,
  },

  /* Home: widgets label */
  widgetLabel: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    marginBottom: 16,
    paddingLeft: 4,
  },

  /* Home: cards */
  cardSolution: {
    padding: 15,
    borderRadius: 2,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.5)",
    backgroundColor: "#2a3341",
  },
  cardBreakdown: {
    padding: 15,
    borderRadius: 2,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.5)",
    backgroundColor: "#1e293b",
  },
  cardChat: {
    padding: 15,
    borderRadius: 2,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.5)",
    backgroundColor: "#0f172a",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 20,
    marginBottom: 10,
  },

  /* Chat preview bubbles on home */
  chatBubbleRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  chatBubble: {
    height: 28,
    backgroundColor: "#22c55e",
    borderRadius: 20,
    opacity: 0.9,
  },
  chatBubbleSmall: {
    width: 40,
    backgroundColor: "#16a34a",
    opacity: 0.7,
  },

  /* Solution / Breakdown shared */
  sectionHeader: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 13,
    marginBottom: 18,
  },
  answerBox: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: "rgba(99,102,241,0.08)",
    marginBottom: 12,
  },
  answerLabel: {
    fontWeight: "600",
    marginBottom: 6,
  },
  answerText: {
    fontSize: 15,
    fontWeight: "600",
  },
  infoBox: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  infoLabel: {
    fontWeight: "700",
    marginBottom: 8,
  },
  infoBody: {
    fontSize: 14,
    lineHeight: 22,
  },

  /* Breakdown: stages */
  stageHeader: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 12,
  },
  stageCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  stageTitle: {
    fontWeight: "600",
    marginBottom: 6,
  },
  stageMeta: {
    fontSize: 13,
    marginBottom: 6,
  },
  stageBody: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
  },

  /* Breakdown: insights */
  insightLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 8,
  },
  insightCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },

  /* Solution image */
  solutionImageWrap: {
    marginTop: 18,
    alignItems: "center",
  },
  solutionImage: {
    width: "100%",
    height: 250,
    borderRadius: 12,
  },

  /* Chat: mini nav */
  miniNav: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  miniBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  miniBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },

  /* Chat: messages */
  chatMsg: {
    padding: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    maxWidth: "80%",
    marginBottom: 8,
  },
  chatUser: {
    alignSelf: "flex-end",
  },
  chatAi: {
    alignSelf: "flex-start",
    borderWidth: 1,
  },

  /* Chat: footer */
  chatFooter: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  chatInput: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 14,
  },
  chatSendBtn: {
    padding: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },

  /* Fullscreen image */
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  fullscreenClose: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  fullscreenImage: {
    width: SCREEN_W * 0.92,
    height: SCREEN_H * 0.7,
    borderRadius: 12,
  },
});