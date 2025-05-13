# 🧠 EmoBot — Multilingual Emotion-Aware Chatbot

EmoBot is an emotion-savvy chatbot that *feels* your vibe. It detects emotions in your messages using a fine-tuned **XLM-RoBERTa** model and responds with emotion-aligned text generated via the **Gemini API**. Whether you're angry, sad, joyful, or just chillin', EmoBot’s got a response that *gets you* — in English and French.

---

## 🔥 Features

- 🎯 **Emotion Detection** — Powered by a fine-tuned XLM-RoBERTa model trained on GoEmotions.
- 💬 **LLM-Based Response Generation** — Uses Gemini API to generate emotionally appropriate replies.
- 🌐 **Multilingual Support** — Works in **English** and **French** (emotion detection).
- 🎤 **Voice Input** — Speak your message directly with speech-to-text.
- 🔊 **Text-to-Speech Output** — EmoBot talks back with emotion-based responses.
- 🧠 **Emotion Labels Displayed** — See which emotion was detected for each message.
- 🖥️ **Frontend** — Clean UI built with HTML, CSS, and JavaScript.
- 🔙 **Backend** — Flask handles the magic under the hood.
- 🧳 **Model File Tracked via Git LFS** — 1.1GB `.safetensors` model properly managed.

---

## 🚀 Demo

> _(Add screenshots or a screen recording GIF here if you want)_

---

## 📁 Project Structure

```bash
EmoBot/
│
├── app.py                         # Flask backend
├── requirements.txt              # Python dependencies
├── README.md                     # This file
│
├── static/
│   ├── css/                      # Frontend styles
│   ├── js/                       # Frontend logic (TTS, speech, UI, etc.)
│   └── models/
│       └── xlm-roberta_emotion_model/
│           ├── model.safetensors      # Main model file (Git LFS)
│           ├── config.json
│           ├── tokenizer_config.json
│           ├── sentencepiece.bpe.model
│           └── special_tokens_map.json
│
├── templates/
│   ├── index.html                # Landing page
│   ├── chat.html                 # Chat interface
│   ├── 404.html                  # Error pages
│   └── 500.html
