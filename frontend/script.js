document.addEventListener('DOMContentLoaded', () => {
    // --- Matrix Background Effect ---
    const canvas = document.getElementById('matrix-canvas');
    const ctx = canvas.getContext('2d');

    let canvasWidth = window.innerWidth;
    let canvasHeight = window.innerHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
    const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    const characters = katakana + latin + nums;
    const fontSize = 16;
    const columns = Math.floor(canvasWidth / fontSize);

    const drops = [];
    for (let x = 0; x < columns; x++) {
        drops[x] = 1;
    }

    function drawMatrix() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = '#00FF41';
        ctx.font = `${fontSize}px monospace`;
        for (let i = 0; i < drops.length; i++) {
            const text = characters.charAt(Math.floor(Math.random() * characters.length));
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > canvasHeight && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }

    const matrixInterval = setInterval(drawMatrix, 40);

    window.addEventListener('resize', () => {
        // Basic resize handling, might need refinement for perfect column recalc
        canvasWidth = window.innerWidth;
        canvasHeight = window.innerHeight;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
    });

    // --- Steganography Detector UI Logic ---
    const fileInput = document.getElementById('file-upload');
    const fileNameDisplay = document.getElementById('file-name');
    const analysisSection = document.getElementById('analysis-section');
    const imagePreview = document.getElementById('image-preview');
    const imageDetailsList = document.getElementById('image-details');
    const progressBar = document.getElementById('progress-bar');
    const statusText = document.getElementById('status-text');
    const resultsSection = document.getElementById('results-section');
    const overallResultDiv = document.getElementById('overall-result');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    const API_ENDPOINT = 'http://127.0.0.1:5000/analyze'; // Your API endpoint

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            fileNameDisplay.textContent = `Selected: ${file.name}`;
            resetAnalysisUI(); // Reset before showing new preview/starting analysis
            analysisSection.style.display = 'block';
            // Display preview *before* starting analysis
            displayImagePreview(file, () => {
                // This callback ensures dimensions are ready before potentially needing them
                // (though the API doesn't strictly need them from the frontend here)
                startAnalysis(file); // Start the actual analysis
            });
        } else {
            fileNameDisplay.textContent = 'No file selected.';
            analysisSection.style.display = 'none';
            resetAnalysisUI();
        }
    });

    function displayImagePreview(file, callback) { // Added callback
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            // Wait for image to load completely to get dimensions
            imagePreview.onload = () => {
                displayImageInfo(file, imagePreview);
                if (callback) callback(); // Execute callback after image info is displayed
                imagePreview.onload = null; // Prevent multiple calls if image source changes again
            };
            imagePreview.onerror = () => {
                console.error("Error loading image preview.");
                statusText.textContent = "//: Error loading image preview.";
                if (callback) callback(); // Still execute callback maybe? Or handle error differently.
                imagePreview.onerror = null;
            }
        };
        reader.onerror = () => {
            console.error("Error reading file.");
            statusText.textContent = "//: Error reading file.";
             if (callback) callback(); // Or handle error.
        }
        reader.readAsDataURL(file);
    }

    function displayImageInfo(file, imgElement) {
        imageDetailsList.innerHTML = `
           <li><strong>Filename:</strong> ${file.name}</li>
           <li><strong>File size:</strong> ${(file.size / 1024).toFixed(2)} KB</li>
           <li><strong>MIME Type:</strong> ${file.type}</li>
           <li><strong>Dimensions:</strong> ${imgElement.naturalWidth} x ${imgElement.naturalHeight} pixels</li>
           `;
    }

    function resetAnalysisUI() {
        // No timer to clear anymore
        progressBar.style.width = '0%';
        progressBar.style.backgroundColor = 'var(--accent-color)'; // Reset color
        statusText.textContent = '//: Standby...';
        resultsSection.style.display = 'none';
        overallResultDiv.innerHTML = '';
        overallResultDiv.className = 'overall-result'; // Reset classes
        tabContents.forEach(content => content.innerHTML = ''); // Clear previous results
        // Reset tabs to default
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        document.querySelector('.tab-button[data-tab="lsb"]').classList.add('active');
        document.getElementById('tab-lsb').classList.add('active');
    }

    async function startAnalysis(file) {
        progressBar.style.width = '10%'; // Initial progress
        statusText.textContent = '//: Preparing image for analysis...';

        const formData = new FormData();
        formData.append('image', file); // Key must match what Flask expects

        try {
            progressBar.style.width = '30%';
            statusText.textContent = `//: Uploading ${file.name} to analysis server...`;

            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                body: formData,
                // No 'Content-Type' header needed, browser sets it correctly for FormData
            });

            progressBar.style.width = '70%';
            statusText.textContent = '//: Analyzing image on server... Please wait.';

            if (!response.ok) {
                 // Try to get error message from response body if possible
                let errorMsg = `HTTP error! Status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMsg += ` - ${errorData.error || errorData.message || 'Unknown server error'}`;
                } catch (e) {
                    // If response wasn't JSON or couldn't be parsed
                    errorMsg += ` - ${response.statusText}`;
                }
                 throw new Error(errorMsg);
            }

            const results = await response.json(); // Parse the JSON response from the API

            progressBar.style.width = '100%';
            statusText.textContent = '//: Analysis Complete. Rendering results...';

            // Add file info from API response to the results if needed,
            // though we already display some from the file object.
            // Example: results.filename = results.filename || file.name; (If API provides it)

            displayResults(results); // Display the actual results

        } catch (error) {
            console.error('Analysis Error:', error);
            progressBar.style.width = '100%';
            progressBar.style.backgroundColor = 'var(--error-color)'; // Indicate error
            statusText.textContent = `//: Analysis Failed! ${error.message}`;
            // Optionally display error in the results section too
            overallResultDiv.innerHTML = `<i class="fas fa-times-circle"></i> Analysis Failed: ${error.message}`;
            overallResultDiv.className = 'overall-result positive'; // Use error styling
            resultsSection.style.display = 'block'; // Show the section to display the error
        }
    }

    // This function now receives the actual API response data
    function displayResults(results) {
        // Display overall result using API data
        overallResultDiv.innerHTML = `
            <i class="fas ${results.steganography_detected ? 'fa-exclamation-triangle' : 'fa-shield-alt'}"></i>
            ${results.conclusion || (results.steganography_detected ? "Steganography Detected" : "No Steganography Detected")}
        `;
        overallResultDiv.classList.add(results.steganography_detected ? 'positive' : 'negative');

        // Populate detailed tabs using API data
        // Check if detection_methods exists before accessing its properties
        if (results.detection_methods) {
             populateLSBTab(results.detection_methods.lsb_analysis || {}); // Pass empty object if method missing
             populateChiTab(results.detection_methods.chi_square || {});
             populateExtractTab(results.detection_methods.sample_extraction || {});
             populateHistTab(results.detection_methods.histogram_analysis || {});
        } else {
             // Handle case where detection_methods might be missing in the response
             console.warn("API response missing 'detection_methods' field.");
             // Clear tabs or show a message
             tabContents.forEach(content => content.innerHTML = '<p>//: Detailed analysis data not available.</p>');
        }


        // Show results section
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Helper function to safely get confidence or default to 0
    function getConfidence(methodData) {
        // API returns 0, frontend expects 0-1 for multiplication.
        // Let's assume API confidence is already 0-1 if present, otherwise 0.
        return methodData.confidence !== undefined ? methodData.confidence : 0;
    }


    function populateLSBTab(lsb) {
        const confidence = getConfidence(lsb);
        tabContents.forEach(content => { // Clear specific tab before populating
            if (content.id === 'tab-lsb') content.innerHTML = '';
        });
        const tab = document.getElementById('tab-lsb');
        tab.innerHTML = `
            <div class="method-card">
                <h4 class="${lsb.detected ? 'detected' : 'not-detected'}">
                    <i class="fas ${lsb.detected ? 'fa-eye' : 'fa-check-circle'}"></i>
                    ${lsb.detected ? 'LSB Anomalies Detected' : 'LSB Appears Normal'}
                </h4>
                <p><strong>Confidence Score:</strong> ${(confidence * 100).toFixed(1)}%</p>
                <p><strong>Randomness Score:</strong> ${lsb.randomness_score !== undefined ? lsb.randomness_score.toFixed(3) : 'N/A'}</p>
                <p><strong>Bit Distribution Score:</strong> ${lsb.bit_distribution_score !== undefined ? lsb.bit_distribution_score.toFixed(3) : 'N/A'}</p>
                <p><strong>Log:</strong> ${lsb.details || 'No details provided.'}</p>
            </div>
        `;
    }

    function populateChiTab(chi) {
        const confidence = getConfidence(chi);
         tabContents.forEach(content => {
            if (content.id === 'tab-chi') content.innerHTML = '';
        });
        const tab = document.getElementById('tab-chi');
        tab.innerHTML = `
            <div class="method-card">
                 <h4 class="${chi.detected ? 'detected' : 'not-detected'}">
                     <i class="fas ${chi.detected ? 'fa-chart-bar' : 'fa-check-circle'}"></i>
                    ${chi.detected ? 'Statistical Deviation Found' : 'Distribution within Norms'}
                 </h4>
                <p><strong>Confidence Score:</strong> ${(confidence * 100).toFixed(1)}%</p>
                <p><strong>Chi-Square Value:</strong> ${chi.chi_square_value !== undefined ? chi.chi_square_value.toFixed(3) : 'N/A'}</p>
                <p><strong>Log:</strong> ${chi.details || 'No details provided.'}</p>
            </div>
        `;
    }

    function populateExtractTab(extract) {
        const confidence = getConfidence(extract);
         tabContents.forEach(content => {
            if (content.id === 'tab-extract') content.innerHTML = '';
        });
        const tab = document.getElementById('tab-extract');
        if (extract.detected) {
             tab.innerHTML = `
                <div class="method-card">
                     <h4 class="detected">
                         <i class="fas fa-file-alt"></i> Hidden Data Extracted
                     </h4>
                    <p><strong>Confidence Score:</strong> ${(confidence * 100).toFixed(1)}%</p>
                    <p><strong>Assumed Data Type:</strong> ${extract.data_type || 'Unknown'}</p>
                    <p><strong>Log:</strong> ${extract.details || 'Extraction successful.'}</p>
                    <p><strong>Extracted Sample:</strong></p>
                    <code>${extract.sample ? escapeHtml(extract.sample) : 'No readable sample.'}</code>
                </div>
             `;
        } else {
             tab.innerHTML = `
                 <div class="method-card">
                     <h4 class="not-detected">
                         <i class="fas fa-times-circle"></i> No Hidden Data Extracted
                     </h4>
                    <p><strong>Confidence Score:</strong> ${(confidence * 100).toFixed(1)}%</p>
                    <p><strong>Log:</strong> ${extract.details || 'No structured data identified.'}</p>
                 </div>
            `;
        }
    }

     function populateHistTab(hist) {
        const confidence = getConfidence(hist);
         tabContents.forEach(content => {
            if (content.id === 'tab-hist') content.innerHTML = '';
        });
        const tab = document.getElementById('tab-hist');
        tab.innerHTML = `
             <div class="method-card">
                 <h4 class="${hist.detected ? 'detected' : 'not-detected'}">
                     <i class="fas ${hist.detected ? 'fa-wave-square' : 'fa-check-circle'}"></i>
                    ${hist.detected ? 'Histogram Irregularities Noted' : 'Histogram Appears Normal'}
                 </h4>
                <p><strong>Confidence Score:</strong> ${(confidence * 100).toFixed(1)}%</p>
                <p><strong>Suspicious Patterns Count:</strong> ${hist.suspicious_patterns !== undefined ? hist.suspicious_patterns : 'N/A'}</p>
                <p><strong>Log:</strong> ${hist.details || 'No details provided.'}</p>
            </div>
        `;
    
    }

    // Helper to prevent basic HTML injection from extracted sample
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
             .replace(/&/g, "&")
             .replace(/</g, "<")
             .replace(/>/g, ">")
             .replace(/"/g, "\"")
             .replace(/'/g, "'");
    }

    // --- Tab Navigation ---
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(`tab-${targetTab}`).classList.add('active');
        });
    });

}); // End DOMContentLoaded