document.addEventListener('DOMContentLoaded', () => {
    // Matrix effect setup
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
    let matrixColor = '#00FF41'; // Default color

    // Hidden messages
    const hiddenMessages = [
        "I love Pitt CSC",
        "What you know about Nij Patel",
        "Jeremy sleeping on the floor"
    ];
    const messageCharColor = '#6cfa00'; // Color for hidden messages
    const messageColumnProbability = 0.015; // Adjusted probability back down

    const drops = [];
    for (let x = 0; x < columns; x++) {
        drops[x] = { y: Math.floor(Math.random() * canvasHeight), message: null, messageIndex: 0, messageDelay: 0 };
    }

    function drawMatrix() {
        // Fade effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < drops.length; i++) {
            let drop = drops[i];
            let text;
            let fillColor;

            // Message logic
            if (drop.message) {
                if (drop.messageDelay > 0) {
                    text = characters.charAt(Math.floor(Math.random() * characters.length));
                    fillColor = matrixColor;
                    drop.messageDelay--;
                } else {
                    text = drop.message[drop.messageIndex];
                    fillColor = messageCharColor;
                    drop.messageIndex++;
                    if (drop.messageIndex >= drop.message.length) {
                        drop.message = null;
                        drop.messageIndex = 0;
                    }
                }
            } else {
                text = characters.charAt(Math.floor(Math.random() * characters.length));
                fillColor = matrixColor;
            }

            // Draw character
            ctx.fillStyle = fillColor;
            ctx.fillText(text, i * fontSize, drop.y * fontSize);

            // Handle drop movement
            if (drop.y * fontSize > canvasHeight && Math.random() > 0.975) {
                drop.y = 0;
                drop.message = null;
                drop.messageIndex = 0;
                drop.messageDelay = 0;

                if (Math.random() < messageColumnProbability) {
                    drop.message = hiddenMessages[Math.floor(Math.random() * hiddenMessages.length)];
                    drop.messageDelay = Math.floor(Math.random() * 51) + 10;
                }
            } else {
                // Increment y position only if the drop hasn't just reset
                // Ensures characters appear sequentially after reset or message start
                 if (drop.y !== 0 || (drop.y === 0 && !drop.message && drop.messageDelay === 0)) {
                      drop.y++;
                 }
            }
        }
    }

    setInterval(drawMatrix, 80); // Start animation

    window.addEventListener('resize', () => {
        canvasWidth = window.innerWidth;
        canvasHeight = window.innerHeight;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        // TODO: Recalculate columns and reset drops array for better resizing
    });

    // Konami Code easter egg
    const konamiCode = [
        'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
        'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
        'b', 'a'
    ];
    let konamiIndex = 0;
    let easterEggActive = false;
    const originalMatrixColor = '#00FF41';
    let rainbowIntervalId = null;
    let currentHue = 0;

    document.addEventListener('keydown', (e) => {
        if (easterEggActive) return;

        const requiredKey = konamiCode[konamiIndex];
        if (e.key.toLowerCase() === requiredKey.toLowerCase()) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length) {
                activateEasterEgg();
                konamiIndex = 0;
            }
        } else {
            konamiIndex = (e.key.toLowerCase() === konamiCode[0].toLowerCase()) ? 1 : 0;
        }
    });

    function activateEasterEgg() {
        if (easterEggActive) return;

        console.log("//: Konami Code Activated! Rainbow Mode!");
        easterEggActive = true;

        if (rainbowIntervalId) {
            clearInterval(rainbowIntervalId);
        }

        rainbowIntervalId = setInterval(() => {
            matrixColor = `hsl(${currentHue % 360}, 100%, 50%)`; // Use backticks correctly
            currentHue += 5;
        }, 50);

        setTimeout(() => {
            if (rainbowIntervalId) {
                clearInterval(rainbowIntervalId);
                rainbowIntervalId = null;
            }
            matrixColor = originalMatrixColor;
            easterEggActive = false;
            currentHue = 0;
            console.log("//: Matrix Stabilized.");
        }, 5000);
    }

    // --- Steganography Detector UI Logic ---
    // UI Logic elements
    const fileInput = document.getElementById('file-upload');
    const fileNameDisplay = document.getElementById('file-name');
    const analysisSection = document.getElementById('analysis-section');
    const imagePreview = document.getElementById('image-preview');
    const imagePreviewContainer = document.querySelector('.image-preview-container');
    const imageInfoDiv = document.querySelector('.image-info'); // Added reference
    const imageDetailsList = document.getElementById('image-details');
    const progressBar = document.getElementById('progress-bar');
    const statusText = document.getElementById('status-text');
    const resultsSection = document.getElementById('results-section');
    const overallResultDiv = document.getElementById('overall-result');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const scanlineContainer = document.querySelector('.scanline-container');

    // Zip results elements
    const zipResultsNav = document.getElementById('zip-results-nav');
    const zipResultSelector = document.getElementById('zip-result-selector');

    // API Endpoints
    const API_ANALYZE_IMAGE = 'http://127.0.0.1:5000/analyze';
    const API_ANALYZE_ZIP = 'http://127.0.0.1:5000/analyzezip';

    // Global state for zip results
    let currentZipResults = null;
    let currentSelectedFileInZip = null;


    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            fileNameDisplay.textContent = `Selected: ${file.name}`; // Correct template literal
            resetAnalysisUI();
            analysisSection.style.display = 'block';
            analysisSection.dataset.isZip = file.type === 'application/zip' || file.name.endsWith('.zip');
            displayPreviewAndInfo(file, () => {
                startAnalysis(file);
            });
        } else {
            fileNameDisplay.textContent = 'No file selected.';
            analysisSection.style.display = 'none';
            resetAnalysisUI();
        }
    });

    function displayPreviewAndInfo(file, callback) {
        const isZip = analysisSection.dataset.isZip === 'true';

        // Clear previous details and hide image/scanline elements
        imageDetailsList.innerHTML = '';
        imagePreview.style.display = 'none';
        imagePreview.src = '#'; // Clear previous src
        if (scanlineContainer) scanlineContainer.style.display = 'none';
        imagePreviewContainer.innerHTML = '<h3>>> Uploaded File</h3>'; // Reset container
        if (imageInfoDiv) imageInfoDiv.style.display = 'block'; // Ensure metadata section is visible

        if (isZip) {
            // Show placeholder for ZIP
            imagePreviewContainer.innerHTML += 
                `<div class="zip-placeholder" style="font-size: 5em; text-align: center; margin: auto; color: var(--primary-text);">
                    <i class="fas fa-file-archive"></i>
                </div>`;
            displayFileInfo(file); // Display basic file info for zip
            if (callback) setTimeout(callback, 0); // Allow UI update before callback
        } else {
            // Handle image preview
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block'; // Show image element

                // Put the image preview back into its container
                // Ensure scanline div exists within scanline container if needed
                if(scanlineContainer) {
                    const scanLineDiv = scanlineContainer.querySelector('.scan-line') || document.createElement('div');
                    scanLineDiv.className = 'scan-line'; // Ensure class
                    scanLineDiv.style.display = 'none'; // Start hidden

                    scanlineContainer.innerHTML = ''; // Clear first
                    scanlineContainer.appendChild(imagePreview);
                    scanlineContainer.appendChild(scanLineDiv);
                    scanlineContainer.style.display = 'inline-block'; // Show scanline container

                    // Append scanline container to preview container if not already there
                    if (!imagePreviewContainer.contains(scanlineContainer)) {
                        imagePreviewContainer.appendChild(scanlineContainer);
                    }
                } else {
                    // Fallback if scanline container structure isn't used
                     if (!imagePreviewContainer.contains(imagePreview)) {
                         imagePreviewContainer.appendChild(imagePreview);
                     }
                }

                // Wait for image to load to get dimensions
                imagePreview.onload = () => {
                    displayFileInfo(file, imagePreview); // Display full image info
                    if (callback) callback();
                    imagePreview.onload = null; // Prevent multiple calls
                };
                imagePreview.onerror = () => {
                    console.error("Error loading image preview.");
                    statusText.textContent = "//: Error loading image preview.";
                    // Show error within the preview area
                    const errorP = document.createElement('p');
                    errorP.style.color = 'var(--error-color)';
                    errorP.textContent = 'Preview unavailable';
                    imagePreviewContainer.appendChild(errorP);
                    displayFileInfo(file); // Show basic info
                    if (callback) callback();
                    imagePreview.onerror = null;
                }
            };
            reader.onerror = () => {
                console.error("Error reading file.");
                statusText.textContent = "//: Error reading file.";
                const errorP = document.createElement('p');
                errorP.style.color = 'var(--error-color)';
                errorP.textContent = 'Error reading file';
                imagePreviewContainer.appendChild(errorP);
                displayFileInfo(file); // Show basic info
                if (callback) callback();
            }
            reader.readAsDataURL(file);
        }
    }

    function displayFileInfo(file, imgElement = null) {
        imageDetailsList.innerHTML = 
           `<li><strong>Filename:</strong> ${escapeHtml(file.name)}</li>
           <li><strong>File size:</strong> ${(file.size / 1024).toFixed(2)} KB</li>
           <li><strong>MIME Type:</strong> ${escapeHtml(file.type) || 'N/A'}</li>
           `; // Use correct template literal and escape potentially unsafe names/types
        if (imgElement && imgElement.naturalWidth) {
             imageDetailsList.innerHTML += `<li><strong>Dimensions:</strong> ${imgElement.naturalWidth} x ${imgElement.naturalHeight} pixels</li>`; // Correct template literal
        }
    }

    function resetAnalysisUI() {
        progressBar.style.width = '0%';
        progressBar.style.backgroundColor = 'var(--accent-color)';
        statusText.textContent = '//: Standby...';
        resultsSection.style.display = 'none';
        overallResultDiv.innerHTML = '';
        overallResultDiv.className = 'overall-result';
        tabContents.forEach(content => content.innerHTML = '');
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        const defaultTabButton = document.querySelector('.tab-button[data-tab="lsb"]');
        const defaultTabContent = document.getElementById('tab-lsb');
        if (defaultTabButton) defaultTabButton.classList.add('active');
        if (defaultTabContent) defaultTabContent.classList.add('active');

        // Reset image/zip specific elements
        if (scanlineContainer) {
             const scanLine = scanlineContainer.querySelector('.scan-line');
             if (scanLine) scanLine.style.display = 'none';
             scanlineContainer.style.display = 'none';
        }
        imagePreview.style.display = 'none';
        imagePreview.src = '#';
        imagePreviewContainer.innerHTML = '<h3>>> Uploaded File</h3>';
        if (imageInfoDiv) imageInfoDiv.style.display = 'block';
        imageDetailsList.innerHTML = '';

        // Reset zip state
        zipResultsNav.style.display = 'none';
        zipResultSelector.innerHTML = '';
        currentZipResults = null;
        currentSelectedFileInZip = null;
        analysisSection.removeAttribute('data-is-zip');
        delete zipResultSelector.dataset.hasScrolled; // Reset scroll tracking
    }

    async function startAnalysis(file) {
        const isZip = analysisSection.dataset.isZip === 'true';
        const endpoint = isZip ? API_ANALYZE_ZIP : API_ANALYZE_IMAGE;
        const formDataKey = isZip ? 'zip' : 'image';

        // Show scan line only for single images
        if (!isZip && scanlineContainer) {
            const scanLine = scanlineContainer.querySelector('.scan-line');
            if (scanLine) scanLine.style.display = 'block';
            scanlineContainer.style.display = 'inline-block';
        }

        progressBar.style.width = '10%';
        statusText.textContent = `//: Preparing ${isZip ? 'ZIP file' : 'image'} for analysis...`; // Correct template literal

        const formData = new FormData();
        formData.append(formDataKey, file);

        try {
            progressBar.style.width = '30%';
            statusText.textContent = `//: Uploading ${escapeHtml(file.name)} to analysis server...`; // Correct template literal and escape filename

            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData,
            });

            progressBar.style.width = '70%';
            statusText.textContent = `//: Analyzing ${isZip ? 'files in ZIP' : 'image'} on server... Please wait.`; // Correct template literal

            // Hide scanline (if applicable) once analysis starts on server
            if (!isZip && scanlineContainer) {
                 const scanLine = scanlineContainer.querySelector('.scan-line');
                 if (scanLine) scanLine.style.display = 'none';
            }

            if (!response.ok) {
                let errorMsg = `HTTP error! Status: ${response.status}`; // Correct template literal
                try {
                    const errorData = await response.json();
                    errorMsg += ` - ${escapeHtml(errorData.error || errorData.message || 'Unknown server error')}`; // Escape server message
                } catch (e) {
                    errorMsg += ` - ${escapeHtml(response.statusText)}`;
                }
                throw new Error(errorMsg);
            }

            const results = await response.json();

            progressBar.style.width = '100%';
            statusText.textContent = '//: Analysis Complete. Rendering results...';

            // Ensure scanline is hidden
             if (!isZip && scanlineContainer) {
                 const scanLine = scanlineContainer.querySelector('.scan-line');
                 if (scanLine) scanLine.style.display = 'none';
            }

            processAndDisplayResults(results, isZip);

        } catch (error) {
            console.error('Analysis Error:', error);
             if (!isZip && scanlineContainer) { // Hide scanline on error too
                 const scanLine = scanlineContainer.querySelector('.scan-line');
                 if (scanLine) scanLine.style.display = 'none';
            }
            progressBar.style.width = '100%';
            progressBar.style.backgroundColor = 'var(--error-color)';
            statusText.textContent = `//: Analysis Failed! ${error.message}`; // Correct template literal
            overallResultDiv.innerHTML = `<i class="fas fa-times-circle"></i> Analysis Failed: ${error.message}`; // Display escaped message
            overallResultDiv.className = 'overall-result positive'; // Use error styling
            resultsSection.style.display = 'block';
            zipResultsNav.style.display = 'none'; // Hide zip nav on error
        }
    }

    function processAndDisplayResults(results, isZip) {
        currentZipResults = null;
        zipResultSelector.innerHTML = '';
        zipResultsNav.style.display = 'none';
        delete zipResultSelector.dataset.hasScrolled;

        if (isZip) {
            // Assuming results format: { "filename1": { analysis_data... }, "filename2": ... }
            currentZipResults = results;
            const filenames = Object.keys(results).sort();

            if (filenames.length === 0) {
                statusText.textContent = "//: ZIP analysis complete, but no supported images found.";
                overallResultDiv.innerHTML = '<i class="fas fa-info-circle"></i> No images found or processed in ZIP.';
                overallResultDiv.className = 'overall-result'; // Neutral style
                resultsSection.style.display = 'block';
                return;
            }

            filenames.forEach(fname => {
                const option = document.createElement('option');
                option.value = fname;
                option.textContent = fname;
                zipResultSelector.appendChild(option);
            });

            zipResultSelector.removeEventListener('change', handleZipSelectionChange);
            zipResultSelector.addEventListener('change', handleZipSelectionChange);

            zipResultsNav.style.display = 'block';
            currentSelectedFileInZip = filenames[0];
            displaySingleResult(results[currentSelectedFileInZip], currentSelectedFileInZip, true); // Initial load

        } else {
            // Single image result
            displaySingleResult(results, null, true); // Initial load
        }
    }

    function handleZipSelectionChange(event) {
        const selectedFilename = event.target.value;
        if (currentZipResults && currentZipResults[selectedFilename]) {
            currentSelectedFileInZip = selectedFilename;
            displaySingleResult(currentZipResults[selectedFilename], selectedFilename, false); // Not initial load
        }
    }

    function displaySingleResult(resultData, filename = null, isInitialLoad = false) {
        // Update overall result section
        overallResultDiv.innerHTML = 
            `<i class="fas ${resultData.steganography_detected ? 'fa-exclamation-triangle' : 'fa-shield-alt'}"></i>
            ${filename ? `[${escapeHtml(filename)}] ` : ''} <!-- Show escaped filename -->
            ${escapeHtml(resultData.conclusion || (resultData.steganography_detected ? "Steganography Detected" : "No Steganography Detected"))}
        `; // Correct template literal and escape content
        overallResultDiv.className = 'overall-result';
        overallResultDiv.classList.add(resultData.steganography_detected ? 'positive' : 'negative');

        tabContents.forEach(content => content.innerHTML = ''); // Clear tabs

        if (resultData.detection_methods) {
            populateLSBTab(resultData.detection_methods.lsb_analysis || {});
            populateChiTab(resultData.detection_methods.chi_square || {});
            populateExtractTab(resultData.detection_methods.sample_extraction || {});
            populateHistTab(resultData.detection_methods.histogram_analysis || {});
        } else {
            console.warn(`Analysis data missing 'detection_methods' field ${filename ? 'for ' + escapeHtml(filename) : ''}.`); // Escape filename
            tabContents.forEach(content => content.innerHTML = '<p>//: Detailed analysis data not available.</p>');
        }

        // Reset tabs and animate cards for the default tab
        const defaultTabButton = document.querySelector('.tab-button[data-tab="lsb"]');
        const defaultTabContent = document.getElementById('tab-lsb');

        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => {
             content.classList.remove('active');
             content.querySelectorAll('.method-card').forEach(card => card.classList.remove('visible'));
        });

        if(defaultTabButton) defaultTabButton.classList.add('active');
        if(defaultTabContent) {
            defaultTabContent.classList.add('active');
            const cards = defaultTabContent.querySelectorAll('.method-card');
            cards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('visible');
                }, index * 50);
            });
        }

        resultsSection.style.display = 'block';

        // Scroll into view only on initial load
        if (isInitialLoad) {
             setTimeout(() => {
                 resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
             }, 100);
        }
    }


    // --- Tab Population Functions ---
    function getConfidence(methodData) {
        return methodData.confidence !== undefined ? methodData.confidence : 0;
    }

    function populateLSBTab(lsb) {
        const confidence = getConfidence(lsb);
        const tab = document.getElementById('tab-lsb');
        if (!tab) return; // Guard against missing element
        tab.innerHTML = '';
        tab.innerHTML = 
            `<div class="method-card">
                <h4 class="${lsb.detected ? 'detected' : 'not-detected'}">
                    <i class="fas ${lsb.detected ? 'fa-eye' : 'fa-check-circle'}"></i>
                    ${escapeHtml(lsb.detected ? 'LSB Anomalies Detected' : 'LSB Appears Normal')}
                </h4>
                <p><strong>Confidence Score:</strong> ${escapeHtml((confidence * 100).toFixed(1))}%</p>
                <p><strong>Randomness Score:</strong> ${lsb.randomness_score !== undefined ? escapeHtml(lsb.randomness_score.toFixed(3)) : 'N/A'}</p>
                <p><strong>Bit Distribution Score:</strong> ${lsb.bit_distribution_score !== undefined ? escapeHtml(lsb.bit_distribution_score.toFixed(3)) : 'N/A'}</p>
                <p><strong>Log:</strong> ${lsb.details ? escapeHtml(lsb.details) : 'No details provided.'}</p>
            </div>
        `; // Correct template literal & escape content
    }

    function populateChiTab(chi) {
        const confidence = getConfidence(chi);
        const tab = document.getElementById('tab-chi');
        if (!tab) return;
        tab.innerHTML = '';
        tab.innerHTML = 
            `<div class="method-card">
                 <h4 class="${chi.detected ? 'detected' : 'not-detected'}">
                     <i class="fas ${chi.detected ? 'fa-chart-bar' : 'fa-check-circle'}"></i>
                    ${escapeHtml(chi.detected ? 'Statistical Deviation Found' : 'Distribution within Norms')}
                 </h4>
                <p><strong>Confidence Score:</strong> ${escapeHtml((confidence * 100).toFixed(1))}%</p>
                <p><strong>Chi-Square Value:</strong> ${chi.chi_square_value !== undefined ? escapeHtml(chi.chi_square_value.toFixed(3)) : 'N/A'}</p>
                 <p><strong>P-Value:</strong> ${chi.p_value !== undefined ? escapeHtml(chi.p_value.toFixed(5)) : 'N/A'}</p>
                <p><strong>Log:</strong> ${chi.details ? escapeHtml(chi.details) : 'No details provided.'}</p>
            </div>
        `; // Correct template literal & escape content
    }

    function populateExtractTab(extract) {
        const confidence = getConfidence(extract);
        const tab = document.getElementById('tab-extract');
        if (!tab) return;
        tab.innerHTML = '';
        if (extract.detected) {
             tab.innerHTML = 
                `<div class="method-card">
                     <h4 class="detected">
                         <i class="fas fa-file-alt"></i> Hidden Data Extracted
                     </h4>
                    <p><strong>Confidence Score:</strong> ${escapeHtml((confidence * 100).toFixed(1))}%</p>
                    <p><strong>Assumed Data Type:</strong> ${escapeHtml(extract.data_type) || 'Unknown'}</p>
                    <p><strong>Log:</strong> ${extract.details ? escapeHtml(extract.details) : 'Extraction successful.'}</p>
                    <p><strong>Extracted Sample:</strong></p>
                    <code>${extract.sample ? escapeHtml(extract.sample) : 'No readable sample.'}</code>
                </div>
             `; // Correct template literal & escape content
        } else {
             tab.innerHTML = 
                 `<div class="method-card">
                     <h4 class="not-detected">
                         <i class="fas fa-times-circle"></i> No Hidden Data Extracted
                     </h4>
                    <p><strong>Confidence Score:</strong> ${escapeHtml((confidence * 100).toFixed(1))}%</p>
                    <p><strong>Log:</strong> ${extract.details ? escapeHtml(extract.details) : 'No structured data identified.'}</p>
                 </div>
            `; // Correct template literal & escape content
        }
    }

     function populateHistTab(hist) {
        const confidence = getConfidence(hist);
        const tab = document.getElementById('tab-hist');
        if (!tab) return;
        tab.innerHTML = '';
        tab.innerHTML = 
             `<div class="method-card">
                 <h4 class="${hist.detected ? 'detected' : 'not-detected'}">
                     <i class="fas ${hist.detected ? 'fa-wave-square' : 'fa-check-circle'}"></i>
                    ${escapeHtml(hist.detected ? 'Histogram Irregularities Noted' : 'Histogram Appears Normal')}
                 </h4>
                <p><strong>Confidence Score:</strong> ${escapeHtml((confidence * 100).toFixed(1))}%</p>
                <p><strong>Suspicious Patterns Count:</strong> ${hist.suspicious_patterns !== undefined ? escapeHtml(hist.suspicious_patterns) : 'N/A'}</p>
                <p><strong>Log:</strong> ${hist.details ? escapeHtml(hist.details) : 'No details provided.'}</p>
                 ${hist.plot_base64 ? `<img src="data:image/png;base64,${hist.plot_base64}" alt="Histogram Plot" style="max-width: 100%; margin-top: 10px; border: 1px solid var(--border-color);">` : ''}
            </div>
        `; // Correct template literal & escape content
    }

    // Basic HTML escaping
    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') {
             if (unsafe === null || unsafe === undefined) return '';
             unsafe = String(unsafe); // Convert numbers etc. to string
         }
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }


    // --- Tab Navigation ---
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;

            // Deactivate all tabs and reset card visibility
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => {
                content.classList.remove('active');
                content.querySelectorAll('.method-card').forEach(card => card.classList.remove('visible'));
            });

            // Activate the clicked tab
            button.classList.add('active');
            const activeContent = document.getElementById(`tab-${targetTab}`); // Correct template literal
            if (activeContent) {
                activeContent.classList.add('active');

                // Make cards visible with stagger
                const cards = activeContent.querySelectorAll('.method-card');
                 cards.forEach((card, index) => {
                     setTimeout(() => {
                         card.classList.add('visible');
                     }, index * 50);
                 });
            }
        });
    });

}); // End DOMContentLoaded