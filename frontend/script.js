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
    const messageColumnProbability = 0.50; // Chance to show a message

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
                if (drop.y !== 0) {
                    drop.y++;
                } else if (drop.message) {
                    drop.y = 1;
                } else {
                    drop.y = 1;
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
            matrixColor = `hsl(${currentHue % 360}, 100%, 50%)`; 
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

    // UI Logic
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
    const scanLine = document.querySelector('.image-preview-container .scan-line');

    const API_ENDPOINT = 'http://127.0.0.1:5000/analyze'; 

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            fileNameDisplay.textContent = `Selected: ${file.name}`;
            resetAnalysisUI(); 
            analysisSection.style.display = 'block';
            displayImagePreview(file, () => {
                startAnalysis(file); 
            });
        } else {
            fileNameDisplay.textContent = 'No file selected.';
            analysisSection.style.display = 'none';
            resetAnalysisUI();
        }
    });

    function displayImagePreview(file, callback) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.onload = () => {
                displayImageInfo(file, imagePreview);
                if (callback) callback(); 
                imagePreview.onload = null; 
            };
            imagePreview.onerror = () => {
                console.error("Error loading image preview.");
                statusText.textContent = "//: Error loading image preview.";
                if (callback) callback(); 
                imagePreview.onerror = null;
            }
        };
        reader.onerror = () => {
            console.error("Error reading file.");
            statusText.textContent = "//: Error reading file.";
             if (callback) callback(); 
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
        progressBar.style.width = '0%';
        progressBar.style.backgroundColor = 'var(--accent-color)'; 
        statusText.textContent = '//: Standby...';
        resultsSection.style.display = 'none';
        overallResultDiv.innerHTML = '';
        overallResultDiv.className = 'overall-result'; 
        tabContents.forEach(content => content.innerHTML = ''); 
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        document.querySelector('.tab-button[data-tab="lsb"]').classList.add('active');
        document.getElementById('tab-lsb').classList.add('active');
        if (scanLine) scanLine.style.display = 'none'; 
    }

    async function startAnalysis(file) {
        if (scanLine) scanLine.style.display = 'block'; 
        progressBar.style.width = '10%'; 
        statusText.textContent = '//: Preparing image for analysis...';

        const formData = new FormData();
        formData.append('image', file); 

        try {
            progressBar.style.width = '30%';
            statusText.textContent = `//: Uploading ${file.name} to analysis server...`;

            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                body: formData,
            });

            progressBar.style.width = '70%';
            statusText.textContent = '//: Analyzing image on server... Please wait.';

            if (!response.ok) {
                let errorMsg = `HTTP error! Status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMsg += ` - ${errorData.error || errorData.message || 'Unknown server error'}`;
                } catch (e) {
                    errorMsg += ` - ${response.statusText}`;
                }
                throw new Error(errorMsg);
            }

            const results = await response.json(); 

            progressBar.style.width = '100%';
            statusText.textContent = '//: Analysis Complete. Rendering results...';

            if (scanLine) scanLine.style.display = 'none'; 
            displayResults(results); 

        } catch (error) {
            console.error('Analysis Error:', error);
            if (scanLine) scanLine.style.display = 'none'; 
            progressBar.style.width = '100%';
            progressBar.style.backgroundColor = 'var(--error-color)'; 
            statusText.textContent = `//: Analysis Failed! ${error.message}`;
            overallResultDiv.innerHTML = `<i class="fas fa-times-circle"></i> Analysis Failed: ${error.message}`;
            overallResultDiv.className = 'overall-result positive'; 
            resultsSection.style.display = 'block'; 
        }
    }

    function displayResults(results) {
        overallResultDiv.innerHTML = `
            <i class="fas ${results.steganography_detected ? 'fa-exclamation-triangle' : 'fa-shield-alt'}"></i>
            ${results.conclusion || (results.steganography_detected ? "Steganography Detected" : "No Steganography Detected")}
        `;
        overallResultDiv.className = 'overall-result'; 
        overallResultDiv.classList.add(results.steganography_detected ? 'positive' : 'negative');

        if (results.detection_methods) {
             populateLSBTab(results.detection_methods.lsb_analysis || {});
             populateChiTab(results.detection_methods.chi_square || {});
             populateExtractTab(results.detection_methods.sample_extraction || {});
             populateHistTab(results.detection_methods.histogram_analysis || {});
        } else {
             console.warn("API response missing 'detection_methods' field.");
             tabContents.forEach(content => content.innerHTML = '<p>//: Detailed analysis data not available.</p>');
        }

        document.querySelector('.tab-content.active').classList.add('active'); 

        const initialActiveContent = document.querySelector('.tab-content.active');
        if (initialActiveContent) {
            const cards = initialActiveContent.querySelectorAll('.method-card');
            cards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('visible');
                }, index * 100); 
            });
        }

        resultsSection.style.display = 'block';
        setTimeout(() => {
             resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100); 
    }

    const initiallyVisibleContent = document.querySelector('.tab-content.active');
    if (initiallyVisibleContent && analysisSection.style.display === 'block' && resultsSection.style.display === 'block') {
         const initialCards = initiallyVisibleContent.querySelectorAll('.method-card');
         initialCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('visible');
            }, index * 100);
        });
    }

    function getConfidence(methodData) {
        return methodData.confidence !== undefined ? methodData.confidence : 0;
    }

    function populateLSBTab(lsb) {
        const confidence = getConfidence(lsb);
        tabContents.forEach(content => {
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

    // Escape HTML to prevent injection
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
             .replace(/&/g, "&")
             .replace(/</g, "<")
             .replace(/>/g, ">")
             .replace(/"/g, "\"")
             .replace(/'/g, "'");
    }

    // Tab navigation
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;

            // Deactivate all tabs and hide/reset content
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => {
                content.classList.remove('active');
                content.querySelectorAll('.method-card').forEach(card => card.classList.remove('visible'));
            });

            // Activate the clicked tab
            button.classList.add('active');
            const activeContent = document.getElementById(`tab-${targetTab}`);
            if (activeContent) {
                activeContent.classList.add('active');

                // Make cards visible with a stagger
                const cards = activeContent.querySelectorAll('.method-card');
                cards.forEach((card, index) => {
                    setTimeout(() => {
                        card.classList.add('visible');
                    }, index * 100); 
                });
            }
        });
    });

}); // End DOMContentLoaded