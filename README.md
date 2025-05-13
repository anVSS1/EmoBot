# 🧠 EmoBot — Multilingual Emotion-Aware Chatbot

EmoBot is an emotion-savvy chatbot that *feels* your vibe. It detects emotions in your messages using a fine-tuned **XLM-RoBERTa** model and responds with emotion-aligned text generated via the **Gemini API**. Whether you're angry, sad, joyful, or just chillin', EmoBot’s got a response that *gets you* — in different languages.

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

> _(Screenshots to be added later)_

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
```

---

## 🛠️ Setup Instructions

### 1. Clone the Repo

```bash
git clone https://github.com/anVSS1/EmoBot.git
cd EmoBot
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 3. Install Git LFS and Pull Model File

If not already installed:

```bash
git lfs install
```

Then pull the large model file:

```bash
git lfs pull
```

### 4. Set Up Your Gemini API Key

Create a `.env` file or hardcode your key (for local testing only):

```bash
export GEMINI_API_KEY=your_google_api_key_here
```

Or if you're on Windows (CMD):

```cmd
set GEMINI_API_KEY=your_google_api_key_here
```

### 5. Run the App

```bash
python app.py
```

Then open your browser and head to:

```
http://localhost:5000
```

---

## 🧠 Model Info

- Fine-tuned **XLM-RoBERTa-base** on the **GoEmotions** dataset.
- Multilingual emotion detection (Detects the emotions from different texts but the dataset has English texts only).
- Output used to guide response generation via Gemini API.

---

## ⚙️ Frontend Highlights

- **Voice Input** 🎙: Record speech and convert to text
- **Voice Output** 🔊: Speak the chatbot's responses
- **Dark Mode** 🌙: JavaScript-powered theme toggle
- **Smooth UI** 💅: Separate pages for chat and landing

---

## ✨ TODO / Future Work

- [ ] Deploy on Hugging Face Spaces / Render / Vercel
- [ ] Add live demo link
- [ ] Cache Gemini responses to reduce API calls
- [ ] Use a different dataset
- [ ] Add a database to save chats (MongoDB / SQLite)

---

## 📜 License

MIT — use it, remix it, just give credit.

---

## 👨‍💻 Author

**Anass Ouzaouit**  
Master's in Business Intelligence & Big Data Analytics  
ML Engineer | Prompt Writer | AI Enthusiast  
[LinkedIn](https://linkedin.com/in/anass-ouzaouit) • [GitHub](https://github.com/anVSS1)

---

> EmoBot doesn't just talk — it *feels*. 🧠💬
