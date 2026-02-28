"""
EmoBot — Emotion-Aware Multilingual Chatbot
Backend server: Flask + XLM-RoBERTa emotion detection + Gemini text generation.
"""

import os
import re
import html
import secrets
import asyncio
import base64
import tempfile
import logging
import time
from datetime import datetime, timezone
from functools import wraps
from collections import defaultdict

from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from google import genai
from google.genai import types
from transformers import XLMRobertaTokenizer, XLMRobertaForSequenceClassification
import torch

# ─── Configuration ────────────────────────────────────────────────────────────

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()],  # force stderr (unbuffered on Windows)
)
logger = logging.getLogger("emobot")

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", secrets.token_hex(32))

# ─── Security Headers ────────────────────────────────────────────────────────


@app.after_request
def security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "microphone=(self), camera=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://unpkg.com; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: https:; "
        "media-src 'self' blob:; "
        "connect-src 'self'"
    )
    return response


# ─── Rate Limiting (in-memory) ────────────────────────────────────────────────

_rate_store: dict[str, list[float]] = defaultdict(list)


def rate_limit(max_reqs: int = 30, window: int = 60):
    """Simple per-IP rate limiter."""

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            ip = request.remote_addr or "127.0.0.1"
            key = f"{ip}:{fn.__name__}"
            now = time.time()
            _rate_store[key] = [t for t in _rate_store[key] if now - t < window]
            if len(_rate_store[key]) >= max_reqs:
                return jsonify({"error": "Too many requests. Please slow down."}), 429
            _rate_store[key].append(now)
            return fn(*args, **kwargs)

        return wrapper

    return decorator


# ─── Input Validation ─────────────────────────────────────────────────────────

MAX_MESSAGE_LEN = 5000
MAX_TTS_LEN = 2000
_CHAT_ID_RE = re.compile(r"^[a-zA-Z0-9_.\-]+$")


def sanitize(text: str) -> str:
    if not isinstance(text, str):
        return ""
    return html.escape(text.strip())[:MAX_MESSAGE_LEN]


def valid_chat_id(cid: str) -> str:
    if not cid or not isinstance(cid, str):
        return "default"
    cid = cid.strip()[:100]
    return cid if _CHAT_ID_RE.match(cid) else "default"


# ─── MongoDB (optional — falls back to in-memory) ────────────────────────────

MONGO = False
_mem_chats: list[dict] = []
_mem_feedback: list[dict] = []

try:
    from pymongo import MongoClient

    _mongo = MongoClient(
        os.getenv("MONGODB_URI", "mongodb://localhost:27017/"),
        serverSelectionTimeoutMS=3000,
    )
    _mongo.server_info()
    _db = _mongo["emobot"]
    _chats_col = _db["chats"]
    _fb_col = _db["feedback"]
    MONGO = True
    logger.info("MongoDB connected")
except Exception as exc:
    logger.warning("MongoDB unavailable (%s) — using in-memory storage.", exc)


