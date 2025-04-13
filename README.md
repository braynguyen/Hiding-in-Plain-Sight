# Hiding in Plain Sight

Hiding in Plain Sight is a tool designed to extract metadata and other relevant information from image files. It supports various image formats and provides a simple interface for processing and analyzing image data.

## Features

- Extract metadata such as EXIF, dimensions, and file size.
- Support for common image formats (JPEG, PNG, etc.).
- Batch processing of multiple images.
- Command-line interface for easy integration into workflows.
- Lightweight and fast.

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/brayzn/image-data-extractor.git
    cd image-data-extractor
    ```

2. Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

## Usage

1. Start the Flask server
```bash
python app.py
```
2. Open `index.html` in your browser.
3. Upload an image or a `.zip` file containing multiple images.
4. View the extracted metadata directly in your browser.

This provides a convenient way to use the tool without the command line.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.