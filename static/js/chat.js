/* ═══════════════════════════════════════════════════════════════════════════
   EmoBot — Chat interface
   Features: send/receive, STT, TTS, copy, like/dislike, download, new chat
   ═══════════════════════════════════════════════════════════════════════════ */
(() => {
  "use strict";

  // ─── State ────────────────────────────────────────────────────────────
  let chatId = `chat_${Date.now()}`;
  let messages = []; // { id, role, text, emotion, timestamp, feedback }
  let isRecording = false;
  let currentAudio = null;
  let mediaRecorder = null;
  let audioChunks = [];

  // ─── DOM refs ─────────────────────────────────────────────────────────
  const $ = (s) => document.querySelector(s);
  const chatMessages = $("#chatMessages");
  const messageInput = $("#messageInput");
  const sendBtn = $("#sendBtn");
  const recordBtn = $("#recordBtn");
  const newChatBtn = $("#newChatBtn");
  const downloadBtn = $("#downloadBtn");
  const darkModeBtn = $("#darkModeBtn");

  // ═════════════════════════════════════════════════════════════════════════
  // DARK MODE
  // ═════════════════════════════════════════════════════════════════════════
  function initTheme() {
    const saved = localStorage.getItem("emobot-theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    applyTheme(saved || (prefersDark ? "dark" : "light"));
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("emobot-theme", theme);
    if (!darkModeBtn) return;
    const icon = darkModeBtn.querySelector("i");
    if (icon) {
      icon.setAttribute("data-lucide", theme === "dark" ? "sun" : "moon");
      lucide.createIcons();
    }
  }

  function toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme");
    applyTheme(cur === "dark" ? "light" : "dark");
  }

  // ═════════════════════════════════════════════════════════════════════════
  // TOAST
  // ═════════════════════════════════════════════════════════════════════════
  let _toastTimer = null;
  function toast(msg) {
    let el = document.querySelector(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // MESSAGES
  // ═════════════════════════════════════════════════════════════════════════
  function addMsg(role, text, emotion) {
    // Remove welcome screen if present
    const welcome = chatMessages.querySelector(".chat-welcome");
    if (welcome) welcome.remove();

    const id = `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const msg = {
      id,
      role,
      text,
      emotion: emotion || null,
      timestamp: new Date().toISOString(),
      feedback: null,
    };
    messages.push(msg);
    renderMsg(msg);
    scrollEnd();
    return msg;
  }

  function renderMsg(msg) {
    const div = document.createElement("div");
    div.className = `msg ${msg.role}`;
    div.dataset.id = msg.id;

    const avatarIcon = msg.role === "user" ? "user" : "bot";

    // Build bot action buttons
    let actionsHTML = "";
    if (msg.role === "bot") {
      actionsHTML = `
        <div class="msg-actions">
          <button class="btn-icon sm" data-act="copy" title="Copy to clipboard"><i data-lucide="copy"></i></button>
          <button class="btn-icon sm" data-act="tts" title="Read aloud"><i data-lucide="volume-2"></i></button>
          <button class="btn-icon sm" data-act="stop" title="Stop reading"><i data-lucide="volume-x"></i></button>
          <span class="divider"></span>
          <button class="btn-icon sm" data-act="like" title="Good response"><i data-lucide="thumbs-up"></i></button>
          <button class="btn-icon sm" data-act="dislike" title="Bad response"><i data-lucide="thumbs-down"></i></button>
        </div>`;
    }

    // Emotion badge
    let emotionHTML = "";
    if (msg.emotion) {
      emotionHTML = `<span class="msg-emotion">${emojiFor(msg.emotion)} ${msg.emotion}</span>`;
    }

    div.innerHTML = `
      <div class="msg-avatar"><i data-lucide="${avatarIcon}"></i></div>
      <div class="msg-body">
        <div class="msg-bubble">${esc(msg.text)}</div>
        <div class="msg-meta">
          <span class="msg-time">${fmtTime(msg.timestamp)}</span>
          ${emotionHTML}
        </div>
        ${actionsHTML}
      </div>`;

    // Attach action handlers
    if (msg.role === "bot") {
      const q = (sel) => div.querySelector(sel);
      q('[data-act="copy"]').addEventListener("click", () => {
        navigator.clipboard
          .writeText(msg.text)
          .then(() => toast("Copied to clipboard"))
          .catch(() => toast("Copy failed"));
      });
      q('[data-act="tts"]').addEventListener("click", () => playTTS(msg.text));
      q('[data-act="stop"]').addEventListener("click", stopTTS);
      q('[data-act="like"]').addEventListener("click", (e) =>
        feedback(msg, "like", e.currentTarget),
      );
      q('[data-act="dislike"]').addEventListener("click", (e) =>
        feedback(msg, "dislike", e.currentTarget),
      );
    }

    chatMessages.appendChild(div);
    lucide.createIcons();
  }

  // Typing indicator
  function showTyping() {
    const el = document.createElement("div");
    el.className = "typing-wrap";
    el.id = "typing";
    el.innerHTML = `
      <div class="msg-avatar"><i data-lucide="bot"></i></div>
      <div class="msg-body">
        <div class="msg-bubble">
          <div class="typing-dots"><span></span><span></span><span></span></div>
        </div>
      </div>`;
    chatMessages.appendChild(el);
    lucide.createIcons();
    scrollEnd();
  }
  function hideTyping() {
    const el = document.getElementById("typing");
    if (el) el.remove();
  }

  function scrollEnd() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // SEND MESSAGE
  // ═════════════════════════════════════════════════════════════════════════
  async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    messageInput.value = "";
    addMsg("user", text);
    showTyping();

    try {
      const res = await fetch("/api/send_message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, chat_id: chatId }),
      });

      hideTyping();

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }

      const data = await res.json();

      // Patch the user message with detected emotion
      const userMsg = [...messages].reverse().find((m) => m.role === "user");
      if (userMsg && data.emotion) {
        userMsg.emotion = data.emotion;
        const metaEl = chatMessages.querySelector(
          `[data-id="${userMsg.id}"] .msg-meta`,
        );
        if (metaEl && !metaEl.querySelector(".msg-emotion")) {
          const span = document.createElement("span");
          span.className = "msg-emotion";
          span.textContent = `${emojiFor(data.emotion)} ${data.emotion}`;
          metaEl.appendChild(span);
        }
      }

      addMsg("bot", data.response, data.emotion);
    } catch (err) {
      hideTyping();
      addMsg("bot", "Sorry, something went wrong. Please try again.");
      toast(err.message || "Error sending message");
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // FEEDBACK (like / dislike)
  // ═════════════════════════════════════════════════════════════════════════
  async function feedback(msg, type, btn) {
    const wrap = btn.closest(".msg-actions");
    wrap.querySelector('[data-act="like"]').classList.remove("active");
    wrap.querySelector('[data-act="dislike"]').classList.remove("active");
    btn.classList.add("active");
    msg.feedback = type;

    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: msg.id,
          feedback: type,
          message: msg.text,
        }),
      });
      toast(
        type === "like" ? "Thanks for the feedback!" : "Noted — we'll improve!",
      );
    } catch {
      /* silent */
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // TTS  (Edge TTS → browser SpeechSynthesis fallback)
  // ═════════════════════════════════════════════════════════════════════════
  async function playTTS(text) {
    stopTTS();
    const lang = detectLang(text);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audio) {
          const bin = atob(data.audio);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          const blob = new Blob([bytes], { type: "audio/mpeg" });
          const url = URL.createObjectURL(blob);
          currentAudio = new Audio(url);
          currentAudio.onended = () => {
            currentAudio = null;
            URL.revokeObjectURL(url);
          };
          await currentAudio.play();
          return;
        }
      }

      // Server TTS failed — fall back to browser
      browserTTS(text, lang);
    } catch {
      browserTTS(text, lang);
    }
  }

  function browserTTS(text, lang) {
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      window.speechSynthesis.speak(u);
    } else {
      toast("Text-to-speech unavailable");
    }
  }

  function stopTTS() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  // ═════════════════════════════════════════════════════════════════════════
  // STT  (Browser Web Speech API → Whisper via MediaRecorder fallback)
  // ═════════════════════════════════════════════════════════════════════════
  const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;

  function initBrowserSTT() {
    if (!SpeechAPI) return false;
    recognition = new SpeechAPI();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (e) => {
      messageInput.value = e.results[0][0].transcript;
      messageInput.focus();
    };
    recognition.onerror = (e) => {
      if (e.error === "not-allowed") toast("Microphone access denied");
      endRecording();
    };
    recognition.onend = () => endRecording();
    return true;
  }

  function toggleRecord() {
    if (isRecording) {
      if (recognition) recognition.stop();
      else if (mediaRecorder && mediaRecorder.state === "recording")
        mediaRecorder.stop();
      endRecording();
    } else {
      isRecording = true;
      recordBtn.classList.add("recording");
      const icon = recordBtn.querySelector("i");
      if (icon) {
        icon.setAttribute("data-lucide", "mic-off");
        lucide.createIcons();
      }
      if (recognition) {
        recognition.start();
      } else {
        startMediaRecord();
      }
    }
  }

  function endRecording() {
    isRecording = false;
    recordBtn.classList.remove("recording");
    const icon = recordBtn.querySelector("i");
    if (icon) {
      icon.setAttribute("data-lucide", "mic");
      lucide.createIcons();
    }
  }

  async function startMediaRecord() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunks, { type: "audio/wav" });
        const fd = new FormData();
        fd.append("audio", blob, "recording.wav");

        try {
          const res = await fetch("/api/stt", { method: "POST", body: fd });
          if (res.ok) {
            const data = await res.json();
            if (data.text) {
              messageInput.value = data.text;
              messageInput.focus();
            }
          } else {
            toast("Speech recognition failed on server");
          }
        } catch {
          toast("Speech recognition unavailable");
        }
      };

      mediaRecorder.start();
    } catch {
      toast("Could not access microphone");
      endRecording();
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // DOWNLOAD CONVERSATION AS JSON
  // ═════════════════════════════════════════════════════════════════════════
  function downloadChat() {
    if (!messages.length) {
      toast("No messages to download");
      return;
    }

    const payload = {
      exported_at: new Date().toISOString(),
      chat_id: chatId,
      messages: messages.map((m) => ({
        role: m.role,
        text: m.text,
        emotion: m.emotion,
        timestamp: m.timestamp,
        feedback: m.feedback,
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `emobot-chat-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Conversation downloaded");
  }

  // ═════════════════════════════════════════════════════════════════════════
  // NEW CHAT
  // ═════════════════════════════════════════════════════════════════════════
  async function newChat() {
    try {
      const res = await fetch("/api/new_chat", { method: "POST" });
      const data = await res.json();
      chatId = data.chat_id;
      messages = [];
      chatMessages.innerHTML = "";
      showWelcome();
      toast("New chat started");
    } catch {
      toast("Failed to start new chat");
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // WELCOME SCREEN
  // ═════════════════════════════════════════════════════════════════════════
  function showWelcome() {
    const div = document.createElement("div");
    div.className = "chat-welcome";
    div.innerHTML = `
      <div class="welcome-icon"><i data-lucide="bot"></i></div>
      <h2>Welcome to EmoBot</h2>
      <p>I understand your emotions and respond with empathy. Send a message to start!</p>
      <div class="welcome-pills">
        <button class="pill" data-text="How are you today?">How are you today?</button>
        <button class="pill" data-text="I'm feeling a bit down">I'm feeling a bit down</button>
        <button class="pill" data-text="Tell me something interesting">Tell me something interesting</button>
      </div>`;

    chatMessages.appendChild(div);

    div.querySelectorAll(".pill").forEach((btn) =>
      btn.addEventListener("click", () => {
        messageInput.value = btn.dataset.text;
        sendMessage();
      }),
    );

    lucide.createIcons();
  }

  // ═════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═════════════════════════════════════════════════════════════════════════
  function esc(text) {
    const d = document.createElement("div");
    d.textContent = text;
    return d.innerHTML;
  }

  function fmtTime(iso) {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function emojiFor(e) {
    const m = {
      admiration: "\u{1F929}",
      amusement: "\u{1F604}",
      anger: "\u{1F620}",
      annoyance: "\u{1F624}",
      approval: "\u{1F44D}",
      caring: "\u{1F917}",
      confusion: "\u{1F937}",
      curiosity: "\u{1F914}",
      desire: "\u{1F60D}",
      disappointment: "\u{1F61E}",
      disapproval: "\u{1F44E}",
      disgust: "\u{1F922}",
      embarrassment: "\u{1F633}",
      excitement: "\u{1F389}",
      fear: "\u{1F628}",
      gratitude: "\u{1F64F}",
      grief: "\u{1F62D}",
      joy: "\u{1F60A}",
      love: "\u{2764}\u{FE0F}",
      nervousness: "\u{1F630}",
      optimism: "\u{1F60C}",
      pride: "\u{1F4AA}",
      realization: "\u{1F4A1}",
      relief: "\u{1F605}",
      remorse: "\u{1F614}",
      sadness: "\u{1F622}",
      surprise: "\u{1F632}",
      neutral: "\u{1F610}",
    };
    return m[e] || "\u{1F535}";
  }

  function detectLang(text) {
    if (/[\u0600-\u06FF]/.test(text)) return "ar-SA";
    if (/[\u4E00-\u9FFF]/.test(text)) return "zh-CN";
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return "ja-JP";
    if (/[\uAC00-\uD7A3]/.test(text)) return "ko-KR";
    if (/[\u0400-\u04FF]/.test(text)) return "ru-RU";
    if (/[\u0900-\u097F]/.test(text)) return "hi-IN";
    if (/[àâçéèêëîïôûùüÿœæ]/i.test(text)) return "fr-FR";
    if (/[äöüß]/i.test(text)) return "de-DE";
    if (/[áéíóúñ¿¡]/i.test(text)) return "es-ES";
    if (/[àèìòù]/i.test(text)) return "it-IT";
    if (/[ãõçáéíóú]/i.test(text)) return "pt-BR";
    if (/[çğıöşü]/i.test(text)) return "tr-TR";
    return "en-US";
  }

  // ═════════════════════════════════════════════════════════════════════════
  // INIT
  // ═════════════════════════════════════════════════════════════════════════
  function init() {
    initTheme();
    initBrowserSTT();

    // Event listeners
    sendBtn.addEventListener("click", sendMessage);
    messageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    recordBtn.addEventListener("click", toggleRecord);
    newChatBtn.addEventListener("click", newChat);
    downloadBtn.addEventListener("click", downloadChat);
    darkModeBtn.addEventListener("click", toggleTheme);

    messageInput.focus();
    showWelcome();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
