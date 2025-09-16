// read-aloud.js - Handles the Read Aloud button functionality

// Make readAloud function globally accessible
window.readAloud = function(text, button) {
    // Log for debugging
    console.log("Global readAloud called with text:", text);

    // Use the browser's built-in speech synthesis directly
    if ('speechSynthesis' in window) {
        // Stop any current speech
        window.speechSynthesis.cancel();

        // Create a new utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9; // Slightly slower for better comprehension
        utterance.volume = speechVolume; // Use the global volume setting

        console.log(`Speaking with volume: ${utterance.volume}`);

        // Show the stop button
        const stopButton = document.getElementById('stop-speech-button');
        if (stopButton) {
            stopButton.style.display = 'block';
        }

        // Show the volume button
        const volumeButton = document.getElementById('volume-button');
        if (volumeButton) {
            volumeButton.style.display = 'block';
        }

        // When speech ends
        utterance.onend = function() {
            // Hide the stop button
            if (stopButton) {
                stopButton.style.display = 'none';
            }

            // Hide the volume button
            if (volumeButton) {
                volumeButton.style.display = 'none';
            }

            // Hide the volume control
            const volumeControl = document.getElementById('volume-control-container');
            if (volumeControl) {
                volumeControl.classList.remove('visible');
            }

            // Reset button state if provided
            if (button) {
                button.innerHTML = '<i class="fas fa-volume-up"></i> Read Aloud';
                button.classList.remove('speaking');
                button.disabled = false;
            }
        };

        // When speech is canceled
        utterance.oncancel = function() {
            // Hide the stop button
            if (stopButton) {
                stopButton.style.display = 'none';
            }

            // Hide the volume button
            if (volumeButton) {
                volumeButton.style.display = 'none';
            }

            // Hide the volume control
            const volumeControl = document.getElementById('volume-control-container');
            if (volumeControl) {
                volumeControl.classList.remove('visible');
            }

            // Reset button state if provided
            if (button) {
                button.innerHTML = '<i class="fas fa-volume-up"></i> Read Aloud';
                button.classList.remove('speaking');
                button.disabled = false;
            }
        };

        // Start speaking
        window.speechSynthesis.speak(utterance);

        // Update button state if provided
        if (button) {
            button.innerHTML = '<i class="fas fa-volume-up"></i> Speaking...';
            button.classList.add('speaking');
        }

        return true;
    }

    // Fallback to the internal function
    return readAloud(text, button);
};

// Make stopSpeech function globally accessible
window.stopSpeech = function() {
    stopSpeech();
};

// Global variable for speech volume
let speechVolume = 1.0; // Maximum volume by default

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the Read Aloud buttons
    initializeReadAloudButtons();

    // Create the stop button
    createStopButton();

    // Create the volume control
    createVolumeControl();

    // Add keyboard shortcut to stop speech (Escape key)
    setupKeyboardShortcuts();
});

// Initialize Read Aloud buttons
function initializeReadAloudButtons() {
    // Get all Read Aloud buttons
    const readAloudButtons = document.querySelectorAll('.read-aloud-btn');

    // Add click event listener to each button
    readAloudButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Get the content to read
            const content = this.getAttribute('data-content');

            // If content exists, read it aloud
            if (content) {
                // Show loading state
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
                this.disabled = true;

                // Call the text-to-speech function
                readAloud(content, this);
            }
        });
    });
}

// Read text aloud
function readAloud(text, button) {
    // Create an audio element if it doesn't exist
    let audioElement = document.getElementById('text-to-speech-audio');
    if (!audioElement) {
        audioElement = document.createElement('audio');
        audioElement.id = 'text-to-speech-audio';
        audioElement.controls = false;
        document.body.appendChild(audioElement);
    }

    // Use the browser's built-in speech synthesis as a fallback
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9; // Slightly slower for better comprehension

        // When speech starts
        utterance.onstart = function() {
            if (button) {
                button.innerHTML = '<i class="fas fa-volume-up"></i> Speaking...';
                button.classList.add('speaking');
            }

            // Show the stop button
            showStopButton();
        };

        // When speech ends
        utterance.onend = function() {
            if (button) {
                button.innerHTML = '<i class="fas fa-volume-up"></i> Read Aloud';
                button.classList.remove('speaking');
                button.disabled = false;
            }

            // Hide the stop button
            hideStopButton();
        };

        // If there's an error
        utterance.onerror = function() {
            if (button) {
                button.innerHTML = '<i class="fas fa-volume-up"></i> Read Aloud';
                button.disabled = false;
            }
            console.error('Speech synthesis error');

            // Hide the stop button
            hideStopButton();
        };

        // Stop any current speech
        window.speechSynthesis.cancel();

        // Start speaking
        window.speechSynthesis.speak(utterance);

        // Show the stop button immediately (don't wait for onstart)
        showStopButton();
    } else {
        // Fallback message if speech synthesis is not supported
        alert('Text-to-speech is not supported in your browser. Please try using Chrome, Safari, or Edge.');
        if (button) {
            button.innerHTML = '<i class="fas fa-volume-up"></i> Read Aloud';
            button.disabled = false;
        }
    }
}