def _store_msg(chat_id, role, message, emotion=None):
    doc = {
        "chat_id": chat_id,
        "role": role,
        "message": message,
        "emotion": emotion,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    if MONGO:
        _chats_col.insert_one(doc)
    else:
        _mem_chats.append(doc)


def _store_feedback(chat_id, message_id, fb_type, message_text):
    doc = {
        "chat_id": chat_id,
        "message_id": message_id,
        "feedback": fb_type,
        "message": message_text,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    if MONGO:
        _fb_col.insert_one(doc)
    else:
        _mem_feedback.append(doc)


# ─── Gemini API ───────────────────────────────────────────────────────────────

GEMINI_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
FALLBACK_MODEL = os.getenv("FALLBACK_MODEL", "gemma-3-4b-it")

if not GEMINI_KEY:
    logger.error("GEMINI_API_KEY is not set — chat will not work until configured.")

_client = None
if GEMINI_KEY:
    _client = genai.Client(api_key=GEMINI_KEY)
    logger.info("Primary model: %s | Fallback: %s", GEMINI_MODEL, FALLBACK_MODEL)

SYSTEM_PROMPT = """\
You are EmoBot, an emotionally intelligent conversational AI assistant.

RULES:
1. EMOTIONAL ALIGNMENT — The user's detected emotion is provided with each message.
   Adapt your tone naturally:
   • Sadness / grief / disappointment → warm, empathetic, validating
   • Anger / annoyance → calm, understanding, non-judgmental
   • Joy / excitement / love → match their positive energy
   • Fear / nervousness → reassuring, grounding, supportive
   • Curiosity / confusion → clear, patient, informative
   • Neutral → friendly and engaging

2. LANGUAGE — ALWAYS reply in the SAME language the user writes in.

3. STYLE — Be natural and conversational. Keep responses concise unless the
   user clearly wants detail.

4. SAFETY — If the user expresses thoughts of self-harm or crisis, respond
   with compassion and gently suggest professional support resources.

5. NEVER use emojis.

6. Do NOT mention the detected emotion explicitly; just align your tone.\
"""

_gen_config = types.GenerateContentConfig(
    system_instruction=SYSTEM_PROMPT,
    temperature=0.7,
    top_p=0.9,
    top_k=40,
    max_output_tokens=1024,
)

_chat_sessions: dict = {}
_session_models: dict = {}  # track which model each session uses


def _get_session(chat_id: str, model: str | None = None):
    use_model = model or GEMINI_MODEL
    # Recreate session if switching models
    if chat_id in _chat_sessions and model and _session_models.get(chat_id) != model:
        _chat_sessions.pop(chat_id, None)
    if chat_id not in _chat_sessions:
        if _client is None:
            return None
        _chat_sessions[chat_id] = _client.chats.create(
            model=use_model,
            config=_gen_config,
        )
        _session_models[chat_id] = use_model
    return _chat_sessions[chat_id]


# ─── Emotion Detection ───────────────────────────────────────────────────────

EMOTION_LABELS = [
    "admiration", "amusement", "anger", "annoyance", "approval", "caring",
    "confusion", "curiosity", "desire", "disappointment", "disapproval",
    "disgust", "embarrassment", "excitement", "fear", "gratitude",
    "grief", "joy", "love", "nervousness", "optimism", "pride",
    "realization", "relief", "remorse", "sadness", "surprise", "neutral",
]

_model_path = os.path.join(
    app.root_path, "static", "models", "xlm-roberta_emotion_model"
)
_device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

try:
    _tok = XLMRobertaTokenizer.from_pretrained(_model_path, local_files_only=True)
    _emo_model = XLMRobertaForSequenceClassification.from_pretrained(
        _model_path, local_files_only=True
    )
    _emo_model.to(_device).eval()
    logger.info("Emotion model loaded on %s", _device)
except Exception as exc:
    logger.error("Emotion model failed to load: %s", exc)
    _tok = _emo_model = None


def detect_emotion(text: str) -> tuple[str, dict]:
    """Return (top_emotion, {top3 emotion: score})."""
    if _emo_model is None or _tok is None:
        return "neutral", {}
    try:
        clean = html.unescape(text)
        inputs = _tok(
            clean, return_tensors="pt",
            padding="max_length", truncation=True, max_length=128,
        )
        inputs = {k: v.to(_device) for k, v in inputs.items()}
        with torch.no_grad():
            logits = _emo_model(**inputs).logits
        probs = torch.softmax(logits, dim=1).cpu().numpy()[0]
        scored = sorted(
            zip(EMOTION_LABELS, probs), key=lambda x: x[1], reverse=True
        )
        top = scored[0][0]
        top3 = {e: round(float(p), 4) for e, p in scored[:3]}
        return top, top3
    except Exception as exc:
        logger.error("Emotion detection error: %s", exc)
        return "neutral", {}


# ─── Gemini Retry + Fallback Helper ───────────────────────────────────────────

MAX_RETRIES = 2


def _send_with_retry(session, prompt: str, chat_id: str) -> str:
    """Send a message; on quota errors retry once then fall back to FALLBACK_MODEL."""
    # --- Try primary model ---
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = session.send_message(prompt)
            return resp.text
        except Exception as exc:
            err_str = str(exc)
            is_rate_limit = "429" in err_str or "quota" in err_str.lower()
            if is_rate_limit and attempt < MAX_RETRIES:
                wait = 2 ** attempt
                logger.warning(
                    "Rate-limited on %s (attempt %d/%d), retrying in %ds…",
                    _session_models.get(chat_id, GEMINI_MODEL),
                    attempt, MAX_RETRIES, wait,
                )
                time.sleep(wait)
                continue
            if is_rate_limit:
                break  # fall through to fallback
            raise

    # --- Fallback model ---
    current_model = _session_models.get(chat_id, GEMINI_MODEL)
    if current_model == FALLBACK_MODEL:
        raise RuntimeError(f"Quota exhausted on both primary and fallback models")

    logger.warning(
        "Quota exhausted on %s — falling back to %s",
        current_model, FALLBACK_MODEL,
    )
    fb_session = _get_session(chat_id, model=FALLBACK_MODEL)
    if fb_session is None:
        raise RuntimeError("Fallback session could not be created")
    resp = fb_session.send_message(prompt)
    return resp.text


# ─── Whisper STT (lazy-loaded, cached) ────────────────────────────────────────

_whisper = None


def _get_whisper():
    global _whisper
    if _whisper is None:
        import whisper  # noqa: will raise ImportError if not installed

        _whisper = whisper.load_model("base")
        logger.info("Whisper model loaded")
    return _whisper


# ─── Routes: Pages ────────────────────────────────────────────────────────────


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/chat")
def chat():
    return render_template("chat.html")


# ─── Routes: API ──────────────────────────────────────────────────────────────


@app.route("/api/send_message", methods=["POST"])
@rate_limit(max_reqs=20, window=60)
def api_send_message():
    try:
        data = request.get_json(silent=True) or {}
        user_msg = sanitize(data.get("message", ""))
        chat_id = valid_chat_id(data.get("chat_id", "default"))

        if not user_msg:
            return jsonify({"error": "Message cannot be empty."}), 400

        emotion, scores = detect_emotion(user_msg)

        session = _get_session(chat_id)
        if session is None:
            return jsonify({"error": "AI service not configured. Set GEMINI_API_KEY."}), 503

        try:
            prompt = f"[User emotion: {emotion}] {html.unescape(user_msg)}"
            bot_text = _send_with_retry(session, prompt, chat_id)
        except Exception as exc:
            logger.error("Gemini error: %s", exc)
            _chat_sessions.pop(chat_id, None)
            return jsonify({"error": "AI service temporarily unavailable."}), 503

        _store_msg(chat_id, "user", user_msg, emotion)
        _store_msg(chat_id, "bot", bot_text)

        return jsonify({
            "response": bot_text,
            "emotion": emotion,
            "emotion_scores": scores,
            "chat_id": chat_id,
        })
    except Exception as exc:
        logger.error("send_message: %s", exc)
        return jsonify({"error": "An unexpected error occurred."}), 500


@app.route("/api/new_chat", methods=["POST"])
@rate_limit(max_reqs=10, window=60)
def api_new_chat():
    chat_id = f"chat_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    return jsonify({"chat_id": chat_id})


@app.route("/api/feedback", methods=["POST"])
@rate_limit(max_reqs=30, window=60)
def api_feedback():
    try:
        data = request.get_json(silent=True) or {}
        chat_id = valid_chat_id(data.get("chat_id", "default"))
        msg_id = str(data.get("message_id", ""))[:200]
        fb = data.get("feedback", "")
        msg_text = sanitize(data.get("message", ""))

        if fb not in ("like", "dislike"):
            return jsonify({"error": "Invalid feedback type."}), 400

        _store_feedback(chat_id, msg_id, fb, msg_text)
        return jsonify({"status": "ok"})
    except Exception as exc:
        logger.error("feedback: %s", exc)
        return jsonify({"error": "Failed to submit feedback."}), 500


@app.route("/api/tts", methods=["POST"])
@rate_limit(max_reqs=15, window=60)
def api_tts():
    try:
        data = request.get_json(silent=True) or {}
        text = data.get("text", "").strip()
        lang = data.get("lang", "en-US")

        if not text:
            return jsonify({"error": "No text provided."}), 400
        if len(text) > MAX_TTS_LEN:
            return jsonify({"error": f"Text too long (max {MAX_TTS_LEN} chars)."}), 400

        try:
            import edge_tts
        except ImportError:
            return jsonify({"error": "edge-tts not installed. Use browser TTS."}), 501

        voices = {
            "en-US": "en-US-AriaNeural",
            "en-GB": "en-GB-SoniaNeural",
            "fr-FR": "fr-FR-DeniseNeural",
            "es-ES": "es-ES-ElviraNeural",
            "de-DE": "de-DE-KatjaNeural",
            "ar-SA": "ar-SA-ZariyahNeural",
            "zh-CN": "zh-CN-XiaoxiaoNeural",
            "ja-JP": "ja-JP-NanamiNeural",
            "ko-KR": "ko-KR-SunHiNeural",
            "ru-RU": "ru-RU-SvetlanaNeural",
            "it-IT": "it-IT-ElsaNeural",
            "pt-BR": "pt-BR-FranciscaNeural",
            "hi-IN": "hi-IN-SwaraNeural",
            "tr-TR": "tr-TR-EmelNeural",
        }
        voice = voices.get(lang, "en-US-AriaNeural")

        async def _speak():
            comm = edge_tts.Communicate(text, voice)
            buf = b""
            async for chunk in comm.stream():
                if chunk["type"] == "audio":
                    buf += chunk["data"]
            return buf

        audio = asyncio.run(_speak())
        return jsonify({"audio": base64.b64encode(audio).decode()})

    except Exception as exc:
        logger.error("TTS: %s", exc)
        return jsonify({"error": "Text-to-speech failed."}), 500


@app.route("/api/stt", methods=["POST"])
@rate_limit(max_reqs=10, window=60)
def api_stt():
    try:
        audio = request.files.get("audio")
        if not audio:
            return jsonify({"error": "No audio file provided."}), 400

        audio.seek(0, 2)
        if audio.tell() > 10 * 1024 * 1024:
            return jsonify({"error": "Audio too large (max 10 MB)."}), 400
        audio.seek(0)

        try:
            model = _get_whisper()
        except ImportError:
            return jsonify({"error": "Whisper not installed. Use browser STT."}), 501

        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            tmp.write(audio.read())
            tmp_path = tmp.name

        try:
            result = model.transcribe(tmp_path)
            return jsonify({
                "text": result["text"].strip(),
                "language": result.get("language", "en"),
            })
        finally:
            os.unlink(tmp_path)

    except Exception as exc:
        logger.error("STT: %s", exc)
        return jsonify({"error": "Speech-to-text failed."}), 500


# ─── Error Handlers ───────────────────────────────────────────────────────────


@app.errorhandler(404)
def err_404(error):
    if request.path.startswith("/api/"):
        return jsonify({"error": "Endpoint not found."}), 404
    return render_template("404.html"), 404


@app.errorhandler(500)
def err_500(error):
    if request.path.startswith("/api/"):
        return jsonify({"error": "Internal server error."}), 500
    return render_template("500.html"), 500


# ─── Main ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    logger.info("Starting EmoBot on %s:%s", host, port)
    app.run(host=host, port=port, debug=debug, threaded=True)
