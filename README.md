# EmoBot v2 — Emotion-Aware Multilingual Chatbot

An emotionally intelligent chatbot that detects the user's emotion from their message using **XLM-RoBERTa** and generates empathetic, tone-aligned responses via **Google Gemini**.

---

## Features

- **Real-time emotion detection** — XLM-RoBERTa fine-tuned on GoEmotions (28 emotion labels)
- **Empathetic AI responses** — Gemini adapts tone based on detected emotion (sadness → warm, anger → calm, joy → upbeat, ...)
- **Multilingual** — Detects emotion and responds in the user's language
- **Voice input & output** — Speech-to-text (Web Speech API + Whisper fallback) and text-to-speech (Edge TTS + browser fallback)
- **Automatic model fallback** — If Gemini 2.5 Flash quota is exhausted, falls back to Gemma 3 4B seamlessly
- **Emotion badges** — Detected emotion displayed on both user and bot messages
- **Chat actions** — Copy, like/dislike feedback, download conversation as JSON, new chat
- **Dark mode** — Toggle between light and dark themes
- **Glassmorphism UI** — Frosted glass cards, animated floating orbs, gradient accents
- **Security hardened** — CSP headers, rate limiting, input sanitization

---

## How It Works

```
User Message
    │
    ▼
┌──────────────────────┐
│  XLM-RoBERTa         │──→ Detected emotion (e.g. "joy", "sadness", "anger")
│  Emotion Classifier  │    + confidence scores (top 3)
└──────────────────────┘
    │
    ▼
┌──────────────────────┐
│  Google Gemini        │──→ Emotionally aligned response
│  (2.5 Flash / Gemma) │    in the user's language
└──────────────────────┘
    │
    ▼
Chat UI displays response + emotion badge
```

---

## Tech Stack

| Layer         | Technology                              |
| ------------- | --------------------------------------- |
| Backend       | Python, Flask                           |
| Emotion Model | XLM-RoBERTa (GoEmotions, 28 labels)     |
| Response Gen  | Gemini 2.5 Flash (fallback: Gemma 3 4B) |
| TTS           | Edge TTS (14 language voices)           |
| STT           | Web Speech API + OpenAI Whisper         |
| Frontend      | HTML, CSS, JavaScript                   |
| Database      | MongoDB (optional, in-memory fallback)  |

---

## Project Structure

```
EmoBot/
├── app.py                        # Flask backend (API, emotion detection, Gemini, TTS/STT)
├── requirements.txt              # Python dependencies
├── .env.example                  # Environment variable template
├── .gitignore
├── README.md
├── xlm-roberta.ipynb             # Model training notebook
│
├── static/
│   ├── css/
│   │   └── main.css              # Full stylesheet (glassmorphism, animations, dark mode)
│   ├── js/
│   │   ├── chat.js               # Chat logic (send, receive, TTS, STT, feedback, download)
│   │   └── home.js               # Landing page (emotion pills, scroll reveal, dark mode)
│   └── models/
│       └── xlm-roberta_emotion_model/
│           ├── model.safetensors  # Fine-tuned weights (~1.1 GB, Git LFS)
│           ├── config.json
│           ├── tokenizer_config.json
│           ├── sentencepiece.bpe.model
│           └── special_tokens_map.json
│
└── templates/
    ├── index.html                # Landing page
    ├── chat.html                 # Chat interface
    ├── 404.html                  # Not found page
    └── 500.html                  # Server error page
```

---

## Setup

### 1. Clone & pull model weights

```bash
git clone https://github.com/anVSS1/emobot.git
cd emobot
git lfs install
git lfs pull
```

### 2. Create virtual environment

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and add your [Google AI Studio API key](https://aistudio.google.com/apikey):

```
GEMINI_API_KEY=your_key_here
```

### 5. Run

```bash
python -u app.py
```

Open **http://localhost:5000** and start chatting.

---

## Environment Variables

| Variable         | Default                      | Description                         |
| ---------------- | ---------------------------- | ----------------------------------- |
| `GEMINI_API_KEY` | _(required)_                 | Google AI Studio API key            |
| `GEMINI_MODEL`   | `gemini-2.5-flash`           | Primary generation model            |
| `FALLBACK_MODEL` | `gemma-3-4b-it`              | Fallback model when quota exhausted |
| `SECRET_KEY`     | _(auto-generated)_           | Flask session secret                |
| `MONGODB_URI`    | `mongodb://localhost:27017/` | MongoDB connection string           |
| `HOST`           | `127.0.0.1`                  | Server bind address                 |
| `PORT`           | `5000`                       | Server port                         |
| `FLASK_DEBUG`    | `false`                      | Enable Flask debug mode             |

---

## Supported Emotions (28)

admiration · amusement · anger · annoyance · approval · caring · confusion · curiosity · desire · disappointment · disapproval · disgust · embarrassment · excitement · fear · gratitude · grief · joy · love · nervousness · optimism · pride · realization · relief · remorse · sadness · surprise · neutral

---

## Team

| Name                | Links                                                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Anass Ouzaouit**  | [GitHub](https://github.com/anVSS1) · [LinkedIn](https://linkedin.com/in/anass-ouzaouit) · [X](https://x.com/anvss__) |
| **Mohamed Kannoun** | [LinkedIn](https://linkedin.com/in/kannoun) · [X](https://x.com/M_KANNOUN)                                            |

---

## License

MIT