// Create a global stop button
function createStopButton() {
    // Create stop button if it doesn't exist
    let stopButton = document.getElementById('stop-speech-button');
    if (!stopButton) {
        stopButton = document.createElement('button');
        stopButton.id = 'stop-speech-button';
        stopButton.className = 'btn btn-danger position-fixed';
        stopButton.style.bottom = '20px';
        stopButton.style.right = '20px';
        stopButton.style.zIndex = '9999';
        stopButton.style.display = 'none';
        stopButton.style.borderRadius = '50%';
        stopButton.style.width = '60px';
        stopButton.style.height = '60px';
        stopButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
        stopButton.innerHTML = '<i class="fas fa-stop-circle fa-2x"></i>';
        stopButton.setAttribute('title', 'Stop Reading (Press Esc)');
        stopButton.setAttribute('aria-label', 'Stop Reading');

        // Add click event to stop speech
        stopButton.addEventListener('click', function() {
            stopSpeech();
        });

        document.body.appendChild(stopButton);
    }
}

// Show the stop button
function showStopButton() {
    const stopButton = document.getElementById('stop-speech-button');
    if (stopButton) {
        stopButton.style.display = 'block';

        // Add animation
        stopButton.style.animation = 'fadeIn 0.3s ease-in-out';
    }
}

// Hide the stop button
function hideStopButton() {
    const stopButton = document.getElementById('stop-speech-button');
    if (stopButton) {
        stopButton.style.display = 'none';
    }
}

// Stop all speech
function stopSpeech() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();

        // Hide stop button
        hideStopButton();

        // Reset all read aloud buttons
        document.querySelectorAll('.read-aloud-btn.speaking').forEach(button => {
            button.innerHTML = '<i class="fas fa-volume-up"></i> Read Aloud';
            button.classList.remove('speaking');
            button.disabled = false;
        });
    }
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            stopSpeech();
        }
    });
}

// Create volume control
function createVolumeControl() {
    // Create volume control container if it doesn't exist
    let volumeControl = document.getElementById('volume-control-container');
    if (!volumeControl) {
        volumeControl = document.createElement('div');
        volumeControl.id = 'volume-control-container';

        // Add volume control content
        volumeControl.innerHTML = `
            <h6 class="mb-2">Volume Control</h6>
            <input type="range" class="form-range" id="volume-slider" min="0" max="1" step="0.1" value="1">
            <div class="volume-label">
                <span>Low</span>
                <span>High</span>
            </div>
            <div class="volume-buttons">
                <button class="btn btn-sm btn-outline-secondary" id="volume-low">Low</button>
                <button class="btn btn-sm btn-outline-secondary" id="volume-medium">Medium</button>
                <button class="btn btn-sm btn-outline-secondary" id="volume-high">High</button>
            </div>
        `;

        document.body.appendChild(volumeControl);

        // Add event listeners
        const volumeSlider = document.getElementById('volume-slider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', function() {
                speechVolume = parseFloat(this.value);
                console.log(`Volume set to: ${speechVolume}`);
            });
        }

        // Add event listeners to buttons
        const lowBtn = document.getElementById('volume-low');
        const mediumBtn = document.getElementById('volume-medium');
        const highBtn = document.getElementById('volume-high');

        if (lowBtn) {
            lowBtn.addEventListener('click', function() {
                speechVolume = 0.3;
                if (volumeSlider) volumeSlider.value = speechVolume;
                console.log(`Volume set to low: ${speechVolume}`);
            });
        }

        if (mediumBtn) {
            mediumBtn.addEventListener('click', function() {
                speechVolume = 0.6;
                if (volumeSlider) volumeSlider.value = speechVolume;
                console.log(`Volume set to medium: ${speechVolume}`);
            });
        }

        if (highBtn) {
            highBtn.addEventListener('click', function() {
                speechVolume = 1.0;
                if (volumeSlider) volumeSlider.value = speechVolume;
                console.log(`Volume set to high: ${speechVolume}`);
            });
        }
    }

    // Add a volume button to the stop button
    const stopButton = document.getElementById('stop-speech-button');
    if (stopButton) {
        // Add a volume button next to the stop button
        let volumeButton = document.getElementById('volume-button');
        if (!volumeButton) {
            volumeButton = document.createElement('button');
            volumeButton.id = 'volume-button';
            volumeButton.className = 'btn btn-info position-fixed';
            volumeButton.style.bottom = '20px';
            volumeButton.style.right = '90px'; // Position next to stop button
            volumeButton.style.zIndex = '9999';
            volumeButton.style.borderRadius = '50%';
            volumeButton.style.width = '60px';
            volumeButton.style.height = '60px';
            volumeButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
            volumeButton.innerHTML = '<i class="fas fa-volume-up fa-2x"></i>';
            volumeButton.setAttribute('title', 'Adjust Volume');
            volumeButton.setAttribute('aria-label', 'Adjust Volume');

            // Add click event to toggle volume control
            volumeButton.addEventListener('click', function() {
                volumeControl.classList.toggle('visible');
            });

            document.body.appendChild(volumeButton);
        }
    }
}
