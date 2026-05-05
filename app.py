from flask import Flask, render_template, request, jsonify
import os
from backend.predictor import predict
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

app = Flask(__name__)

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.5-flash')
else:
    model = None

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict_route():
    if "image" not in request.files:
        return jsonify({"error": "No file uploaded"})

    file = request.files["image"]
    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    result = predict(filepath)

    return jsonify(result)

@app.route("/api/chat", methods=["POST"])
def chat():
    if not model:
        return jsonify({"error": "Gemini API key not configured"}), 500
        
    data = request.json
    message = data.get("message")
    context = data.get("context")
    history = data.get("history", [])
    
    if not message:
        return jsonify({"error": "No message provided"}), 400
        
    try:
        # Format history for Gemini
        formatted_history = []
        for msg in history:
            role = "user" if msg["role"] == "user" else "model"
            formatted_history.append({"role": role, "parts": [msg["content"]]})
            
        chat_session = model.start_chat(history=formatted_history)
        
        # Build prompt with context if available
        if context:
            full_prompt = f"System Note: The user is currently looking at a plant diagnosed with '{context}'. Keep this context in mind to answer their question.\nUser Question: {message}"
        else:
            full_prompt = message
            
        response = chat_session.send_message(full_prompt)
        
        return jsonify({"response": response.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)