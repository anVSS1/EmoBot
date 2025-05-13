function createMessageElement(message) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${message.sender}`;

  const content = document.createElement("div");
  content.className = "message-content";

  const text = document.createElement("p");
  text.textContent = message.text;
  content.appendChild(text);

  if (message.emotion) {
    const emotion = document.createElement("p");
    emotion.className = "message-emotion";
    emotion.textContent = `Emotion: ${message.emotion}`;
    content.appendChild(emotion);
  }

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  const icon = document.createElement("i");
  icon.setAttribute("data-lucide", message.sender === "user" ? "user" : "bot");
  avatar.appendChild(icon);

  if (message.sender === "bot") {
    const controls = document.createElement("div");
    controls.className = "message-controls";

    // Create play button with language detection
    const playButton = createButton("play", () => {
      // Detect language if not provided
      if (!message.lang) {
        // Simple language detection based on character set
        const hasKanji = /[\u4E00-\u9FFF]/.test(message.text);
        const hasHangul = /[\u3131-\u318E\uAC00-\uD7A3]/.test(message.text);
        const hasCyrillic = /[\u0400-\u04FF]/.test(message.text);

        if (hasKanji) message.lang = "ja-JP";
        else if (hasHangul) message.lang = "ko-KR";
        else if (hasCyrillic) message.lang = "ru-RU";
        else message.lang = "en-US"; // Default to English
      }

      window.speechUtils.playMessage(message.text, message.lang);
    });

    const stopButton = createButton("square", window.speechUtils.stopPlayback);

    controls.appendChild(playButton);
    controls.appendChild(stopButton);
    content.appendChild(controls);
  }

  messageDiv.appendChild(content);
  messageDiv.appendChild(avatar);

  lucide.createIcons();
  return messageDiv;
}

function createButton(icon, onClick) {
  const button = document.createElement("button");
  button.className = "icon-button";
  button.onclick = onClick;

  const iconElement = document.createElement("i");
  iconElement.setAttribute("data-lucide", icon);
  button.appendChild(iconElement);

  return button;
}

function appendMessage(message) {
  const messagesContainer = document.getElementById("chatMessages");
  const messageElement = createMessageElement(message);
  messagesContainer.appendChild(messageElement);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  lucide.createIcons();
}
