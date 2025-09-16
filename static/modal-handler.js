// modal-handler.js - Handles modal display and content

document.addEventListener('DOMContentLoaded', function() {
    // Initialize modals
    initializeModals();
});

// Initialize modals
function initializeModals() {
    console.log("Initializing modals");

    // Get all modal toggle buttons
    const modalButtons = document.querySelectorAll('[data-bs-toggle="modal"]');
    console.log(`Found ${modalButtons.length} modal buttons`);

    // Add click event listener to each button
    modalButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Get the target modal ID
            const targetModalId = this.getAttribute('data-bs-target');
            if (!targetModalId) return;

            // Get the modal element
            const modal = document.querySelector(targetModalId);
            if (!modal) {
                console.error(`Modal not found: ${targetModalId}`);
                return;
            }

            // Log for debugging
            console.log(`Button clicked for modal: ${targetModalId}`);

            // Ensure the modal content is visible
            ensureContentIsVisible(modal);

            // Check if the modal has content
            checkModalContent(modal);

            // Force the modal to be shown if it's not already
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (!bsModal) {
                try {
                    new bootstrap.Modal(modal).show();
                } catch (error) {
                    console.error("Error showing modal:", error);
                }
            }
        });
    });

    // Add event listeners for modal shown event
    const modals = document.querySelectorAll('.modal');
    console.log(`Found ${modals.length} modals`);

    modals.forEach(modal => {
        // Remove any existing event listeners
        modal.removeEventListener('shown.bs.modal', handleModalShown);

        // Add the event listener
        modal.addEventListener('shown.bs.modal', handleModalShown);
    });
}

// Handle modal shown event
function handleModalShown() {
    console.log(`Modal shown: ${this.id}`);

    // Ensure the modal content is visible
    ensureContentIsVisible(this);

    // Check if the modal has content
    checkModalContent(this);

    // Automatically read the content aloud after a short delay
    // This delay ensures the modal is fully rendered
    setTimeout(() => {
        // Get the content directly and read it aloud
        const content = extractModalContent(this);
        if (content && content.trim()) {
            console.log("Auto-reading content:", content);

            // Use window.readAloud if available
            if (typeof window.readAloud === 'function') {
                window.readAloud(content);
            } else if ('speechSynthesis' in window) {
                // Fallback to browser's speech synthesis
                const utterance = new SpeechSynthesisUtterance(content);
                utterance.lang = 'en-US';
                utterance.rate = 0.9;
                utterance.volume = 1.0;
                window.speechSynthesis.cancel(); // Cancel any ongoing speech
                window.speechSynthesis.speak(utterance);
            }
        } else {
            console.warn("No content to read in modal:", this.id);
        }
    }, 300);
}

// Extract content from modal for reading
function extractModalContent(modal) {
    // Get the modal title
    const modalTitle = modal.querySelector('.modal-title');
    let titleText = '';
    if (modalTitle) {
        titleText = modalTitle.textContent.trim();
    }

    // Get the modal body content
    const modalBody = modal.querySelector('.modal-body');
    if (!modalBody) return '';

    // Get all text content from the modal body
    let contentText = '';

    // Special handling for disease modal
    if (modal.id === 'diseaseModal') {
        const diseaseText = modalBody.querySelector('p strong');
        if (diseaseText) {
            contentText = `Predicted Disease: ${diseaseText.textContent.trim()}`;
        } else {
            contentText = modalBody.textContent.trim();
        }
    }
    // Special handling for description modal
    else if (modal.id === 'descriptionModal') {
        const descriptionText = modalBody.querySelector('p');
        if (descriptionText) {
            contentText = `Description: ${descriptionText.textContent.trim()}`;
        } else {
            contentText = modalBody.textContent.trim();
        }
    }
    // Check for list items (for precautions, medications, workouts, diets)
    else if (modalBody.querySelectorAll('.list-group-item').length > 0) {
        const listItems = modalBody.querySelectorAll('.list-group-item');
        contentText = `${titleText}: `;
        contentText += Array.from(listItems)
            .map((item, index) => `${index + 1}. ${item.textContent.trim()}`)
            .filter(text => text) // Remove empty items
            .join('. ');
    }
    // For paragraphs or other content
    else {
        const paragraphs = modalBody.querySelectorAll('p');
        if (paragraphs.length > 0) {
            contentText = `${titleText}: `;
            contentText += Array.from(paragraphs)
                .map(p => p.textContent.trim())
                .filter(text => text) // Remove empty paragraphs
                .join('. ');
        } else {
            // Fallback to all text content
            contentText = `${titleText}: ${modalBody.textContent.trim()}`;
        }
    }

    return contentText;
}

