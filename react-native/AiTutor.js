import React, { useState, useRef, useEffect, useCallback } from "react";
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
  Animated,
  Easing,
} from "react-native";

import TutorEngine from "../core/TutorEngine.js";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

/* =========================================================
   DESIGN SYSTEM — 2026 PREMIUM
   ========================================================= */

const PALETTE = {
  dark: {
    bg: "#0B0F1A",
    surface: "#121829",
    surfaceElevated: "#1A2138",
    surfaceGlass: "rgba(26, 33, 56, 0.65)",
    text: "#F0F2F8",
    textSecondary: "#8B93A7",
    textMuted: "#5A6178",
    border: "rgba(255,255,255,0.06)",
    borderLight: "rgba(255,255,255,0.03)",
    accent: "#818CF8",
    accentSoft: "rgba(129,140,248,0.12)",
    accentGlow: "rgba(129,140,248,0.25)",
    success: "#34D399",
    successSoft: "rgba(52,211,153,0.12)",
    purple: "#A78BFA",
    purpleSoft: "rgba(167,139,250,0.12)",
    chatUser: "#818CF8",
    chatAi: "#1A2138",
    overlay: "rgba(0,0,0,0.85)",
  },
  light: {
    bg: "#F8F9FC",
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    surfaceGlass: "rgba(255,255,255,0.72)",
    text: "#0F1629",
    textSecondary: "#64748B",
    textMuted: "#94A3B8",
    border: "rgba(0,0,0,0.06)",
    borderLight: "rgba(0,0,0,0.03)",
    accent: "#6366F1",
    accentSoft: "rgba(99,102,241,0.08)",
    accentGlow: "rgba(99,102,241,0.15)",
    success: "#10B981",
    successSoft: "rgba(16,185,129,0.08)",
    purple: "#8B5CF6",
    purpleSoft: "rgba(139,92,246,0.08)",
    chatUser: "#6366F1",
    chatAi: "#F1F5F9",
    overlay: "rgba(0,0,0,0.6)",
  },
};

const TYPE = {
  hero: { fontSize: 26, fontWeight: "700", letterSpacing: -0.5 },
  h1: { fontSize: 20, fontWeight: "700", letterSpacing: -0.3 },
  h2: { fontSize: 17, fontWeight: "600", letterSpacing: -0.2 },
  h3: { fontSize: 15, fontWeight: "600" },
  body: { fontSize: 14, fontWeight: "400", lineHeight: 21 },
  bodySmall: { fontSize: 13, fontWeight: "400", lineHeight: 19 },
  caption: { fontSize: 11, fontWeight: "600", letterSpacing: 1.2, textTransform: "uppercase" },
  label: { fontSize: 12, fontWeight: "500" },
};

const RADIUS = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 24,
  full: 999,
};

const SHADOW = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  elevated: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  glow: (color) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  }),
};

/* =========================================================
   ANIMATED COMPONENTS
   ========================================================= */

function PulsingDot({ color, delay = 0 }) {
  const anim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View
      style={{
        width: 7, height: 7, borderRadius: 3.5,
        backgroundColor: color, opacity: anim, marginHorizontal: 2,
      }}
    />
  );
}

function TypingIndicator({ color }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 4 }}>
      <PulsingDot color={color} delay={0} />
      <PulsingDot color={color} delay={150} />
      <PulsingDot color={color} delay={300} />
    </View>
  );
}

