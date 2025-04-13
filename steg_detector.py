import os

import numpy as np
from PIL import Image
import cv2
from stegano import lsb
import jpegio as jio
from scipy.stats import chisquare
import binascii

class SteganographyDetector:
    """Class for detecting steganography in images using various techniques."""
    
    def __init__(self):
        """Initialize the detector with default thresholds."""
        self.lsb_threshold = 0.3
        self.chi_square_threshold = 0.1
        
    def analyze_image(self, image_path):
        """
        Analyze an image using multiple detection techniques.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            dict: Results of various detection methods
        """
        results = {
            "filename": os.path.basename(image_path),
            "file_size": os.path.getsize(image_path),
            "detection_methods": {}
        }
        
        # Run different detection methods
        results["detection_methods"]["lsb_analysis"] = self.detect_lsb(image_path)
        results["detection_methods"]["chi_square"] = self.chi_square_test(image_path)
        results["detection_methods"]["sample_extraction"] = self.extract_sample(image_path)
        results["detection_methods"]["histogram_analysis"] = self.histogram_analysis(image_path)
        results["detection_methods"]["jsteg_dct_analysis"] = self.detect_jsteg(image_path)

        
        # Determine overall likelihood of steganography
        positive_detections = sum(1 for method, result in results["detection_methods"].items() 
                                if isinstance(result, dict) and result.get("detected", False))
        
        if positive_detections >= 2:
            results["conclusion"] = "High probability of hidden data"
            results["steganography_detected"] = 2
        elif positive_detections == 1:
            results["conclusion"] = "Possible hidden data detected"
            results["steganography_detected"] = 1
        else:
            results["conclusion"] = "No hidden data detected"
            results["steganography_detected"] = 0
            
        return results
    
    def detect_lsb(self, image_path):
        """
        Detect LSB (Least Significant Bit) steganography.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            dict: Detection results
        """
        try:
            # Open image and convert to numpy array
            img = Image.open(image_path)
            img_array = np.array(img)
            
            # Check if image has enough channels for analysis
            if len(img_array.shape) < 3:
                return {"detected": False, "reason": "Grayscale image, insufficient channels for LSB analysis"}
            
            # Extract LSB from each channel
            lsb_patterns = []
            for channel in range(min(3, img_array.shape[2])):  # Analyze up to 3 channels
                channel_data = img_array[:, :, channel]
                lsb_data = channel_data % 2  # Get LSB
                lsb_patterns.append(lsb_data)
            
            # Calculate randomness score (0 = perfectly random, 1 = perfectly uniform)
            randomness_scores = []
            for lsb_pattern in lsb_patterns:
                # Count transitions (0->1 or 1->0)
                transitions = np.sum(np.abs(np.diff(lsb_pattern, axis=1))) + np.sum(np.abs(np.diff(lsb_pattern, axis=0)))
                max_transitions = 2 * lsb_pattern.size - lsb_pattern.shape[0] - lsb_pattern.shape[1]
                randomness = transitions / max_transitions if max_transitions > 0 else 0
                randomness_scores.append(randomness)
            
            avg_randomness = sum(randomness_scores) / len(randomness_scores)
            
            # Calculate bit distribution (should be close to 50% for each bit value in random data)
            bit_distributions = []
            for lsb_pattern in lsb_patterns:
                ones_ratio = np.sum(lsb_pattern) / lsb_pattern.size
                bit_distributions.append(abs(ones_ratio - 0.5))
            
            avg_bit_distribution = sum(bit_distributions) / len(bit_distributions)
            
            # Combine metrics for final score
            lsb_score = (avg_randomness + avg_bit_distribution) / 2

            # compute the confidence score
            confidence_score = max(1 - (lsb_score / self.lsb_threshold), 0)

            
            return {
                "detected": bool(confidence_score > 0.5),
                "confidence": confidence_score,
                "randomness_score": avg_randomness.item(),
                "bit_distribution_score": avg_bit_distribution.item(),
                "details": "LSB patterns show signs of non-random data" if lsb_score < self.lsb_threshold else "LSB patterns appear random"
            }
            
        except Exception as e:
            return {"detected": False, "error": str(e)}
        
    def detect_jsteg(self, image_path):
        """
        Detect potential JSteg steganography by analyzing DCT coefficients in JPEG images.

        Args:
            image_path: Path to JPEG image file
            
        Returns:
            dict: Detection results
        """
        try:
            if not image_path.lower().endswith(".jpg") and not image_path.lower().endswith(".jpeg"):
                return {"detected": False, "reason": "Not a JPEG image"}
            
            jpeg = jio.read(image_path)
            coeffs = jpeg.coef_arrays[0]  # Y channel DCT coefficients
            quant = jpeg.quant_tables[0]  # Quantization table

            # Flatten the 2D blocks to 1D array of non-zero AC coefficients
            non_zero_ac_coeffs = coeffs[(coeffs != 0) & (coeffs != coeffs[0, 0])].flatten()
            
            if len(non_zero_ac_coeffs) == 0:
                return {"detected": False, "reason": "No valid AC coefficients to analyze"}

            lsb_values = np.abs(non_zero_ac_coeffs) % 2
            ones = np.sum(lsb_values)
            zeros = len(lsb_values) - ones

            # Expected uniform distribution
            expected = [len(lsb_values) / 2] * 2
            chi_stat, p_value = chisquare([zeros, ones], f_exp=expected)

            detected = p_value < 0.05
            return {
                "detected": detected,
                "p_value": p_value,
                "ones_ratio": ones / len(lsb_values),
                "details": "LSB of AC DCT coefficients show non-uniform distribution" if detected else "No strong sign of manipulation in DCT LSBs"
            }

        except Exception as e:
            return {"detected": False, "error": str(e)}
    
    def chi_square_test(self, image_path):
        """
        Perform chi-square test to detect steganography.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            dict: Detection results
        """
        try:
            # Open image with OpenCV for better histogram analysis
            img = cv2.imread(image_path)
            if img is None:
                return {"detected": False, "reason": "Unable to read image with OpenCV"}
            
            # Convert to YCrCb color space which is better for steganography detection
            if len(img.shape) == 3 and img.shape[2] == 3:
                img_ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
                channels = cv2.split(img_ycrcb)
            else:
                channels = [img]  # Grayscale image
            
            chi_square_results = []
            
            for i, channel in enumerate(channels):
                # Calculate histograms for even and odd values
                hist_even = np.zeros(128, dtype=np.float32)
                hist_odd = np.zeros(128, dtype=np.float32)
                
                for j in range(256):
                    if j % 2 == 0:
                        hist_even[j // 2] = cv2.calcHist([channel], [0], None, [256], [0, 256])[j]
                    else:
                        hist_odd[j // 2] = cv2.calcHist([channel], [0], None, [256], [0, 256])[j]
                
                # Calculate chi-square statistic
                chi_square = 0
                for k in range(128):
                    expected = (hist_even[k] + hist_odd[k]) / 2
                    if expected > 0:
                        chi_square += ((hist_even[k] - expected) ** 2) / expected
                        chi_square += ((hist_odd[k] - expected) ** 2) / expected
                
                # Normalize chi-square value
                chi_square /= (2 * 128)
                chi_square_results.append(chi_square)
            
            avg_chi_square = sum(chi_square_results) / len(chi_square_results)
            confidence_score = 1 - (avg_chi_square / self.chi_square_threshold) if avg_chi_square < self.chi_square_threshold else 0
            
            return {
                "detected": bool(confidence_score > 0.5),
                "confidence":confidence_score,
                "chi_square_value": avg_chi_square.item(),
                "details": "Chi-square test indicates potential hidden data" if avg_chi_square < self.chi_square_threshold else "Chi-square test shows normal distribution"
            }
            
        except Exception as e:
            return {"detected": False, "error": str(e)}
    
    def extract_sample(self, image_path):
        """
        Attempt to extract a sample of potentially hidden data.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            dict: Extraction results
        """
        try:
            # Manual LSB extraction for a sample
            img = Image.open(image_path)
            img_array = np.array(img)
            
            if len(img_array.shape) < 3:
                return {"detected": False, "reason": "Grayscale image, insufficient channels for sample extraction"}
            
            # Extract LSB from a portion of the image
            sample_size = img_array.shape[0] * img_array.shape[1]
            lsb_bits = []
            
            for i in range(sample_size):
                row = i // img_array.shape[1]
                col = i % img_array.shape[1]
                if row < img_array.shape[0]:
                    pixel = img_array[row, col]
                    if len(img_array.shape) == 3 and img_array.shape[2] >= 3:
                        for channel in range(3):  # R, G, B
                            lsb_bits.append(pixel[channel] & 1)
            
            # Convert bits to bytes
            if len(lsb_bits) >= 8:
                byte_array = bytearray()
                for i in range(0, len(lsb_bits) - 7, 8):
                    byte = 0
                    for j in range(8):
                        byte = (byte << 1) | lsb_bits[i + j]
                    byte_array.append(byte)
                
                sample_text = byte_array.decode('ascii', errors='replace')
                sample_hex = binascii.hexlify(byte_array).decode('ascii')

                return {
                    'detected': True,
                    'sample_text': sample_text,
                    'sample_hex': sample_hex
                }
            
            return {"detected": False, "reason": "No hidden data found in sample"}
            
        except Exception as e:
            return {"detected": False, "error": str(e)}
    
    def histogram_analysis(self, image_path):
        """
        Analyze image histograms for signs of manipulation.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            dict: Analysis results
        """
        try:
            # Open image with OpenCV
            img = cv2.imread(image_path)
            if img is None:
                return {"detected": False, "reason": "Unable to read image with OpenCV"}
            
            # Split into channels
            if len(img.shape) == 3 and img.shape[2] == 3:
                channels = cv2.split(img)
            else:
                channels = [img]  # Grayscale image
            
            # Analyze each channel's histogram
            suspicious_patterns = 0
            details = []
            
            for i, channel in enumerate(channels):
                hist = cv2.calcHist([channel], [0], None, [256], [0, 256])
                
                # Check for "comb" pattern in histogram (alternating high-low values)
                comb_score = 0
                for j in range(1, 255, 2):
                    if hist[j-1] > 0 and hist[j+1] > 0 and hist[j] < (hist[j-1] + hist[j+1]) / 4:
                        comb_score += 1
                
                # Check for unusual peaks at specific values
                unusual_peaks = 0
                for j in range(1, 255):
                    if hist[j] > 3 * (hist[j-1] + hist[j+1]) / 2:
                        unusual_peaks += 1
                
                # Check for abnormal distribution of even vs odd values
                even_sum = sum(hist[j] for j in range(0, 256, 2))
                odd_sum = sum(hist[j] for j in range(1, 256, 2))
                even_odd_ratio = abs(even_sum - odd_sum) / (even_sum + odd_sum) if (even_sum + odd_sum) > 0 else 0
                
                channel_name = ["Blue", "Green", "Red"][i] if i < 3 else f"Channel {i}"
                
                if comb_score > 10:
                    suspicious_patterns += 1
                    details.append(f"{channel_name} channel shows comb pattern in histogram")
                
                if unusual_peaks > 5:
                    suspicious_patterns += 1
                    details.append(f"{channel_name} channel has unusual peaks in histogram")
                
                if even_odd_ratio > 0.1:
                    suspicious_patterns += 1
                    details.append(f"{channel_name} channel has abnormal even/odd value distribution")

            confidence_score = min(suspicious_patterns / 6, 1.0) if suspicious_patterns > 0 else 0;
            
            return {
                "detected": bool(confidence_score > 0.5),
                "confidence": confidence_score,
                "suspicious_patterns": suspicious_patterns,
                "details": "; ".join(details) if details else "No suspicious histogram patterns detected"
            }
            
        except Exception as e:
            return {"detected": False, "error": str(e)}

# Function to create test images with hidden data for testing
def create_test_images(output_dir):
    """
    Create test images with and without hidden data for testing.
    
    Args:
        output_dir: Directory to save test images
    """
    os.makedirs(output_dir, exist_ok=True)
    
    # Create a clean image
    clean_img = np.zeros((300, 300, 3), dtype=np.uint8)
    clean_img[:100, :, 0] = 255  # Blue top
    clean_img[100:200, :, 1] = 255  # Green middle
    clean_img[200:, :, 2] = 255  # Red bottom
    cv2.imwrite(os.path.join(output_dir, "clean_test.png"), clean_img)
    
    # Create an image with LSB steganography
    steg_img = clean_img.copy()
    
    # Hide a message in the LSB
    message = "This is a hidden message for testing steganography detection."
    message_bits = []
    for char in message:
        bits = bin(ord(char))[2:].zfill(8)
        message_bits.extend([int(bit) for bit in bits])
    
    # Embed bits in the image
    for i, bit in enumerate(message_bits):
        if i < steg_img.size // 3:  # Ensure we don't exceed image size
            row = (i // steg_img.shape[1]) % steg_img.shape[0]
            col = i % steg_img.shape[1]
            channel = 0  # Use blue channel
            steg_img[row, col, channel] = (steg_img[row, col, channel] & 0xFE) | bit
    
    cv2.imwrite(os.path.join(output_dir, "steg_test.png"), steg_img)
    
    return os.path.join(output_dir, "clean_test.png"), os.path.join(output_dir, "steg_test.png")

# Test function
def test_detector(detector, clean_image_path, steg_image_path):
    """
    Test the detector with known clean and steganographic images.
    
    Args:
        detector: SteganographyDetector instance
        clean_image_path: Path to clean test image
        steg_image_path: Path to test image with hidden data
        
    Returns:
        dict: Test results
    """
    clean_results = detector.analyze_image(clean_image_path)
    steg_results = detector.analyze_image(steg_image_path)
    
    return {
        "clean_image": {
            "path": clean_image_path,
            "detected_as_steg": clean_results["steganography_detected"],
            "conclusion": clean_results["conclusion"]
        },
        "steg_image": {
            "path": steg_image_path,
            "detected_as_steg": steg_results["steganography_detected"],
            "conclusion": steg_results["conclusion"]
        },
        "success": not clean_results["steganography_detected"] and steg_results["steganography_detected"]
    }

if __name__ == "__main__":
    # Create a detector instance
    detector = SteganographyDetector()
    
    # Create test images
    test_dir = "test_images"
    clean_image, steg_image = create_test_images(test_dir)
    
    # Test the detector
    test_results = test_detector(detector, clean_image, steg_image)
    
    print("Steganography Detector Test Results:")
    print(f"Clean image correctly identified: {not test_results['clean_image']['detected_as_steg']}")
    print(f"Steg image correctly identified: {test_results['steg_image']['detected_as_steg']}")
    print(f"Overall test success: {test_results['success']}")
