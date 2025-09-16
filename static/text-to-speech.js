// text-to-speech.js - Handles text-to-speech functionality using Play.ht API

// Global variables for text-to-speech
let audioPlayer = null;
let isSpeaking = false;
let speakQueue = [];
let activeSpeakButton = null;
let currentModalId = null;
let modals = [];

// API configuration for Play.ht API
const apiKey = 'ak-f1b8973f03ee4e11a0b38f85120ca01c'; // Play.ht API key
const apiUrl = 'https://api.play.ht/api/v2/tts';

// Make textToSpeech function globally accessible
window.textToSpeech = async function(text) {
    // Use browser's built-in speech synthesis as a fallback
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9; // Slightly slower for better comprehension

        // Stop any current speech
        window.speechSynthesis.cancel();

        // Start speaking
        window.speechSynthesis.speak(utterance);

        return true;
    }
    return false;
};

document.addEventListener('DOMContentLoaded', function() {

    // Initialize audio player
    function initAudioPlayer() {
        if (!audioPlayer) {
            audioPlayer = new Audio();
            audioPlayer.onended = function() {
                isSpeaking = false;
                // Reset active button if exists
                if (activeSpeakButton) {
                    activeSpeakButton.innerHTML = '<i class="fas fa-volume-up"></i> Read Aloud';
                    activeSpeakButton.classList.remove('speaking');
                    activeSpeakButton = null;
                }
                processQueue(); // Process next item in queue when current audio ends
            };
            audioPlayer.onerror = function() {
                isSpeaking = false;
                showToast('Error playing audio. Please try again.', 'error');
                if (activeSpeakButton) {
                    activeSpeakButton.innerHTML = '<i class="fas fa-volume-up"></i> Read Aloud';
                    activeSpeakButton.classList.remove('speaking');
                    activeSpeakButton = null;
                }
            };
            document.body.appendChild(audioPlayer);

            // Add global stop button to the page
            addGlobalStopButton();
        }
    }

    // Add a global sound controller button for text-to-speech
    function addGlobalStopButton() {
        // Create sound controller button container
        const stopButtonContainer = document.createElement('div');
        stopButtonContainer.id = 'tts-stop-container';
        stopButtonContainer.style.position = 'fixed';
        stopButtonContainer.style.bottom = '20px';
        stopButtonContainer.style.right = '20px';
        stopButtonContainer.style.zIndex = '9999';
        stopButtonContainer.style.display = 'none'; // Hidden by default

        // Create sound controller button
        const stopButton = document.createElement('button');
        stopButton.id = 'tts-stop-button';
        stopButton.className = 'btn btn-primary';
        stopButton.innerHTML = '<i class="fas fa-volume-up"></i>';
        stopButton.setAttribute('aria-label', 'Sound controller');
        stopButton.setAttribute('title', 'Toggle sound on/off');
        stopButton.style.borderRadius = '50%';
        stopButton.style.width = '60px';
        stopButton.style.height = '60px';
        stopButton.style.padding = '10px';
        stopButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        stopButton.style.display = 'flex';
        stopButton.style.alignItems = 'center';
        stopButton.style.justifyContent = 'center';
        stopButton.style.fontSize = '1.5rem';

        // Add click event to sound controller button
        stopButton.addEventListener('click', function() {
            if (isSpeaking) {
                stopSpeaking();
                this.innerHTML = '<i class="fas fa-volume-up"></i>';
                this.className = 'btn btn-primary';
                showToast('Audio paused', 'info');
            } else {
                // Try to restart speech if we have content
                if (currentModalId) {
                    const modal = document.getElementById(currentModalId);
                    if (modal) {
                        const modalConfig = modals.find(m => m.id === currentModalId);
                        if (modalConfig) {
                            const content = modalConfig.getContent(modal);
                            if (content) {
                                this.innerHTML = '<i class="fas fa-pause"></i>';
                                this.className = 'btn btn-danger';
                                speakText(content);
                                showToast('Audio resumed', 'success');
                            }
                        }
                    }
                }
            }
        });

        // Add button to container and container to body
        stopButtonContainer.appendChild(stopButton);
        document.body.appendChild(stopButtonContainer);
    }

    // Function to stop speaking
    function stopSpeaking() {
        if (audioPlayer && isSpeaking) {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
            isSpeaking = false;

            // Reset active button if exists
            if (activeSpeakButton) {
                activeSpeakButton.innerHTML = '<i class="fas fa-volume-up"></i> Read Aloud';
                activeSpeakButton.classList.remove('speaking');
                activeSpeakButton = null;
            }

            // Update sound controller button
            const stopButton = document.getElementById('tts-stop-button');
            if (stopButton) {
                stopButton.innerHTML = '<i class="fas fa-volume-up"></i>';
                stopButton.className = 'btn btn-primary';
            }

            // Keep the currentModalId so we can restart if needed
            speakQueue = []; // Clear the queue

            showToast('Text-to-speech stopped', 'info');
        }
    }

    // Process the next item in the speech queue
    function processQueue() {
        if (speakQueue.length > 0 && !isSpeaking) {
            const nextItem = speakQueue.shift();
            speakText(nextItem.text, nextItem.button);
        }
    }

    // Add text to the speech queue
    function addToSpeechQueue(text, button = null) {
        if (!text || text.trim() === '') return;

        speakQueue.push({ text, button });
        processQueue();
    }

    // Speak the text immediately
    async function speakText(text, button = null) {
        if (!text || text.trim() === '') return;
        if (isSpeaking) {
            // If already speaking, stop current speech and start new one
            stopSpeaking();
        }

        isSpeaking = true;
        activeSpeakButton = button;

        // Update button state if provided
        if (button) {
            button.innerHTML = '<i class="fas fa-pause"></i> Speaking...';
            button.classList.add('speaking');
        }

        // Show the sound controller button
        const stopButtonContainer = document.getElementById('tts-stop-container');
        if (stopButtonContainer) {
            stopButtonContainer.style.display = 'block';

            // Update button appearance
            const stopButton = document.getElementById('tts-stop-button');
            if (stopButton) {
                stopButton.innerHTML = '<i class="fas fa-pause"></i>';
                stopButton.className = 'btn btn-danger';
            }

            // Add animation to make it noticeable
            stopButtonContainer.style.animation = 'fadeIn 0.3s ease-in-out';
        }

        // Use a small delay to ensure the UI updates before starting speech
        setTimeout(async () => {
            await textToSpeech(text);
        }, 100);
    }

    // Function to convert text to speech using Play.ht API
    async function textToSpeech(text) {
        if (!text || text.trim() === '') {
            isSpeaking = false;
            return;
        }

        // Show loading indicator
        const loadingToast = showToast('Converting text to speech...', 'info');

        try {
            // First, try using the browser's built-in speech synthesis
            if ('speechSynthesis' in window) {
                // Stop any current speech
                window.speechSynthesis.cancel();

                // Create a new utterance
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'en-US';
                utterance.rate = 0.9; // Slightly slower for better comprehension
                utterance.volume = 1.0;

                // When speech ends
                utterance.onend = function() {
                    isSpeaking = false;
                    hideToast(loadingToast);

                    // Reset active button if exists
                    if (activeSpeakButton) {
                        activeSpeakButton.innerHTML = '<i class="fas fa-volume-up"></i> Read Aloud';
                        activeSpeakButton.classList.remove('speaking');
                        activeSpeakButton = null;
                    }

                    processQueue(); // Process next item in queue
                };

                // When there's an error
                utterance.onerror = function(event) {
                    console.error('Speech synthesis error:', event);
                    isSpeaking = false;
                    hideToast(loadingToast);
                    showToast('Error playing audio. Trying alternative method...', 'error');

                    // Try Play.ht API as fallback
                    usePlayHtApi();
                };

                // Start speaking
                window.speechSynthesis.speak(utterance);
                hideToast(loadingToast);
                showToast('Playing audio...', 'success');
            } else {
                // If speech synthesis is not available, use Play.ht API
                usePlayHtApi();
            }
        } catch (error) {
            console.error('Text-to-speech error:', error);
            hideToast(loadingToast);
            showToast('Failed to convert text to speech. Please try again.', 'error');

            // Reset button state if there was an error
            if (activeSpeakButton) {
                activeSpeakButton.innerHTML = '<i class="fas fa-volume-up"></i> Read Aloud';
                activeSpeakButton.classList.remove('speaking');
                activeSpeakButton = null;
            }

            isSpeaking = false;
            processQueue(); // Try to process next item in queue
        }

        // Function to use Play.ht API as fallback
        async function usePlayHtApi() {
            try {
                // Prepare the request for Play.ht API
                const requestBody = {
                    text: text,
                    voice: 'en-US-JennyNeural', // Professional female voice for medical content
                    quality: 'medium',
                    output_format: 'mp3',
                    speed: 0.95, // Slightly slower for medical content
                    sample_rate: 24000
                };

                // Make the API request to Play.ht API
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                        'X-User-ID': 'user-id', // Optional, can be any string
                        'Accept': 'audio/mpeg'
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    isSpeaking = false;
                    throw new Error(`API Error: ${response.status}`);
                }

                // For Play.ht API, we get the audio data directly
                const audioBlob = await response.blob();

                if (audioBlob) {
                    // Hide loading indicator
                    hideToast(loadingToast);

                    // Convert blob to base64 for our player
                    const reader = new FileReader();
                    reader.readAsDataURL(audioBlob);
                    reader.onloadend = function() {
                        const base64data = reader.result.split(',')[1];
                        // Play the audio
                        playAudio(base64data);
                        showToast('Playing audio...', 'success');
                    };
                } else {
                    isSpeaking = false;
                    throw new Error('No audio data received');
                }
            } catch (error) {
                console.error('Play.ht API error:', error);
                hideToast(loadingToast);
                showToast('Failed to convert text to speech. Please try again.', 'error');

                // Reset button state if there was an error
                if (activeSpeakButton) {
                    activeSpeakButton.innerHTML = '<i class="fas fa-volume-up"></i> Read Aloud';
                    activeSpeakButton.classList.remove('speaking');
                    activeSpeakButton = null;
                }

                isSpeaking = false;
                processQueue(); // Try to process next item in queue
            }
        }
    }

    // Function to play audio from base64 string
    function playAudio(base64Audio) {
        initAudioPlayer();

        // Stop any currently playing audio
        if (audioPlayer) {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
        }

        // Convert base64 to audio source
        const audioSrc = `data:audio/mp3;base64,${base64Audio}`;
        audioPlayer.src = audioSrc;

        // Play the audio
        const playPromise = audioPlayer.play();

        // Show feedback option after a delay
        if (playPromise !== undefined) {
            playPromise.then(_ => {
                // Show feedback option after 5 seconds of playback
                setTimeout(() => {
                    if (isSpeaking) {
                        showFeedbackOption();
                    }
                }, 5000);
            }).catch(error => {
                console.error('Audio playback failed:', error);
            });
        }
    }

    // Show feedback option for text-to-speech quality
    function showFeedbackOption() {
        // Check if feedback has already been shown recently
        const lastFeedbackTime = localStorage.getItem('lastTtsFeedbackTime');
        const now = Date.now();

        // Only show feedback option once per session or once per day
        if (lastFeedbackTime && (now - parseInt(lastFeedbackTime) < 86400000)) {
            return;
        }

        // Create feedback container
        const feedbackContainer = document.createElement('div');
        feedbackContainer.id = 'tts-feedback-container';
        feedbackContainer.style.position = 'fixed';
        feedbackContainer.style.bottom = '80px';
        feedbackContainer.style.right = '20px';
        feedbackContainer.style.zIndex = '9998';
        feedbackContainer.style.backgroundColor = 'white';
        feedbackContainer.style.padding = '15px';
        feedbackContainer.style.borderRadius = '8px';
        feedbackContainer.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        feedbackContainer.style.maxWidth = '300px';
        feedbackContainer.style.animation = 'fadeIn 0.5s ease-in-out';

        // Add feedback content
        feedbackContainer.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="m-0">How's the voice quality?</h6>
                <button type="button" class="btn-close" aria-label="Close"></button>
            </div>
            <div class="d-flex justify-content-between">
                <button class="btn btn-sm btn-outline-danger me-1 feedback-btn" data-rating="poor">Poor</button>
                <button class="btn btn-sm btn-outline-warning me-1 feedback-btn" data-rating="okay">Okay</button>
                <button class="btn btn-sm btn-outline-success feedback-btn" data-rating="good">Good</button>
            </div>
        `;

        // Add to document
        document.body.appendChild(feedbackContainer);

        // Add event listeners
        const closeButton = feedbackContainer.querySelector('.btn-close');
        closeButton.addEventListener('click', function() {
            feedbackContainer.remove();
        });

        // Add event listeners to feedback buttons
        const feedbackButtons = feedbackContainer.querySelectorAll('.feedback-btn');
        feedbackButtons.forEach(button => {
            button.addEventListener('click', function() {
                const rating = this.getAttribute('data-rating');

                // Save feedback to localStorage
                localStorage.setItem('ttsFeedback', rating);
                localStorage.setItem('lastTtsFeedbackTime', Date.now().toString());

                // Show thank you message
                feedbackContainer.innerHTML = `
                    <div class="text-center">
                        <p>Thank you for your feedback!</p>
                    </div>
                `;

                // Remove after 2 seconds
                setTimeout(() => {
                    feedbackContainer.remove();
                }, 2000);
            });
        });

        // Auto-remove after 15 seconds if no interaction
        setTimeout(() => {
            if (document.getElementById('tts-feedback-container')) {
                feedbackContainer.remove();
            }
        }, 15000);
    }

    // Toast notification functions
    function showToast(message, type = 'info') {
        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.style.position = 'fixed';
            toastContainer.style.bottom = '20px';
            toastContainer.style.right = '20px';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.minWidth = '250px';
        toast.style.margin = '10px';
        toast.style.padding = '15px';
        toast.style.borderRadius = '4px';
        toast.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        toast.style.backgroundColor = type === 'error' ? '#f44336' :
                                     type === 'success' ? '#4CAF50' :
                                     '#2196F3';
        toast.style.color = 'white';
        toast.style.transition = 'opacity 0.3s ease';

        toast.textContent = message;
        toastContainer.appendChild(toast);

        // Auto-hide after 5 seconds unless it's a loading toast
        if (type !== 'info') {
            setTimeout(() => {
                hideToast(toast);
            }, 5000);
        }

        return toast;
    }

    function hideToast(toast) {
        if (toast && toast.parentNode) {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }

    // This function is no longer needed since we're using automatic playback
    function addSpeechButtonsToModals() {
        // Function disabled - we're using automatic playback instead
        return;
    }

    // Add click event listeners to all result category buttons
    function setupTextToSpeechButtons() {
        // Only setup if we have prediction results
        if (!document.getElementById('diseaseModal')) return;

        // Define all modals and their content extraction methods
        modals = [
            {
                id: 'diseaseModal',
                title: 'Disease',
                getContent: (modal) => {
                    const content = modal.querySelector('.modal-body p')?.textContent || '';
                    return content ? `Disease: ${content}` : '';
                }
            },
            {
                id: 'descriptionModal',
                title: 'Description',
                getContent: (modal) => {
                    const content = modal.querySelector('.modal-body p')?.textContent || '';
                    return content ? `Description: ${content}` : '';
                }
            },
            {
                id: 'precautionModal',
                title: 'Precautions',
                getContent: (modal) => {
                    const items = modal.querySelectorAll('.modal-body li');
                    if (items.length === 0) return '';
                    return `Precautions: ${Array.from(items).map((item, i) => `${i+1}. ${item.textContent}`).join('. ')}`;
                }
            },
            {
                id: 'medicationsModal',
                title: 'Medications',
                getContent: (modal) => {
                    const items = modal.querySelectorAll('.modal-body li');
                    if (items.length === 0) return '';
                    return `Recommended medications: ${Array.from(items).map((item, i) => `${i+1}. ${item.textContent}`).join('. ')}`;
                }
            },
            {
                id: 'workoutsModal',
                title: 'Workouts',
                getContent: (modal) => {
                    const items = modal.querySelectorAll('.modal-body li');
                    if (items.length === 0) return '';
                    return `Recommended workouts: ${Array.from(items).map((item, i) => `${i+1}. ${item.textContent}`).join('. ')}`;
                }
            },
            {
                id: 'dietsModal',
                title: 'Diets',
                getContent: (modal) => {
                    const items = modal.querySelectorAll('.modal-body li');
                    if (items.length === 0) return '';
                    return `Recommended diet: ${Array.from(items).map((item, i) => `${i+1}. ${item.textContent}`).join('. ')}`;
                }
            }
        ];

        // Add event listeners to each modal
        modals.forEach(modalConfig => {
            const modal = document.getElementById(modalConfig.id);
            if (!modal) return;

            // We don't need to add a speak button to the modal anymore since we're using automatic playback
            const modalBody = modal.querySelector('.modal-body');

            // Auto-play when modal is shown (enabled by default)
            modal.addEventListener('shown.bs.modal', function() {
                const content = modalConfig.getContent(modal);
                if (content) {
                    currentModalId = modalConfig.id;
                    // Automatically speak the content when modal is opened
                    speakText(content, null);

                    // Show a toast notification that audio is playing
                    showToast(`Playing audio for ${modalConfig.title}`, 'info');
                }
            });

            // Stop speaking when modal is hidden
            modal.addEventListener('hidden.bs.modal', function() {
                if (isSpeaking && currentModalId === modalConfig.id) {
                    if (audioPlayer) {
                        audioPlayer.pause();
                        audioPlayer.currentTime = 0;
                        isSpeaking = false;

                        if (activeSpeakButton) {
                            activeSpeakButton.innerHTML = '<i class="fas fa-volume-up"></i> Read Aloud';
                            activeSpeakButton.classList.remove('speaking');
                            activeSpeakButton = null;
                        }

                        // Hide the sound controller button
                        const stopButtonContainer = document.getElementById('tts-stop-container');
                        if (stopButtonContainer) {
                            stopButtonContainer.style.display = 'none';
                        }

                        currentModalId = null;
                        processQueue(); // Process next item in queue
                    }
                }
            });
        });
    }

    // Initialize text-to-speech functionality
    initAudioPlayer();

    // Setup text-to-speech buttons if prediction results are available
    if (document.querySelector('.result-container')) {
        setupTextToSpeechButtons();
    } else {
        // If results aren't available yet, set up a mutation observer to detect when they become available
        const observer = new MutationObserver(function(mutations) {
            if (document.querySelector('.result-container')) {
                setupTextToSpeechButtons();
                observer.disconnect(); // Stop observing once we've set up the buttons
            }
        });

        // Start observing the document body for added nodes
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Add Font Awesome for icons if not already present
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const fontAwesomeLink = document.createElement('link');
        fontAwesomeLink.rel = 'stylesheet';
        fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
        document.head.appendChild(fontAwesomeLink);
    }

    // Add CSS for speech buttons and animations
    const style = document.createElement('style');
    style.textContent = `
        .speak-button {
            transition: all 0.2s ease-out;
            background-color: #4a9bd1;
            border-color: #4a9bd1;
        }
        .speak-button:hover {
            transform: scale(1.02);
            background-color: #3a8bc1;
        }
        .speak-button.speaking {
            background-color: #dc3545;
            border-color: #dc3545;
        }
        .modal-body {
            max-height: 70vh;
            overflow-y: auto;
        }
        #toast-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
        }
        .toast {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .toast.visible {
            opacity: 1;
            transform: translateY(0);
        }
        #tts-stop-button {
            transition: all 0.2s ease-out;
        }
        #tts-stop-button:hover {
            transform: scale(1.05);
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .keyboard-shortcut {
            display: inline-block;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 3px;
            padding: 2px 5px;
            font-size: 0.8em;
            margin-left: 5px;
        }
    `;
    document.head.appendChild(style);

    // Add keyboard shortcut to stop speaking (Escape key)
    document.addEventListener('keydown', function(event) {
        // Check if Escape key was pressed
        if (event.key === 'Escape' && isSpeaking) {
            stopSpeaking();
            const stopButtonContainer = document.getElementById('tts-stop-container');
            if (stopButtonContainer) {
                stopButtonContainer.style.display = 'none';
            }

            // Show toast with keyboard shortcut info
            showToast('Text-to-speech stopped (Press Esc to stop anytime)', 'info');
        }
    });
});