function FadeInView({ children, delay = 0, style }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: 400, delay, useNativeDriver: true, easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(translateY, {
        toValue: 0, duration: 400, delay, useNativeDriver: true, easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

/* =========================================================
   SHIMMER LOADER
   ========================================================= */

function ShimmerLoader({ c }) {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease),
      })
    ).start();
  }, []);
  const opacity = shimmer.interpolate({
    inputRange: [0, 0.5, 1], outputRange: [0.3, 0.7, 0.3],
  });
  return (
    <View style={{ flex: 1, padding: 24, gap: 16 }}>
      <Animated.View style={{ height: 22, width: "55%", borderRadius: RADIUS.sm, backgroundColor: c.surfaceElevated, opacity }} />
      {[1, 2, 3].map((i) => (
        <Animated.View key={i} style={{ height: 80 + i * 10, borderRadius: RADIUS.md, backgroundColor: c.surfaceElevated, opacity }} />
      ))}
      <View style={{ alignItems: "center", marginTop: 12 }}>
        <Text style={[TYPE.h3, { color: c.accent }]}>Analyzing problem...</Text>
        <Text style={[TYPE.bodySmall, { color: c.textMuted, marginTop: 4 }]}>Building structured reasoning</Text>
      </View>
    </View>
  );
}

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
  brandColor,
  fabImage = null,
  onPickImage = null,   // () => Promise<string[]>  — returns base64 array
  onClose,
}) {
  const engineRef = useRef(new TutorEngine({ baseUrl, apiKey }));
  const engine = engineRef.current;
  const loadedQuestionRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("home");
  const [theme, setTheme] = useState(initialTheme === "light" ? "light" : "dark");
  const [loading, setLoading] = useState(false);
  const [solutionData, setSolutionData] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatTyping, setChatTyping] = useState(false);
  const [fullscreenImg, setFullscreenImg] = useState(null);
  const [pendingImages, setPendingImages] = useState([]);

  const scrollRef = useRef(null);
  const fabScale = useRef(new Animated.Value(1)).current;
  const c = PALETTE[theme];

  /* ---- FAB pulse ---- */
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(fabScale, { toValue: 1.08, duration: 1200, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(fabScale, { toValue: 1, duration: 1200, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  /* ---- core logic ---- */

  function loadQuestionIfNeeded() {
    const key = question + "_" + (images ? images.length : 0);
    if (loadedQuestionRef.current === key) return false;
    engine.loadQuestion({ text: question, images });
    loadedQuestionRef.current = key;
    setSolutionData(null);
    setChatMessages([]);
    return true;
  }

  function openTutor() {
    loadQuestionIfNeeded();
    setMode("home");
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

  async function startChat() {
    setMode("chat");
    if (engine.getSessionId()) {
      setChatMessages([...engine.getChatHistory()]);
      return;
    }
    setLoading(true);
    try {
      await engine.startChatSession();
      setChatMessages([...engine.getChatHistory()]);
    } catch {
      setChatMessages([{ type: "ai", text: "Unable to start AI session." }]);
    }
    setLoading(false);
  }

  /* ---- Chat: pick images ---- */

  async function handlePickImage() {
    if (!onPickImage) return;
    try {
      const picked = await onPickImage();
      if (picked && picked.length > 0) {
        setPendingImages((prev) => [...prev, ...picked]);
      }
    } catch {
      // user cancelled or error — ignore
    }
  }

  function removePendingImage(index) {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  }

  /* ---- Chat: send message ---- */

  async function sendChatMessage() {
    const msg = chatInput.trim();
    const imagesToSend = [...pendingImages];

    // Need at least text or images
    if (!msg && imagesToSend.length === 0) return;

    // Clear inputs immediately
    setChatInput("");
    setPendingImages([]);
    setChatTyping(true);

    // Optimistic UI — show user message with thumbnails
    const optimistic = [
      ...engine.getChatHistory(),
      {
        type: "user",
        text: msg,
        images: imagesToSend.length > 0 ? imagesToSend : null,
      },
    ];
    setChatMessages(optimistic);

    // Send to engine
    await engine.sendMessage(
      msg || "",
      imagesToSend.length > 0 ? imagesToSend : null
    );

    setChatMessages([...engine.getChatHistory()]);
    setChatTyping(false);
    setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 100);
  }

  /* =========================================================
     RENDER: HOME
     ========================================================= */

  function renderHome() {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <FadeInView delay={0}>
          <View style={{ alignItems: "center", marginTop: 8, marginBottom: 28 }}>
            <View style={[{ width: 64, height: 64, borderRadius: 32, backgroundColor: c.surfaceElevated, alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 2, borderColor: c.accentGlow }, SHADOW.glow(c.accent)]}>
              <Text style={{ fontSize: 28 }}>🧠</Text>
            </View>
            <Text style={[TYPE.hero, { color: c.text, textAlign: "center" }]}>
              What would you{"\n"}like to explore?
            </Text>
          </View>
        </FadeInView>

        <FadeInView delay={80}>
          <View style={[{ backgroundColor: c.surfaceElevated, borderRadius: RADIUS.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: c.border }, SHADOW.card]}>
            <Text style={[TYPE.caption, { color: c.textMuted, marginBottom: 8 }]}>YOUR QUESTION</Text>
            <Text style={[TYPE.body, { color: c.text }]}>{question || "No question loaded"}</Text>
          </View>
        </FadeInView>

        {images && images.length > 0 && (
          <FadeInView delay={120}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 10 }}>
              {images.map((img, i) => (
                <TouchableOpacity key={i} onPress={() => setFullscreenImg(`data:image/png;base64,${img}`)} activeOpacity={0.8}>
                  <Image source={{ uri: `data:image/png;base64,${img}` }} style={{ width: 72, height: 72, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: c.border }} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </FadeInView>
        )}

        <FadeInView delay={160}>
          <Text style={[TYPE.caption, { color: c.textMuted, marginBottom: 14, marginTop: 8 }]}>CHOOSE A MODE</Text>
        </FadeInView>

        {/* Solution card */}
        <FadeInView delay={200}>
          <TouchableOpacity activeOpacity={0.88} onPress={() => fetchAI("solution")} style={[{ borderRadius: RADIUS.lg, padding: 20, marginBottom: 14, backgroundColor: c.accentSoft, borderWidth: 1, borderColor: c.accentGlow }, SHADOW.card]}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: c.accent, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                <Text style={{ fontSize: 16, color: "#fff" }}>✦</Text>
              </View>
              <Text style={[TYPE.h2, { color: c.text, flex: 1 }]}>Solution</Text>
              <Text style={{ color: c.textMuted, fontSize: 18 }}>→</Text>
            </View>
            <Text style={[TYPE.bodySmall, { color: c.textSecondary }]}>Complete answer with step-by-step explanation and visual breakdown.</Text>
          </TouchableOpacity>
        </FadeInView>

        {/* Breakdown card */}
        <FadeInView delay={280}>
          <TouchableOpacity activeOpacity={0.88} onPress={() => fetchAI("breakdown")} style={[{ borderRadius: RADIUS.lg, padding: 20, marginBottom: 14, backgroundColor: c.purpleSoft, borderWidth: 1, borderColor: "rgba(167,139,250,0.18)" }, SHADOW.card]}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: c.purple, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                <Text style={{ fontSize: 16, color: "#fff" }}>🧭</Text>
              </View>
              <Text style={[TYPE.h2, { color: c.text, flex: 1 }]}>Deconstruction</Text>
              <Text style={{ color: c.textMuted, fontSize: 18 }}>→</Text>
            </View>
            <Text style={[TYPE.bodySmall, { color: c.textSecondary }]}>Guided reasoning path — learn how to think through each stage like a pro.</Text>
          </TouchableOpacity>
        </FadeInView>

        {/* Chat card */}
        {enableChat && (
          <FadeInView delay={360}>
            <TouchableOpacity activeOpacity={0.88} onPress={startChat} style={[{ borderRadius: RADIUS.lg, padding: 20, marginBottom: 14, backgroundColor: c.successSoft, borderWidth: 1, borderColor: "rgba(52,211,153,0.18)" }, SHADOW.card]}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: c.success, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                  <Text style={{ fontSize: 16, color: "#fff" }}>💬</Text>
                </View>
                <Text style={[TYPE.h2, { color: c.text, flex: 1 }]}>Chat</Text>
                <Text style={{ color: c.textMuted, fontSize: 18 }}>→</Text>
              </View>
              <Text style={[TYPE.bodySmall, { color: c.textSecondary }]}>Interactive conversation — get hints and guidance until you reach the answer yourself.</Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
                <View style={{ height: 24, width: 60, borderRadius: 12, backgroundColor: c.success, opacity: 0.4 }} />
                <View style={{ height: 24, width: 36, borderRadius: 12, backgroundColor: c.success, opacity: 0.25 }} />
              </View>
            </TouchableOpacity>
          </FadeInView>
        )}
      </ScrollView>
    );
  }

  /* =========================================================
     RENDER: SOLUTION
     ========================================================= */

  function renderSolution() {
    if (loading) return <ShimmerLoader c={c} />;
    if (!solutionData || solutionData.error) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>⚠️</Text>
          <Text style={[TYPE.h3, { color: c.text, textAlign: "center" }]}>
            {solutionData?.error === "AI_SERVER_ERROR" ? "Couldn't reach the AI server" : "Failed to generate a response"}
          </Text>
          <TouchableOpacity onPress={() => fetchAI("solution")} style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: RADIUS.full, backgroundColor: c.accentSoft }}>
            <Text style={[TYPE.label, { color: c.accent }]}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    const sd = solutionData.structured_data || {};
    const img = solutionData.image;
    return (
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <FadeInView delay={0}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: c.accent, alignItems: "center", justifyContent: "center", marginRight: 10 }}>
              <Text style={{ color: "#fff", fontSize: 14 }}>✦</Text>
            </View>
            <Text style={[TYPE.h1, { color: c.text }]}>Complete Solution</Text>
          </View>
        </FadeInView>
        {sd.final_answer ? (
          <FadeInView delay={80}>
            <View style={{ padding: 18, borderRadius: RADIUS.lg, backgroundColor: c.accentSoft, borderWidth: 1, borderColor: c.accentGlow, marginBottom: 16 }}>
              <Text style={[TYPE.caption, { color: c.accent, marginBottom: 8 }]}>FINAL ANSWER</Text>
              <Text style={[TYPE.h2, { color: c.text }]}>{sd.final_answer}</Text>
            </View>
          </FadeInView>
        ) : null}
        {sd.normal_explanation ? (
          <FadeInView delay={160}>
            <View style={[{ padding: 18, borderRadius: RADIUS.lg, backgroundColor: c.surfaceElevated, borderWidth: 1, borderColor: c.border, marginBottom: 16 }, SHADOW.card]}>
              <Text style={[TYPE.h3, { color: c.text, marginBottom: 10 }]}>Explanation</Text>
              <Text style={[TYPE.body, { color: c.textSecondary }]}>{sd.normal_explanation}</Text>
            </View>
          </FadeInView>
        ) : null}
        {img && img.image_base64 ? (
          <FadeInView delay={240}>
            <TouchableOpacity onPress={() => setFullscreenImg(`data:${img.mime_type};base64,${img.image_base64}`)} activeOpacity={0.9} style={{ marginTop: 4 }}>
              <Image source={{ uri: `data:${img.mime_type};base64,${img.image_base64}` }} style={{ width: "100%", height: 220, borderRadius: RADIUS.lg }} resizeMode="contain" />
              <Text style={[TYPE.label, { color: c.textMuted, textAlign: "center", marginTop: 8 }]}>Tap to expand</Text>
            </TouchableOpacity>
          </FadeInView>
        ) : null}
      </ScrollView>
    );
  }

  /* =========================================================
     RENDER: BREAKDOWN
     ========================================================= */

  function renderBreakdown() {
    if (loading) return <ShimmerLoader c={c} />;
    if (!solutionData || solutionData.error) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>⚠️</Text>
          <Text style={[TYPE.h3, { color: c.text, textAlign: "center" }]}>
            {solutionData?.error === "AI_SERVER_ERROR" ? "Couldn't reach the AI server" : "Failed to generate a response"}
          </Text>
          <TouchableOpacity onPress={() => fetchAI("breakdown")} style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: RADIUS.full, backgroundColor: c.purpleSoft }}>
            <Text style={[TYPE.label, { color: c.purple }]}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    const sd = solutionData.structured_data || {};
    const img = solutionData.image;
    return (
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <FadeInView delay={0}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: c.purple, alignItems: "center", justifyContent: "center", marginRight: 10 }}>
              <Text style={{ color: "#fff", fontSize: 14 }}>🧭</Text>
            </View>
            <Text style={[TYPE.h1, { color: c.text }]}>Guided Breakdown</Text>
          </View>
          <Text style={[TYPE.bodySmall, { color: c.textMuted, marginBottom: 22, marginLeft: 42 }]}>Understanding the reasoning behind the solution</Text>
        </FadeInView>

        {sd.reasoning_stages && sd.reasoning_stages.length > 0 && (
          <>
            <FadeInView delay={60}>
              <Text style={[TYPE.caption, { color: c.purple, marginBottom: 14 }]}>REASONING PATH</Text>
            </FadeInView>
            {sd.reasoning_stages.map((stage, i) => (
              <FadeInView key={i} delay={120 + i * 80}>
                <View style={[{ padding: 18, borderRadius: RADIUS.lg, backgroundColor: c.surfaceElevated, borderWidth: 1, borderColor: c.border, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: c.purple }, SHADOW.card]}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                    <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: RADIUS.full, backgroundColor: c.purpleSoft, marginRight: 10 }}>
                      <Text style={[TYPE.label, { color: c.purple }]}>Stage {stage.stage}</Text>
                    </View>
                  </View>
                  {stage.goal ? (<View style={{ marginBottom: 8 }}><Text style={[TYPE.label, { color: c.textMuted, marginBottom: 2 }]}>Goal</Text><Text style={[TYPE.bodySmall, { color: c.textSecondary }]}>{stage.goal}</Text></View>) : null}
                  {stage.concept_focus ? (<View style={{ marginBottom: 8 }}><Text style={[TYPE.label, { color: c.textMuted, marginBottom: 2 }]}>Concept</Text><Text style={[TYPE.body, { color: c.text }]}>{stage.concept_focus}</Text></View>) : null}
                  {stage.expected_student_action ? (<View><Text style={[TYPE.label, { color: c.textMuted, marginBottom: 2 }]}>Action</Text><Text style={[TYPE.body, { color: c.text }]}>{stage.expected_student_action}</Text></View>) : null}
                </View>
              </FadeInView>
            ))}
          </>
        )}

        {sd.normal_explanation ? (
          <FadeInView delay={120 + (sd.reasoning_stages?.length || 0) * 80}>
            <View style={[{ padding: 18, borderRadius: RADIUS.lg, backgroundColor: c.surfaceElevated, borderWidth: 1, borderColor: c.border, marginBottom: 16 }, SHADOW.card]}>
              <Text style={[TYPE.h3, { color: c.text, marginBottom: 10 }]}>Explanation</Text>
              <Text style={[TYPE.body, { color: c.textSecondary }]}>{sd.normal_explanation}</Text>
            </View>
          </FadeInView>
        ) : null}

        {sd.final_answer ? (
          <FadeInView delay={200 + (sd.reasoning_stages?.length || 0) * 80}>
            <View style={{ padding: 18, borderRadius: RADIUS.lg, backgroundColor: c.accentSoft, borderWidth: 1, borderColor: c.accentGlow, marginBottom: 16 }}>
              <Text style={[TYPE.caption, { color: c.accent, marginBottom: 8 }]}>🎯 FINAL ANSWER</Text>
              <Text style={[TYPE.h2, { color: c.text }]}>{sd.final_answer}</Text>
            </View>
          </FadeInView>
        ) : null}

        {sd.key_reasoning_lessons && sd.key_reasoning_lessons.length > 0 && (
          <>
            <Text style={[TYPE.caption, { color: c.textMuted, marginBottom: 12, marginTop: 4 }]}>KEY INSIGHTS</Text>
            {sd.key_reasoning_lessons.map((lesson, i) => (
              <FadeInView key={i} delay={280 + i * 60}>
                <View style={[{ flexDirection: "row", alignItems: "flex-start", padding: 14, borderRadius: RADIUS.md, backgroundColor: c.surfaceElevated, borderWidth: 1, borderColor: c.border, marginBottom: 10 }]}>
                  <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: "rgba(250,204,21,0.12)", alignItems: "center", justifyContent: "center", marginRight: 12, marginTop: 1 }}>
                    <Text style={{ fontSize: 13 }}>💡</Text>
                  </View>
                  <Text style={[TYPE.bodySmall, { color: c.textSecondary, flex: 1 }]}>{lesson}</Text>
                </View>
              </FadeInView>
            ))}
          </>
        )}

        {img && img.image_base64 ? (
          <FadeInView delay={340}>
            <TouchableOpacity onPress={() => setFullscreenImg(`data:${img.mime_type};base64,${img.image_base64}`)} activeOpacity={0.9} style={{ marginTop: 8 }}>
              <Image source={{ uri: `data:${img.mime_type};base64,${img.image_base64}` }} style={{ width: "100%", height: 220, borderRadius: RADIUS.lg }} resizeMode="contain" />
              <Text style={[TYPE.label, { color: c.textMuted, textAlign: "center", marginTop: 8 }]}>Tap to expand</Text>
            </TouchableOpacity>
          </FadeInView>
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
        {/* Pill switcher */}
        <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border }}>
          <TouchableOpacity style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.full, backgroundColor: c.accentSoft, borderWidth: 1, borderColor: c.accentGlow }} onPress={() => fetchAI("solution")}>
            <Text style={[TYPE.label, { color: c.accent }]}>✦ Solution</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.full, backgroundColor: c.purpleSoft, borderWidth: 1, borderColor: "rgba(167,139,250,0.15)" }} onPress={() => fetchAI("breakdown")}>
            <Text style={[TYPE.label, { color: c.purple }]}>🧭 Breakdown</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd?.({ animated: true })}
        >
          {chatMessages.map((m, i) => (
            <FadeInView key={i} delay={0} style={{ marginBottom: 10 }}>
              {m.type === "ai" && (
                <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8, maxWidth: "85%" }}>
                  <View style={{ width: 28, height: 28, borderRadius: 10, backgroundColor: c.surfaceElevated, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: c.border, marginBottom: 2 }}>
                    <Text style={{ fontSize: 13 }}>🧠</Text>
                  </View>
                  <View style={{ padding: 12, paddingHorizontal: 16, borderRadius: RADIUS.lg, borderTopLeftRadius: RADIUS.xs, backgroundColor: c.chatAi, borderWidth: 1, borderColor: c.border, flex: 1 }}>
                    <Text style={[TYPE.body, { color: c.text }]}>{m.text}</Text>
                  </View>
                </View>
              )}
              {m.type === "user" && (
                <View style={{ alignItems: "flex-end" }}>
                  <View style={{ padding: 12, paddingHorizontal: 16, borderRadius: RADIUS.lg, borderTopRightRadius: RADIUS.xs, backgroundColor: c.chatUser, maxWidth: "80%" }}>
                    {/* Image thumbnails in bubble */}
                    {m.images && m.images.length > 0 && (
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: m.text ? 8 : 0 }}>
                        {m.images.map((img, j) => (
                          <TouchableOpacity key={j} onPress={() => setFullscreenImg(`data:image/png;base64,${img}`)}>
                            <Image
                              source={{ uri: `data:image/png;base64,${img}` }}
                              style={{ width: 56, height: 56, borderRadius: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" }}
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                    {m.text ? <Text style={[TYPE.body, { color: "#fff" }]}>{m.text}</Text> : null}
                  </View>
                </View>
              )}
            </FadeInView>
          ))}

          {chatTyping && (
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8, marginTop: 4 }}>
              <View style={{ width: 28, height: 28, borderRadius: 10, backgroundColor: c.surfaceElevated, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: c.border }}>
                <Text style={{ fontSize: 13 }}>🧠</Text>
              </View>
              <View style={{ padding: 14, borderRadius: RADIUS.lg, borderTopLeftRadius: RADIUS.xs, backgroundColor: c.chatAi, borderWidth: 1, borderColor: c.border }}>
                <TypingIndicator color={c.textMuted} />
              </View>
            </View>
          )}

          {loading && chatMessages.length === 0 && (
            <View style={{ alignItems: "center", marginTop: 40 }}>
              <ActivityIndicator color={c.accent} />
              <Text style={[TYPE.bodySmall, { color: c.textMuted, marginTop: 10 }]}>Starting session...</Text>
            </View>
          )}
        </ScrollView>

        {/* Pending image preview strip */}
        {pendingImages.length > 0 && (
          <View style={{ flexDirection: "row", paddingHorizontal: 14, paddingVertical: 8, gap: 8, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.bg }}>
            {pendingImages.map((img, i) => (
              <View key={i} style={{ position: "relative" }}>
                <Image
                  source={{ uri: `data:image/png;base64,${img}` }}
                  style={{ width: 52, height: 52, borderRadius: 8, borderWidth: 1, borderColor: c.border }}
                />
                <TouchableOpacity
                  onPress={() => removePendingImage(i)}
                  style={{
                    position: "absolute", top: -6, right: -6,
                    width: 20, height: 20, borderRadius: 10,
                    backgroundColor: "#EF4444",
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Input bar */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: c.border, gap: 8, backgroundColor: c.bg }}>
          {/* Attach button — only if onPickImage provided */}
         {onPickImage && (
  <TouchableOpacity
    onPress={handlePickImage}
    activeOpacity={0.7}
    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    style={{
      width: 44, height: 44, borderRadius: 12,
      backgroundColor: c.surfaceElevated,
      alignItems: "center", justifyContent: "center",
      borderWidth: 1, borderColor: c.border,
      zIndex: 10,
    }}
  >
              <Text style={{ fontSize: 18 }}>📎</Text>
            </TouchableOpacity>
          )}

          {/* Text input */}
          <View style={{
            flex: 1, flexDirection: "row", alignItems: "center",
            backgroundColor: c.surfaceElevated, borderRadius: RADIUS.xl,
            borderWidth: 1, borderColor: c.border,
            paddingHorizontal: 16,
            paddingVertical: Platform.OS === "ios" ? 10 : 0,
          }}>
            <TextInput
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Ask your doubt..."
              placeholderTextColor={c.textMuted}
              style={[TYPE.body, { color: c.text, flex: 1 }]}
              onSubmitEditing={sendChatMessage}
              returnKeyType="send"
            />
          </View>

          {/* Send button */}
          <TouchableOpacity
            onPress={sendChatMessage}
            activeOpacity={0.8}
            style={[
              {
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: c.accent,
                alignItems: "center", justifyContent: "center",
              },
              (chatInput.trim() || pendingImages.length > 0) ? SHADOW.glow(c.accent) : {},
            ]}
          >
            <Text style={{ color: "#fff", fontSize: 18 }}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  /* =========================================================
     FULLSCREEN IMAGE
     ========================================================= */

  function renderFullscreenImage() {
    if (!fullscreenImg) return null;
    const uri = fullscreenImg.startsWith("data:") ? fullscreenImg : `data:${fullscreenImg}`;
    return (
      <Modal visible transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: c.overlay, alignItems: "center", justifyContent: "center" }}>
          <TouchableOpacity style={{ position: "absolute", top: 54, right: 20, zIndex: 10, padding: 8 }} onPress={() => setFullscreenImg(null)}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: "#fff", fontSize: 18 }}>✕</Text>
            </View>
          </TouchableOpacity>
          <Image source={{ uri }} style={{ width: SCREEN_W * 0.92, height: SCREEN_H * 0.65, borderRadius: RADIUS.lg }} resizeMode="contain" />
        </View>
      </Modal>
    );
  }

  /* =========================================================
     MAIN RETURN
     ========================================================= */

  return (
    <>
      {/* FAB */}
      <Animated.View style={{ position: "absolute", bottom: 30, right: 20, transform: [{ scale: fabScale }] }}>
        <TouchableOpacity
          onPress={openTutor}
          activeOpacity={0.85}
          style={[
            { width: 60, height: 60, borderRadius: 22, backgroundColor: fabImage ? "transparent" : c.accent, alignItems: "center", justifyContent: "center", overflow: "hidden" },
            fabImage ? {} : SHADOW.glow(c.accent),
          ]}
        >
          {fabImage ? (
            <Image source={fabImage} style={{ width: 60, height: 60, borderRadius: 22 }} resizeMode="cover" />
          ) : (
            <Text style={{ fontSize: 26 }}>🤖</Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Panel */}
      <Modal visible={open} animationType="slide" onRequestClose={closeTutor}>
        <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
          <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />

          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.border, backgroundColor: c.bg }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              {mode !== "home" ? (
                <TouchableOpacity onPress={goHome} style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: c.surfaceElevated, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: c.border }}>
                  <Text style={{ color: c.text, fontSize: 16 }}>←</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: c.accentSoft, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 16 }}>🧠</Text>
                </View>
              )}
              <Text style={[TYPE.h2, { color: c.text }]}>
                {mode === "home" ? "AI Tutor" : mode === "solution" ? "Solution" : mode === "breakdown" ? "Breakdown" : "Chat"}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <TouchableOpacity onPress={toggleTheme} style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: c.surfaceElevated, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: c.border }}>
                <Text style={{ fontSize: 15 }}>{theme === "light" ? "🌙" : "☀️"}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={closeTutor} style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: c.surfaceElevated, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: c.border }}>
                <Text style={{ color: c.text, fontSize: 15, fontWeight: "600" }}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <View style={{ flex: 1 }}>
            {mode === "home" && renderHome()}
            {mode === "solution" && renderSolution()}
            {mode === "breakdown" && renderBreakdown()}
            {mode === "chat" && renderChat()}
          </View>
        </SafeAreaView>
      </Modal>

      {renderFullscreenImage()}
    </>
  );
}