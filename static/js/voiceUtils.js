// Voice recording and recognition functionality
let recognition = null;
let isRecording = false;

// Initialize speech recognition
function initializeSpeechRecognition() {
  if ("webkitSpeechRecognition" in window) {
    recognition = new webkitSpeechRecognition();
  } else if ("SpeechRecognition" in window) {
    recognition = new SpeechRecognition();
  } else {
    alert("Speech recognition is not supported in your browser");
    return false;
  }

  // Set recognition properties
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = document.documentElement.lang || "en-US";

  // Handle recognition results
  recognition.onstart = () => {
    console.log("Recording started");
    const recordButton = document.getElementById("recordButton");
    recordButton.style.backgroundColor = "var(--color-primary)";
    recordButton.querySelector("i").setAttribute("data-lucide", "mic-off");
    lucide.createIcons();
  };

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map((result) => result[0].transcript)
      .join("");
    document.getElementById("messageInput").value = transcript;
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    alert(`Speech recognition error: ${event.error}`);
    stopRecording();
  };

  recognition.onend = () => {
    console.log("Recording ended");
    stopRecording();
  };

  return true;
}

function toggleRecording() {
  if (!recognition && !initializeSpeechRecognition()) {
    return;
  }

  if (!isRecording) {
    isRecording = true;
    recognition.start();
  } else {
    stopRecording();
  }
}

function stopRecording() {
  if (isRecording) {
    isRecording = false;
    recognition.stop();
    const recordButton = document.getElementById("recordButton");
    recordButton.style.backgroundColor = "";
    recordButton.querySelector("i").setAttribute("data-lucide", "mic");
    lucide.createIcons();
  }
}

// Text-to-speech with enhanced voice selection and language support
let availableVoices = [];
const PREFERRED_VOICES = {
  en: [
    "Premium",
    "Enhanced",
    "Natural",
    "Google UK English",
    "Google US English",
  ],
  es: ["Premium", "Enhanced", "Natural", "Google español"],
  fr: ["Premium", "Enhanced", "Natural", "Google français"],
  de: ["Premium", "Enhanced", "Natural", "Google Deutsch"],
  // Add more languages as needed
};

// Initialize voices
function initVoices() {
  availableVoices = speechSynthesis.getVoices();
  console.log("Available voices:", availableVoices);
}

// Find the best voice for a given language
function findBestVoice(lang) {
  // Get the base language code (e.g., 'en' from 'en-US')
  const baseLanguage = lang.split("-")[0];

  // Get preferred voice names for this language
  const preferredNames =
    PREFERRED_VOICES[baseLanguage] || PREFERRED_VOICES["en"];

  // Try to find a voice matching the preferences
  let selectedVoice = null;

  // First, try to find a voice matching the exact language code and preferences
  for (const preferred of preferredNames) {
    selectedVoice = availableVoices.find(
      (voice) => voice.lang === lang && voice.name.includes(preferred)
    );
    if (selectedVoice) break;
  }

  // If no preferred voice found, try matching just the base language
  if (!selectedVoice) {
    for (const preferred of preferredNames) {
      selectedVoice = availableVoices.find(
        (voice) =>
          voice.lang.startsWith(baseLanguage) && voice.name.includes(preferred)
      );
      if (selectedVoice) break;
    }
  }

  // If still no voice found, fall back to any voice matching the language
  if (!selectedVoice) {
    selectedVoice = availableVoices.find(
      (voice) => voice.lang === lang || voice.lang.startsWith(baseLanguage)
    );
  }

  // Last resort: use any available English voice
  if (!selectedVoice) {
    selectedVoice = availableVoices.find(
      (voice) => voice.lang.startsWith("en") && voice.name.includes("Google")
    );
  }

  return selectedVoice;
}

// Enhanced playMessage function
function playMessage(text, lang = "en-US") {
  // Cancel any ongoing speech
  stopPlayback();

  // Create utterance
  const utterance = new SpeechSynthesisUtterance(text);

  // Refresh voices list if empty
  if (availableVoices.length === 0) {
    initVoices();
  }

  // Find and set the best voice
  const voice = findBestVoice(lang);
  if (voice) {
    console.log("Selected voice:", voice.name, "for language:", lang);
    utterance.voice = voice;
  }

  // Configure speech parameters
  utterance.lang = lang;
  utterance.rate = 1.0; // Normal speed
  utterance.pitch = 1.0; // Normal pitch
  utterance.volume = 1.0; // Full volume

  // Add event handlers
  utterance.onstart = () => {
    console.log("Started speaking");
  };

  utterance.onerror = (event) => {
    console.error("Speech synthesis error:", event);
  };

  utterance.onend = () => {
    console.log("Finished speaking");
  };

  // Speak the text
  speechSynthesis.speak(utterance);
}

// Stop any ongoing speech
function stopPlayback() {
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }
}

// Initialize voices when they become available
speechSynthesis.onvoiceschanged = initVoices;

// Initial voices load
if (speechSynthesis.getVoices().length > 0) {
  initVoices();
}

// Export functions
window.speechUtils = {
  playMessage,
  stopPlayback,
};

// Initialize voice system
window.speechSynthesis.onvoiceschanged = updateVoices;

// Initialize voice recognition when page loads
document.addEventListener("DOMContentLoaded", initializeSpeechRecognition);
