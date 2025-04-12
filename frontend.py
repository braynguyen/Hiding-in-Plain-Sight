import streamlit as st
import os
import tempfile
from PIL import Image
import time
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from steg_detector import SteganographyDetector

# Set page configuration
st.set_page_config(
    page_title="Steganography Image Detector",
    page_icon="🔍",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        color: #1E3A8A;
        margin-bottom: 1rem;
    }
    .sub-header {
        font-size: 1.5rem;
        color: #2563EB;
        margin-bottom: 1rem;
    }
    .result-header {
        font-size: 1.8rem;
        font-weight: bold;
        margin-top: 1rem;
    }
    .positive-result {
        color: #DC2626;
        font-weight: bold;
    }
    .negative-result {
        color: #059669;
        font-weight: bold;
    }
    .info-box {
        background-color: #EFF6FF;
        padding: 1rem;
        border-radius: 0.5rem;
        border-left: 5px solid #2563EB;
        margin-bottom: 1rem;
        color: black;
    }
    .steg-details {
        background-color: #FEF2F2;
        padding: 1rem;
        border-radius: 0.5rem;
        border-left: 5px solid #DC2626;
        margin-top: 1rem;
        color: black;
    }
    .method-card {
        background-color: #F9FAFB;
        padding: 1rem;
        border-radius: 0.5rem;
        border: 1px solid #E5E7EB;
        margin-bottom: 1rem;
        color: black;
    }
    .footer {
        margin-top: 3rem;
        text-align: center;
        color: #6B7280;
    }
