# 🤖 EmoBot: Emotion-Aware Multilingual Chatbot

> 🧠 Detect emotions from user input and generate emotionally aligned responses using cutting-edge NLP models!

## 🚀 Features

* 🔍 **Emotion Detection** using **XLM-RoBERTa** fine-tuned on the GoEmotions dataset
* 🌐 **Multilingual support** (even though the dataset is English-only, the model understands other languages!)
* 💬 **Text & Voice Input**
* 🔊 **Text-to-Speech (TTS)** for bot responses
* 🎨 **Dark mode toggle**
* 📱 Frontend built with **HTML/CSS/JS**, powered by Flask backend
* 🌈 Emotion support system to help users cope emotionally
* 🧠 Integrates **Gemini API** for smart and human-like text generation

---

## 🗂️ Project Structure

```
EmoBot/
│
├── app.py                      # Flask backend
├── requirements.txt           # Python dependencies
├── README.md                  # You're reading it!
│
├── static/
│   ├── css/                   # Styling (home, chat, etc.)
│   ├── js/                    # Frontend logic (TTS, dark mode, etc.)
│   └── models/
│       └── xlm-roberta_emotion_model/   # Emotion detection model (handled via Git LFS)
│
├── templates/                 # HTML pages (chat, home, error pages)
└── ...
```

---

## 🧪 Tech Stack

| Layer      | Tech                     |
| ---------- | ------------------------ |
| Backend    | Python, Flask            |
| Frontend   | HTML, CSS, JavaScript    |
| NLP Model  | XLM-RoBERTa + GoEmotions |
| AI Gen API | Gemini                   |
| Voice      | Web Speech API (JS)      |

---

## 💾 Model Info

The `xlm-roberta_emotion_model` folder contains:

* `model.safetensors` — 🔒 Fine-tuned model (1.1 GB, tracked with Git LFS)
* `config.json`, `tokenizer_config.json`, `sentencepiece.bpe.model` — 📦 Supporting files

🗣 **Note**: Although the model was trained on an English dataset, using XLM-RoBERTa allows emotion detection in **multiple languages**. 💬🌍

---

## 🛠️ Setup

1. **Clone this repo**:

```bash
git clone https://github.com/anVSS1/EmoBot.git
cd EmoBot
```

2. **Install dependencies**:

```bash
pip install -r requirements.txt
```

3. **Make sure Git LFS is installed** and pull model weights:

```bash
git lfs install
git lfs pull
```

4. **Run the app**:

```bash
python app.py
```

Then head to `http://localhost:5000` and start chatting 🎉

---

## 📸 Screenshots

*Coming soon...*

---

## 📬 Contact

Built by **Anass Ouzaouit** — Master's student in BI & Big Data, passionate about AI and NLP 🔥

Feel free to connect or give a ⭐ if you like the project!

---

## 📄 License

MIT License