// Check if the modal has content
function checkModalContent(modal) {
    console.log(`Checking content for modal: ${modal.id}`);

    // Get the modal body
    const modalBody = modal.querySelector('.modal-body');
    if (!modalBody) {
        console.error("Modal body not found");
        return;
    }

    // Special handling for disease modal
    if (modal.id === 'diseaseModal') {
        const contentDiv = modalBody.querySelector('.p-2');
        if (contentDiv) {
            const paragraphs = contentDiv.querySelectorAll('p');
            if (paragraphs.length === 0 || (paragraphs.length === 1 && paragraphs[0].textContent.includes('No disease prediction'))) {
                // Clear existing content
                contentDiv.innerHTML = '';

                // Add a message
                const noContentMessage = document.createElement('p');
                noContentMessage.innerHTML = '<strong>No disease prediction available.</strong> Please enter your symptoms and click "Predict".';
                contentDiv.appendChild(noContentMessage);
            }
        }
    }
    // Special handling for description modal
    else if (modal.id === 'descriptionModal') {
        const contentDiv = modalBody.querySelector('.p-3');
        if (contentDiv) {
            const paragraphs = contentDiv.querySelectorAll('p');
            if (paragraphs.length === 0 || (paragraphs.length === 1 && paragraphs[0].textContent.includes('No description available'))) {
                // Clear existing content
                contentDiv.innerHTML = '';

                // Add a message
                const noContentMessage = document.createElement('p');
                noContentMessage.textContent = 'No description available. Please enter your symptoms and click "Predict".';
                contentDiv.appendChild(noContentMessage);
            }
        }
    }
    // Check for list content in other modals
    else {
        // Check if there's any content in the lists
        const lists = modalBody.querySelectorAll('.list-group');
        lists.forEach(list => {
            const items = list.querySelectorAll('.list-group-item');
            if (items.length === 0) {
                // If no items, show a message
                list.innerHTML = ''; // Clear any existing content
                const noContentMessage = document.createElement('p');
                noContentMessage.className = 'empty-content-message';
                noContentMessage.textContent = 'No content available. Please enter your symptoms and click "Predict".';
                list.appendChild(noContentMessage);
            }
        });

        // Check if there's any content in paragraphs
        const contentDivs = modalBody.querySelectorAll('.p-2, .p-3');
        contentDivs.forEach(div => {
            const paragraphs = div.querySelectorAll('p');
            if (paragraphs.length === 0) {
                // If no paragraphs, add a message
                div.innerHTML = ''; // Clear any existing content
                const noContentMessage = document.createElement('p');
                noContentMessage.className = 'empty-content-message';
                noContentMessage.textContent = 'No content available. Please enter your symptoms and click "Predict".';
                div.appendChild(noContentMessage);
            }
        });
    }
}

// Function to manually open a modal
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }
}

// Function to manually close a modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) {
            bsModal.hide();
        }
    }
}