</style>
""", unsafe_allow_html=True)

def main():
    # Header
    st.markdown('<h1 class="main-header">Hidden in Plain Sight</h1>', unsafe_allow_html=True)
    st.markdown('<h2 class="sub-header">Steganography Image Detector</h2>', unsafe_allow_html=True)
    
    # Create sidebar
    with st.sidebar:
        st.markdown("## About Steganography")
        st.markdown("""
        **Steganography** is the practice of concealing information within other non-secret data or a physical object to avoid detection.
        
        Unlike encryption, which makes data unreadable, steganography hides the existence of the secret message altogether.
        
        **Common techniques include:**
        - LSB (Least Significant Bit) manipulation
        - DCT coefficient manipulation (used in JPEG)
        - Palette-based techniques
        - Spread spectrum methods
        
        This tool focuses primarily on detecting LSB steganography, which is one of the most common methods.
        """)
        
        st.markdown("---")
        st.markdown("## Detection Methods")
        st.markdown("""
        This tool uses multiple detection techniques:
        
        1. **LSB Analysis**: Examines patterns in the least significant bits
        2. **Chi-Square Test**: Statistical analysis of pixel value distributions
        3. **Sample Extraction**: Attempts to extract hidden data
        4. **Histogram Analysis**: Looks for unusual patterns in color distributions
        """)
    
    # File uploader
    uploaded_file = st.file_uploader("Choose an image file", type=["jpg", "jpeg", "png", "bmp", "gif", "tiff"])
    
    # Process the uploaded file
    if uploaded_file is not None:
        # Display the uploaded image
        col1, col2 = st.columns([1, 2])
        
        with col1:
            st.markdown("### Uploaded Image")
            image = Image.open(uploaded_file)
            st.image(image, width=300)
            
            # Display basic image information
            st.markdown("### Image Information")
            file_details = {
                "Filename": uploaded_file.name,
                "File size": f"{uploaded_file.size / 1024:.2f} KB",
                "Image format": image.format,
                "Dimensions": f"{image.width} x {image.height} pixels",
                "Color mode": image.mode
            }
            
            for key, value in file_details.items():
                st.write(f"**{key}:** {value}")
        
        with col2:
            # Save the uploaded file to a temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=f".{image.format.lower() if image.format else 'png'}") as temp_file:
                image.save(temp_file.name)
                temp_file_path = temp_file.name
            
            # Create progress bar for analysis
            st.markdown("### Analyzing Image")
            progress_bar = st.progress(0)
            status_text = st.empty()
            
            # Initialize detector
            detector = SteganographyDetector()
            
            # Simulate analysis progress
            for i in range(101):
                progress_bar.progress(i)
                if i < 20:
                    status_text.text("Performing LSB analysis...")
                elif i < 40:
                    status_text.text("Running chi-square test...")
                elif i < 60:
                    status_text.text("Attempting to extract hidden data...")
                elif i < 80:
                    status_text.text("Analyzing image histograms...")
                else:
                    status_text.text("Finalizing results...")
                if i < 100:
                    time.sleep(0.02)  # Simulate processing time
            
            # Perform actual analysis
            results = detector.analyze_image(temp_file_path)
            
            # Display results
            status_text.empty()
            progress_bar.empty()
            
            # Overall result
            if results["steganography_detected"]:
                st.markdown(f'<div class="steg-details"><h3 class="result-header positive-result">⚠️ {results["conclusion"]}</h3></div>', unsafe_allow_html=True)
            else:
                st.markdown(f'<h3 class="result-header negative-result">✅ {results["conclusion"]}</h3>', unsafe_allow_html=True)
            
            # Display detailed results for each method
            st.markdown("### Detection Method Results")
            
            # Create tabs for different detection methods
            tabs = st.tabs(["LSB Analysis", "Chi-Square Test", "Sample Extraction", "Histogram Analysis"])
            
            # LSB Analysis tab
            with tabs[0]:
                lsb_results = results["detection_methods"]["lsb_analysis"]
                st.markdown(f"""
                <div class="method-card">
                    <h4>{'🔴 Detected' if lsb_results.get('detected', False) else '🟢 Not Detected'}</h4>
                    <p><strong>Confidence:</strong> {lsb_results.get('confidence', 0) * 100:.1f}%</p>
                    <p><strong>Randomness Score:</strong> {lsb_results.get('randomness_score', 0):.3f}</p>
                    <p><strong>Bit Distribution Score:</strong> {lsb_results.get('bit_distribution_score', 0):.3f}</p>
                    <p><strong>Details:</strong> {lsb_results.get('details', 'No details available')}</p>
                </div>
                """, unsafe_allow_html=True)
            
            # Chi-Square Test tab
            with tabs[1]:
                chi_results = results["detection_methods"]["chi_square"]
                st.markdown(f"""
                <div class="method-card">
                    <h4>{'🔴 Detected' if chi_results.get('detected', False) else '🟢 Not Detected'}</h4>
                    <p><strong>Confidence:</strong> {chi_results.get('confidence', 0) * 100:.1f}%</p>
                    <p><strong>Chi-Square Value:</strong> {chi_results.get('chi_square_value', 0):.3f}</p>
                    <p><strong>Details:</strong> {chi_results.get('details', 'No details available')}</p>
                </div>
                """, unsafe_allow_html=True)
            
            # Sample Extraction tab
            with tabs[2]:
                sample_results = results["detection_methods"]["sample_extraction"]
                if sample_results.get('detected', False):
                    st.markdown(f"""
                    <div class="method-card">
                        <h4>🔴 Hidden Data Extracted</h4>
                        <p><strong>Data Type:</strong> {sample_results.get('data_type', 'Unknown')}</p>
                        <p><strong>Details:</strong> {sample_results.get('details', 'No details available')}</p>
                    </div>
                    """, unsafe_allow_html=True)
                    
                    st.markdown("#### Extracted Sample:")
                    st.code(sample_results.get('sample', 'No sample available'))
                else:
                    st.markdown(f"""
                    <div class="method-card">
                        <h4>🟢 No Hidden Data Extracted</h4>
                        <p><strong>Reason:</strong> {sample_results.get('reason', sample_results.get('error', 'No hidden data found'))}</p>
                    </div>
                    """, unsafe_allow_html=True)
            
            # Histogram Analysis tab
            with tabs[3]:
                hist_results = results["detection_methods"]["histogram_analysis"]
                st.markdown(f"""
                <div class="method-card">
                    <h4>{'🔴 Detected' if hist_results.get('detected', False) else '🟢 Not Detected'}</h4>
                    <p><strong>Confidence:</strong> {hist_results.get('confidence', 0) * 100:.1f}%</p>
                    <p><strong>Suspicious Patterns:</strong> {hist_results.get('suspicious_patterns', 0)}</p>
                    <p><strong>Details:</strong> {hist_results.get('details', 'No details available')}</p>
                </div>
                """, unsafe_allow_html=True)
            
            # Clean up temporary file
            os.unlink(temp_file_path)
    
    # Footer
    st.markdown("""
    <div class="footer">
        <p>This tool is designed for digital forensics and security research purposes.</p>
        <p>Use responsibly and ethically.</p>
    </div>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()
