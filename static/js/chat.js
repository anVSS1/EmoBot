document.addEventListener("DOMContentLoaded", () => {
  const messageInput = document.getElementById("messageInput");
  const sendButton = document.getElementById("sendButton");
  const recordButton = document.getElementById("recordButton");
  const chatMessages = document.getElementById("chatMessages");

  // Initialize voice support
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    recordButton.style.display = "block";
  } else {
    recordButton.style.display = "none";
  }

  async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    const userMessage = {
      id: Date.now().toString(),
      text,
      sender: "user",
    };

    appendMessage(userMessage);
    messageInput.value = "";
    messageInput.focus();

    // Add loading animation
    const loadingMessage = document.createElement("div");
    loadingMessage.className = "message bot loading";
    loadingMessage.innerHTML = `
      <div class="message-content">
        <div class="loading-dots">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      </div>
    `;
    chatMessages.appendChild(loadingMessage);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      const data = await window.api.sendMessage(text);

      // Remove loading animation
      chatMessages.removeChild(loadingMessage);

      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: "bot",
        emotion: data.emotion,
        lang: data.lang || "en-US", // Assuming the API returns the language
      };

      appendMessage(botMessage);

      // Remove automatic playback
      // playMessage(botMessage.text, botMessage.lang);
    } catch (error) {
      console.error("Error sending message:", error);
      chatMessages.removeChild(loadingMessage);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I couldn't process your message. Please try again.",
        sender: "bot",
        emotion: "error",
        lang: "en-US",
      };
      appendMessage(errorMessage);
    }
  }

  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendButton.addEventListener("click", sendMessage);
  recordButton.addEventListener("click", toggleRecording);
});