// Function to automatically read the content of a modal
function autoReadContent(modal) {
    // Log for debugging
    console.log("autoReadContent called for modal:", modal.id);

    // Get the modal title
    const modalTitle = modal.querySelector('.modal-title');
    let titleText = '';
    if (modalTitle) {
        titleText = modalTitle.textContent.trim();
    }

    // Get the modal body content
    const modalBody = modal.querySelector('.modal-body');
    if (!modalBody) {
        console.error("Modal body not found");
        return;
    }

    // Ensure all content in the modal is visible
    ensureContentIsVisible(modal);

    // Get all text content from the modal body
    let contentText = '';

    // Special handling for disease modal
    if (modal.id === 'diseaseModal') {
        const diseaseText = modalBody.querySelector('p strong');
        if (diseaseText) {
            contentText = `Predicted Disease: ${diseaseText.textContent.trim()}`;
        } else {
            contentText = modalBody.textContent.trim();
        }
    }
    // Special handling for description modal
    else if (modal.id === 'descriptionModal') {
        const descriptionText = modalBody.querySelector('p');
        if (descriptionText) {
            contentText = `Description: ${descriptionText.textContent.trim()}`;
        } else {
            contentText = modalBody.textContent.trim();
        }
    }
    // Check for list items (for precautions, medications, workouts, diets)
    else if (modalBody.querySelectorAll('.list-group-item').length > 0) {
        const listItems = modalBody.querySelectorAll('.list-group-item');
        contentText = `${titleText}: `;
        contentText += Array.from(listItems)
            .map((item, index) => `${index + 1}. ${item.textContent.trim()}`)
            .filter(text => text) // Remove empty items
            .join('. ');
    }
    // For paragraphs or other content
    else {
        const paragraphs = modalBody.querySelectorAll('p');
        if (paragraphs.length > 0) {
            contentText = `${titleText}: `;
            contentText += Array.from(paragraphs)
                .map(p => p.textContent.trim())
                .filter(text => text) // Remove empty paragraphs
                .join('. ');
        } else {
            // Fallback to all text content
            contentText = `${titleText}: ${modalBody.textContent.trim()}`;
        }
    }

    // Only read if there's content
    if (contentText.trim()) {
        console.log(`Reading aloud: ${contentText}`);

        // Find the read aloud button in this modal
        const readAloudBtn = modal.querySelector('.read-aloud-btn');

        // Use our readAloud function from read-aloud.js if available
        if (typeof window.readAloud === 'function') {
            window.readAloud(contentText, readAloudBtn);
        } else if (typeof readAloud === 'function') {
            // If it's not on the window object but is defined in this scope
            readAloud(contentText, readAloudBtn);
        } else if (typeof window.textToSpeech === 'function') {
            // Use our custom TTS function
            window.textToSpeech(contentText);
        } else if ('speechSynthesis' in window) {
            // Use browser's built-in speech synthesis
            const utterance = new SpeechSynthesisUtterance(contentText);
            utterance.lang = 'en-US';
            utterance.rate = 0.9; // Slightly slower for better comprehension
            utterance.volume = 1.0; // Maximum volume

            // Stop any current speech
            window.speechSynthesis.cancel();

            // Start speaking
            window.speechSynthesis.speak(utterance);
        }
    } else {
        console.warn("No content found to read in modal:", modal.id);
    }
}

// Function to ensure all content in the modal is visible
function ensureContentIsVisible(modal) {
    // Make sure the modal body is visible
    const modalBody = modal.querySelector('.modal-body');
    if (modalBody) {
        modalBody.style.display = 'block';

        // Make all divs in the modal body visible
        const divs = modalBody.querySelectorAll('div');
        divs.forEach(div => {
            div.style.display = 'block';
        });

        // Make all paragraphs visible
        const paragraphs = modalBody.querySelectorAll('p');
        paragraphs.forEach(p => {
            p.style.display = 'block';
        });

        // Make all lists visible
        const lists = modalBody.querySelectorAll('ul, ol, .list-group');
        lists.forEach(list => {
            list.style.display = 'block';
        });

        // Make all list items visible
        const listItems = modalBody.querySelectorAll('li, .list-group-item');
        listItems.forEach(item => {
            item.style.display = 'block';
        });
    }
}
}
