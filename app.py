from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
import tempfile
from steg_detector import SteganographyDetector
from flask_cors import CORS

app = Flask(__name__)
detector = SteganographyDetector()

CORS(app)

@app.route('/analyze', methods=['POST'])
def analyze_image():
    if 'image' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    filename = secure_filename(file.filename)
    with tempfile.TemporaryDirectory() as tmpdir:
        filepath = os.path.join(tmpdir, filename)
        file.save(filepath)

        result = detector.analyze_image(filepath)
        return jsonify(result)

@app.route('/')
def index():
    return "Steganography Detection API is running."

if __name__ == '__main__':
    app.run(debug=True)
