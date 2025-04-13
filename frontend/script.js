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
        }, 10000);
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
    const lsbPicContainer = document.getElementById('lsb-pic-container'); // New reference
    const lsbPicImg = document.getElementById('lsb-pic'); // New reference
    const magnifierLens = lsbPicContainer?.querySelector('.magnifier-lens'); // Magnifier lens
    const magnifierResult = lsbPicContainer?.querySelector('.magnifier-result'); // Magnifier result display

    // Zip results elements
    const zipResultsNav = document.getElementById('zip-results-nav');
    const zipResultSelector = document.getElementById('zip-result-selector');

    // API Endpoints
    const API_ANALYZE_IMAGE = 'http://127.0.0.1:5000/analyze';
    const API_ANALYZE_ZIP = 'http://127.0.0.1:5000/analyzezip';

    // Global state for zip results
    let currentZipResults = null;
    let currentSelectedFileInZip = null;

    // --- Global Mousemove Listener for Cursor Glow Effect ---
    document.addEventListener('mousemove', (e) => {
        // Update CSS variables for the glow position
        document.body.style.setProperty('--cursor-x', e.clientX + 'px');
        document.body.style.setProperty('--cursor-y', e.clientY + 'px');
    });

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

    function displayFileInfo(fileOrData, imgElement = null) {
        const isFileDataObject = typeof fileOrData === 'object' && fileOrData !== null && fileOrData.filename;
        const filename = isFileDataObject ? fileOrData.filename : fileOrData.name;
        const filesize = isFileDataObject ? fileOrData.file_size : fileOrData.size;
        const mimetype = isFileDataObject ? fileOrData.mime_type : fileOrData.type;

        imageDetailsList.innerHTML = 
           `<li><strong>Filename:</strong> ${escapeHtml(filename)}</li>
           <li><strong>File size:</strong> ${(filesize / 1024).toFixed(2)} KB</li>
           <li><strong>MIME Type:</strong> ${escapeHtml(mimetype) || 'N/A'}</li>
           `;
        if (imgElement && imgElement.naturalWidth) {
             imageDetailsList.innerHTML += `<li><strong>Dimensions:</strong> ${imgElement.naturalWidth} x ${imgElement.naturalHeight} pixels</li>`;
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

        // Reset LSB Pic elements
        if (lsbPicContainer) lsbPicContainer.style.display = 'none';
        if (lsbPicImg) lsbPicImg.src = '#';
        // Hide magnifier elements on reset
        if (magnifierLens) magnifierLens.style.display = 'none';
        if (magnifierResult) magnifierResult.style.display = 'none';

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
            console.log(results);
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
            // Check if the expected 'files' array exists
            if (!results || !Array.isArray(results.files) || results.files.length === 0) {
                console.warn("ZIP Analysis: Response format incorrect or no files found.", results);
                statusText.textContent = "//: ZIP analysis complete, but no supported image data found.";
                overallResultDiv.innerHTML = '<i class="fas fa-info-circle"></i> No images found or processed in ZIP.';
                overallResultDiv.className = 'overall-result'; // Neutral style
                resultsSection.style.display = 'block';
                return;
            }

            // Store the array of file result objects
            currentZipResults = results.files; 

            // Populate the dropdown and prepare for display
            const filenames = currentZipResults.map(fileObj => Object.keys(fileObj)[0]).sort();

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

            // Find the data for the first file to display initially
            const firstFileObject = currentZipResults.find(fileObj => Object.keys(fileObj)[0] === currentSelectedFileInZip);
            if (firstFileObject) {
                const firstFileData = firstFileObject[currentSelectedFileInZip];

                // --- added: display the first image preview --- 
                if (firstFileData.image_data && firstFileData.mime_type) {
                    imagePreview.src = `data:${firstFileData.mime_type};base64,${firstFileData.image_data}`;
                    imagePreview.style.display = 'block';
                    if (scanlineContainer) {
                        scanlineContainer.innerHTML = ''; // Clear first
                        scanlineContainer.appendChild(imagePreview);
                        // Ensure scan line div exists and is hidden initially
                        let scanLineDiv = scanlineContainer.querySelector('.scan-line');
                        if (!scanLineDiv) {
                            scanLineDiv = document.createElement('div');
                            scanLineDiv.className = 'scan-line';
                            scanlineContainer.appendChild(scanLineDiv);
                        }
                        scanLineDiv.style.display = 'none';
                        scanlineContainer.style.display = 'inline-block';
                        // Add scanline container back to main preview container
                        if (!imagePreviewContainer.contains(scanlineContainer)) {
                            imagePreviewContainer.innerHTML = '<h3>>> Uploaded File</h3>';
                            imagePreviewContainer.appendChild(scanlineContainer);
                        }
                    } else {
                        // Fallback
                        imagePreviewContainer.innerHTML = '<h3>>> Uploaded File</h3>';
                        imagePreviewContainer.appendChild(imagePreview);
                    }
                    // Set up onload/onerror for the initial image
                    imagePreview.onload = () => {
                        displayFileInfo(firstFileData, imagePreview); 
                        imagePreview.onload = null; 
                    };
                    imagePreview.onerror = () => {
                         console.error("error loading base64 image data for initial file:", currentSelectedFileInZip);
                         imagePreviewContainer.innerHTML = '<h3>>> Uploaded File</h3><p style="color:var(--error-color);">Preview unavailable</p>';
                         displayFileInfo(firstFileData); 
                         imagePreview.onerror = null;
                    }
                    // Manually trigger if already complete
                    if (imagePreview.complete) {
                       displayFileInfo(firstFileData, imagePreview);
                    }
                } else {
                    // If the first file has no image data, show placeholder
                    imagePreviewContainer.innerHTML = 
                    `<h3>>> Uploaded File</h3>
                     <div class="zip-placeholder" style="font-size: 5em; text-align: center; margin: auto; color: var(--primary-text);">
                         <i class="fas fa-file"></i> <p style="font-size: 0.3em;">No preview</p>
                     </div>`;
                    imagePreview.style.display = 'none';
                    if (scanlineContainer) scanlineContainer.style.display = 'none';
                    displayFileInfo(firstFileData); // Display basic info even without preview
                }
                // --- end added section ---

                displaySingleResult(firstFileData, currentSelectedFileInZip, true); // Initial load for results tabs
            } else {
                console.error("Could not find data for initial file:", currentSelectedFileInZip);
                 // Handle error: display a general message or the first available result
            }

        } else {
            // Single image result
            displaySingleResult(results, null, true); // Initial load
        }
    }

    function handleZipSelectionChange(event) {
        const selectedFilename = event.target.value;
        // Find the object in the array that contains the selected filename as a key
        const fileObject = currentZipResults.find(fileObj => Object.keys(fileObj)[0] === selectedFilename);

        if (fileObject) {
            currentSelectedFileInZip = selectedFilename;
            const fileData = fileObject[selectedFilename];

            // update image preview if data exists
            if (fileData.image_data && fileData.mime_type) {
                imagePreview.src = `data:${fileData.mime_type};base64,${fileData.image_data}`; // correct template literal
                imagePreview.style.display = 'block';
                // ensure the container is set up correctly if it was previously showing the zip icon
                if(scanlineContainer) {
                    scanlineContainer.innerHTML = ''; // clear first
                    scanlineContainer.appendChild(imagePreview);
                    // add scan line div if it doesn't exist
                    let scanLineDiv = scanlineContainer.querySelector('.scan-line');
                    if (!scanLineDiv) {
                        scanLineDiv = document.createElement('div');
                        scanLineDiv.className = 'scan-line';
                        scanLineDiv.style.display = 'none'; // start hidden
                        scanlineContainer.appendChild(scanLineDiv);
                    }
                    scanlineContainer.style.display = 'inline-block'; // show container
                    // make sure scanline container is in the main preview container
                    if (!imagePreviewContainer.contains(scanlineContainer)) {
                        imagePreviewContainer.innerHTML = '<h3>>> Uploaded File</h3>'; // clear container
                        imagePreviewContainer.appendChild(scanlineContainer);
                    }
                } else {
                    // fallback: clear preview container and add image
                    imagePreviewContainer.innerHTML = '<h3>>> Uploaded File</h3>';
                    imagePreviewContainer.appendChild(imagePreview);
                }
                
                // Trigger onload manually if needed for size calculations after setting src
                imagePreview.onload = () => {
                    displayFileInfo(fileData, imagePreview); // Update info with dimensions
                    imagePreview.onload = null; // Clean up listener
                };
                // Handle potential errors loading the base64 data
                imagePreview.onerror = () => {
                     console.error("error loading base64 image data for:", selectedFilename);
                     imagePreviewContainer.innerHTML = '<h3>>> Uploaded File</h3><p style="color:var(--error-color);">Preview unavailable</p>';
                     displayFileInfo(fileData); // Display basic info
                     imagePreview.onerror = null;
                }
                // If the image is already cached, onload might not fire, manually call displayFileInfo
                if (imagePreview.complete) {
                   displayFileInfo(fileData, imagePreview);
                }

            } else {
                // if no image data, show placeholder (e.g., non-image file in zip)
                imagePreviewContainer.innerHTML = 
                `<h3>>> Uploaded File</h3>
                 <div class="zip-placeholder" style="font-size: 5em; text-align: center; margin: auto; color: var(--primary-text);">
                     <i class="fas fa-file"></i> <p style="font-size: 0.3em;">No preview</p>
                 </div>`;
                imagePreview.style.display = 'none';
                if (scanlineContainer) scanlineContainer.style.display = 'none';
                displayFileInfo(fileData); // show basic file info
            }

            // display analysis results for the selected file
            displaySingleResult(fileData, selectedFilename, false); // not initial load
        } else {
            console.error("Could not find results for selected file:", selectedFilename);
             // optionally display an error message to the user
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

        // Update LSB Visualization display & Setup Magnifier
        if (lsbPicContainer && lsbPicImg && magnifierLens && magnifierResult) {
            const lsbBase64 = resultData?.lsbpic;
            
            if (lsbBase64) {
                lsbPicImg.src = `data:image/png;base64,${lsbBase64}`;
                
                // Wait for image to load before setting up magnifier
                lsbPicImg.onload = () => {
                    lsbPicContainer.style.display = 'flex'; // Show container AFTER image loads
                    setupMagnifier(lsbPicImg, lsbPicContainer, magnifierLens, magnifierResult, 5); // Setup with zoom factor 5
                    lsbPicImg.onload = null; // Remove listener
                }
                 lsbPicImg.onerror = () => { // Handle load error
                     console.error("Failed to load LSB visualization image.");
                     lsbPicContainer.style.display = 'none'; 
                     lsbPicImg.onerror = null;
                 }
                 // If already loaded (e.g., cached), setup immediately
                 if (lsbPicImg.complete && lsbPicImg.naturalWidth > 0) {
                     lsbPicContainer.style.display = 'flex';
                     setupMagnifier(lsbPicImg, lsbPicContainer, magnifierLens, magnifierResult, 5);
                 }

            } else {
                lsbPicImg.src = '#'; // Clear source if no image data
                lsbPicContainer.style.display = 'none'; // Hide container
                magnifierLens.style.display = 'none'; // Hide lens
                magnifierResult.style.display = 'none'; // Hide result area
            }
        }

        // Clear existing tab content before populating
        tabContents.forEach(content => content.innerHTML = '');

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
        `;
    }

    function populateChiTab(chi) {
        const confidence = getConfidence(chi);
        const tab = document.getElementById('tab-chi');
        if (!tab) return; // Guard against missing element
        tab.innerHTML = '';
        tab.innerHTML = 
            `<div class="method-card">
                 <h4 class="${chi.detected ? 'detected' : 'not-detected'}">
                    <i class="fas ${chi.detected ? 'fa-eye' : 'fa-check-circle'}"></i>
                    ${escapeHtml(chi.detected ? 'Chi-Square Anomalies Detected' : 'Chi-Square Appears Normal')}
                 </h4>
                <p><strong>Confidence Score:</strong> ${escapeHtml((confidence * 100).toFixed(1))}%</p>
                <p><strong>Log:</strong> ${chi.details ? escapeHtml(chi.details) : 'No details provided.'}</p>
            </div>
        `;
    }

    function populateExtractTab(extraction) {
        const confidence = getConfidence(extraction);
        const tab = document.getElementById('tab-extract');
        if (!tab) return; // Guard against missing element
        tab.innerHTML = ''; // Clear previous content

        if (extraction.detected) {
            // Create the main card
            const card = document.createElement('div');
            card.className = 'method-card';

            const sampleText = extraction.sample_text ? escapeHtml(extraction.sample_text) : 'No text sample.';
            const sampleHex = extraction.sample_hex ? escapeHtml(extraction.sample_hex) : 'No hex sample.';

            // Build inner HTML with tabs
            card.innerHTML = 
                `<h4 class="detected">
                         <i class="fas fa-file-alt"></i> Hidden Data Extracted
                     </h4>
                 <p><strong>Confidence Score:</strong> ${escapeHtml((confidence * 100).toFixed(1))}%</p>
                 <p><strong>Log:</strong> ${extraction.details ? escapeHtml(extraction.details) : 'Extraction successful.'}</p>
                 
                 <!-- Inner Tab Navigation for Sample -->
                 <div class="sample-tabs" style="margin-top: 1rem; margin-bottom: 0.5rem;">
                     <button class="sample-tab-button active" data-tab="text">Text View</button>
                     <button class="sample-tab-button" data-tab="hex">Hex View</button>
                 </div>

                 <!-- Inner Tab Content -->
                 <div class="sample-tab-content sample-text-content active">
                      <div class="extracted-sample-container">
                         <pre><code class="extracted-data-text">${sampleText}</code></pre>
                         ${extraction.sample_text ? '<button class="copy-button text-copy-button" title="Copy Text"><i class="far fa-copy"></i> Copy Text</button>' : ''} 
                      </div>
                 </div>
                 
                 <div class="sample-tab-content sample-hex-content">
                     <div class="extracted-sample-container">
                         <pre><code class="extracted-data-hex">${sampleHex}</code></pre>
                         ${extraction.sample_hex ? '<button class="copy-button hex-copy-button" title="Copy Hex"><i class="far fa-copy"></i> Copy Hex</button>' : ''} 
                      </div>
                </div>
             `;

            tab.appendChild(card);

            // Add event listeners for inner tabs within this card
            const sampleTabButtons = card.querySelectorAll('.sample-tab-button');
            const sampleTabContents = card.querySelectorAll('.sample-tab-content');

            sampleTabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const targetInnerTab = button.dataset.tab;

                    // Deactivate all inner tabs/content within this card
                    sampleTabButtons.forEach(btn => btn.classList.remove('active'));
                    sampleTabContents.forEach(content => content.classList.remove('active'));

                    // Activate the clicked inner tab/content
                    button.classList.add('active');
                    card.querySelector(`.sample-${targetInnerTab}-content`).classList.add('active');
                });
            });

            // Add event listener for the TEXT copy button
            const textCopyButton = card.querySelector('.text-copy-button');
            if (textCopyButton) {
                textCopyButton.addEventListener('click', () => {
                    const codeElement = card.querySelector('code.extracted-data-text');
                    handleCopyClick(textCopyButton, codeElement);
                });
            }
            
            // Add event listener for the HEX copy button
            const hexCopyButton = card.querySelector('.hex-copy-button');
             if (hexCopyButton) {
                 hexCopyButton.addEventListener('click', () => {
                     const codeElement = card.querySelector('code.extracted-data-hex');
                     handleCopyClick(hexCopyButton, codeElement);
                 });
             }

        } else {
            // Display message when no data is detected/extracted
            tab.innerHTML = 
                 `<div class="method-card">
                     <h4 class="not-detected">
                         <i class="fas fa-times-circle"></i> No Hidden Data Extracted
                     </h4>
                    <p><strong>Confidence Score:</strong> ${escapeHtml((confidence * 100).toFixed(1))}%</p>
                    <p><strong>Log:</strong> ${extraction.details ? escapeHtml(extraction.details) : 'No structured data identified.'}</p>
                 </div>
            `;
        }
    }

    // --- Helper function for Copy Button Logic ---
    function handleCopyClick(button, codeElement) {
        const textToCopy = codeElement ? codeElement.textContent : '';
        const originalHtml = button.innerHTML; // Store original button content
        
        if (textToCopy && navigator.clipboard) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                // Success feedback
                button.innerHTML = '<i class="fas fa-check"></i> Copied!';
                button.disabled = true;
                setTimeout(() => {
                    button.innerHTML = originalHtml;
                    button.disabled = false;
                }, 2000); // Reset after 2 seconds
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                // Error feedback
                button.innerHTML = '<i class="fas fa-times"></i> Failed';
                setTimeout(() => {
                    button.innerHTML = originalHtml;
                }, 2000);
            });
        } else if (!navigator.clipboard) {
            console.warn('Clipboard API not available.');
            // Fallback or message
            button.textContent = 'Cannot copy';
            button.disabled = true;
             setTimeout(() => {
                 button.innerHTML = originalHtml;
                 button.disabled = false; // Re-enable maybe?
             }, 2000);
        }
    }

    function populateHistTab(histogram) {
        const confidence = getConfidence(histogram);
        const tab = document.getElementById('tab-hist');
        if (!tab) return; // Guard against missing element
        tab.innerHTML = '';
        tab.innerHTML = 
            `<div class="method-card">
                <h4 class="${histogram.detected ? 'detected' : 'not-detected'}">
                    <i class="fas ${histogram.detected ? 'fa-eye' : 'fa-check-circle'}"></i>
                    ${escapeHtml(histogram.detected ? 'Histogram Anomalies Detected' : 'Histogram Appears Normal')}
                 </h4>
                <p><strong>Confidence Score:</strong> ${escapeHtml((confidence * 100).toFixed(1))}%</p>
                <p><strong>Log:</strong> ${histogram.details ? escapeHtml(histogram.details) : 'No details provided.'}</p>
            </div>
        `;
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

    // --- Magnifier Logic ---
    function setupMagnifier(img, container, lens, result, zoom) {
        let w = lens.offsetWidth / 2;
        let h = lens.offsetHeight / 2;
        
        // Restore direct cursor style on image
        img.style.cursor = 'crosshair';
        result.style.display = 'none'; // Start hidden

        // Set background properties for result display
        result.style.backgroundImage = "url('" + img.src + "')";
        result.style.backgroundSize = (img.width * zoom) + "px " + (img.height * zoom) + "px";

        // Function to calculate cursor position and move lens/background
        function moveMagnifier(e) {
            e.preventDefault();
            let pos = getCursorPos(e);
            let x = pos.x;
            let y = pos.y;

            // Calculate image offset relative to the container (its offsetParent)
            let imgOffsetX = img.offsetLeft;
            let imgOffsetY = img.offsetTop;


            // Position the lens: add the image's offset to the cursor-relative position
            lens.style.left = (imgOffsetX + x - w) + "px";
            lens.style.top = (imgOffsetY + y - h) + "px";

            // Position the background image in the result div (this logic remains the same)
            result.style.backgroundPosition = "-" + ((x * zoom) - result.offsetWidth / 2) + "px -" + ((y * zoom) - result.offsetHeight / 2) + "px";
            
             // Show lens and result
            result.style.display = 'block';
        }

        // Function to get cursor position relative to the image
        function getCursorPos(e) {
            let a = img.getBoundingClientRect();
            let x = e.pageX - a.left - window.pageXOffset;
            let y = e.pageY - a.top - window.pageYOffset;
            return { x: x, y: y };
        }

        // Event listeners for mouse interaction
        img.addEventListener("mousemove", moveMagnifier);
        img.addEventListener("mouseenter", () => {
            // No need to manage custom crosshair visibility
            // Lens and result are shown within moveMagnifier
        });
        img.addEventListener("mouseleave", () => {
            // No need to manage custom crosshair visibility
            result.style.display = 'none';
            lens.style.display = 'none';
        });
         // Also hide if mouse leaves the container entirely
        container.addEventListener("mouseleave", () => {
            // No need to manage custom crosshair visibility
            result.style.display = 'none';
            lens.style.display = 'none';
        });
    }

}); // End DOMContentLoaded