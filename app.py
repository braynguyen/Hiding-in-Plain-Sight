from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
import tempfile
import zipfile
import base64
import mimetypes
from steg_detector import SteganographyDetector
from flask_cors import CORS
from PIL import Image
import numpy as np
import base64

app = Flask(__name__)
detector = SteganographyDetector()

CORS(app)

def create_lsb_pic(tmpdir, filepath):
    img = Image.open(filepath)
    img = img.convert("RGB")
    img_array = np.array(img)

    # Extract the least significant bit (LSB) of each pixel
    lsb_array = img_array & 1
    lsb_image_array = (lsb_array * 255).astype(np.uint8)

    try:
        lsb_image = Image.fromarray(lsb_image_array)

        # Save the LSB image to a temporary file
        base_name = os.path.splitext(os.path.basename(filepath))[0]
        lsb_image_path = os.path.join(tmpdir, f"{base_name}_lsb.png")
        lsb_image.save(lsb_image_path)

        # Encode the LSB image in base64
        with open(lsb_image_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
            # Return the base64-encoded LSB image as a string
            return encoded_string
    except Exception as e:
        print(f"Error processing LSB image: {e}")
        return None

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
        lsb_pic = create_lsb_pic(tmpdir, filepath)
        result['lsbpic'] = lsb_pic
        return jsonify(result)

@app.route('/analyzezip', methods=['POST'])
def analyze_zip():
    if 'zip' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['zip']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    filename = secure_filename(file.filename)
    with tempfile.TemporaryDirectory() as tmpdir:
        zip_path = os.path.join(tmpdir, filename)
        file.save(zip_path)


        if not zipfile.is_zipfile(zip_path):
            return jsonify({"error": "Uploaded file is not a valid zip file"}), 400

        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(tmpdir)

        results = {'files': []}
        for root, _, files in os.walk(tmpdir):
            for name in files:
                file_path = os.path.join(root, name)
                if file_path == zip_path:
                    continue
                mime_type, _ = mimetypes.guess_type(file_path)
                if not mime_type or not mime_type.startswith('image/'):
                    continue
                    
                analysis_data = detector.analyze_image(file_path)
                
                try:
                    with open(file_path, 'rb') as image_file:
                        image_data = base64.b64encode(image_file.read()).decode('utf-8')
                        analysis_data['image_data'] = image_data
                        analysis_data['mime_type'] = mime_type
                except Exception as e:
                    print(f"error reading or encoding image {name}: {e}")
                    analysis_data['image_data'] = None
                    analysis_data['mime_type'] = None

                # Add LSB pic to the analysis data
                try:
                    lsb_pic = create_lsb_pic(tmpdir, file_path)
                    analysis_data['lsbpic'] = lsb_pic
                except Exception as e:
                    print(f"error creating LSB pic for image {name}: {e}")
                    analysis_data['lsbpic'] = None

                results['files'].append({name: analysis_data})

        return jsonify(results)


@app.route('/')
def index():
    return "Steganography Detection API is running."

if __name__ == '__main__':
    app.run(debug=True)
