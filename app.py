from flask import Flask, render_template, request, jsonify, send_from_directory
import os
import google.generativeai as genai
from transformers import XLMRobertaTokenizer, XLMRobertaForSequenceClassification
import torch

app = Flask(__name__, 
            static_url_path='',
            static_folder='static',
            template_folder='templates')

# Configure API
genai.configure(api_key="API KEY")

# Emotion detection setup
emotion_labels = ["admiration", "amusement", "anger", "annoyance", "approval", "caring",
                 "confusion", "curiosity", "desire", "disappointment", "disapproval",
                 "disgust", "embarrassment", "excitement", "fear", "gratitude",
                 "grief", "joy", "love", "nervousness", "optimism", "pride",
                 "realization", "relief", "remorse", "sadness", "surprise", "neutral"]

# Update the path to be relative to the app's root directory
model_path = os.path.join(app.root_path, 'static', 'models', 'xlm-roberta_emotion_model')
tokenizer_emotion = XLMRobertaTokenizer.from_pretrained(model_path)
model_emotion = XLMRobertaForSequenceClassification.from_pretrained(model_path)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model_emotion.to(device)

def detect_emotion(text):
    inputs = tokenizer_emotion(text, return_tensors="pt", padding="max_length", truncation=True, max_length=128)
    inputs = {key: value.to(device) for key, value in inputs.items()}

    with torch.no_grad():
        outputs = model_emotion(**inputs)

    predictions = outputs.logits
    probs = torch.softmax(predictions, dim=1).detach().cpu().numpy()[0]
    emotion_probs = {label: prob for label, prob in zip(emotion_labels, probs)}
    sorted_emotions = sorted(emotion_probs.items(), key=lambda x: x[1], reverse=True)
    return sorted_emotions[0][0]

# Configure text generation
generation_config = {
    "temperature": 0.7,
    "top_p": 0.9,
    "top_k": 40,
    "max_output_tokens": 512,
    "response_mime_type": "text/plain",
}

model = genai.GenerativeModel(
    model_name="gemini-2.0-flash-exp",
    generation_config=generation_config,
)

chat_session = model.start_chat(
    history=[
        {
            "role": "user",
            "parts": [
                "You are an adaptable and empathetic text-generation assistant. Your role is to craft responses that reflect the user's emotional state and the purpose of the interaction. Maintain a warm and understanding tone for emotional support. "
                "For creative or fiction tasks, be imaginative and inspiring. For marketing, use persuasive and engaging language. Always adapt your tone and approach based on the detected emotion and context, ensuring clarity and emotional alignment. ANd avoid the use of emojies",
            ],
        },
    ]
)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat')
def chat():
    return render_template('chat.html')

@app.route('/send_message', methods=['POST'])
def send_message():
    try:
        user_message = request.json.get('message', '')
        if not user_message:
            return jsonify({
                "error": "No message provided"
            }), 400

        emotion = detect_emotion(user_message)

        # Generate chatbot response
        chatbot_message = chat_session.send_message(f"The user is feeling {emotion}. {user_message}").text

        # Return response
        return jsonify({
            "emotion": emotion,
            "response": chatbot_message
        })
    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('500.html'), 500

if __name__ == '__main__':
    app.run(debug=True)