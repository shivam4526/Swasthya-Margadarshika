// symptom-images.js - Handles symptom image display and selection

document.addEventListener('DOMContentLoaded', function() {
    // Initialize symptom image functionality
    initSymptomImages();

    // Setup event listeners for the symptom search input
    setupSymptomSearch();
});

// Global variables
let selectedSymptoms = [];
const maxSelectedSymptoms = 5;

// Initialize symptom image functionality
function initSymptomImages() {
    console.log("Initializing symptom images functionality");

    // Create the symptom images container if it doesn't exist
    createSymptomImagesContainer();

    // Load initial symptom images
    loadSymptomImages();
}

// Create the symptom images container
function createSymptomImagesContainer() {
    const form = document.querySelector('form[action="/predict"]');
    if (!form) return;

    // Check if container already exists
    if (document.getElementById('symptom-images-container')) return;

    // Create the container
    const container = document.createElement('div');
    container.id = 'symptom-images-container';
    container.className = 'mt-4 mb-4';
    container.innerHTML = `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h6 class="mb-0"><i class="fas fa-images"></i> Select Symptoms from Images</h6>
                <button type="button" id="refresh-images" class="btn btn-sm btn-outline-primary">
                    <i class="fas fa-sync-alt"></i> Refresh
                </button>
            </div>
            <div class="card-body">
                <div id="selected-symptoms" class="mb-3" style="display: none;">
                    <h6>Selected Symptoms:</h6>
                    <div class="selected-symptoms-list d-flex flex-wrap"></div>
                </div>
                <div id="symptom-images-grid" class="row g-3">
                    <div class="col-12 text-center">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p>Loading symptom images...</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Insert before the form
    form.parentNode.insertBefore(container, form);

    // Add event listener for the refresh button
    const refreshButton = document.getElementById('refresh-images');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            loadSymptomImages();
        });
    }
}

// Load symptom images based on current input
function loadSymptomImages(inputText = '') {
    const grid = document.getElementById('symptom-images-grid');
    if (!grid) return;

    // Show loading state
    grid.innerHTML = `
        <div class="col-12 text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p>Loading symptom images...</p>
        </div>
    `;

    // Get the current input text if not provided
    if (!inputText) {
        const symptomsInput = document.getElementById('symptoms');
        if (symptomsInput) {
            inputText = symptomsInput.value.trim();
        }
    }

    // Make API request to get symptom images
    fetch('/api/symptom-images', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: inputText }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        displaySymptomImages(data.images);
    })
    .catch(error => {
        console.error('Error fetching symptom images:', error);
        grid.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-danger">
                    Error loading symptom images. Please try again.
                </div>
            </div>
        `;
    });
}

// Display symptom images in the grid
function displaySymptomImages(images) {
    const grid = document.getElementById('symptom-images-grid');
    if (!grid) return;

    // Clear the grid
    grid.innerHTML = '';

    // If no images, show a message
    if (!images || images.length === 0) {
        grid.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-info">
                    No symptom images found. Try different symptoms.
                </div>
            </div>
        `;
        return;
    }

    // Add each image to the grid
    images.forEach(item => {
        const col = document.createElement('div');
        col.className = 'col-6 col-md-3';

        // Check if this symptom is already selected
        const isSelected = selectedSymptoms.includes(item.symptom);
        const selectedClass = isSelected ? 'selected' : '';

        // Get the description if available
        const description = item.description || `Medical illustration of ${item.symptom}`;

        col.innerHTML = `
            <div class="symptom-image-card ${selectedClass}"
                data-symptom="${item.symptom}"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                data-bs-custom-class="symptom-tooltip"
                title="${description}">
                <img src="${item.image}" alt="${item.symptom}" class="img-fluid">
                <div class="symptom-name">${item.symptom}</div>
                <div class="selection-indicator">
                    <i class="fas fa-check-circle"></i>
                </div>
            </div>
        `;

        grid.appendChild(col);

        // Add click event listener to the card
        const card = col.querySelector('.symptom-image-card');

        // Add touch-friendly event listeners for mobile
        if (isTouchDevice()) {
            let touchTimer;
            let touchDuration = 500; // Duration for long press in milliseconds

            card.addEventListener('touchstart', function(e) {
                touchTimer = setTimeout(() => {
                    // Show tooltip on long press
                    const tooltip = new bootstrap.Tooltip(this);
                    tooltip.show();

                    // Hide tooltip after 3 seconds
                    setTimeout(() => {
                        tooltip.hide();
                    }, 3000);
                }, touchDuration);
            });

            card.addEventListener('touchend', function(e) {
                if (touchTimer) {
                    clearTimeout(touchTimer);

                    // If it was a short touch, toggle selection
                    toggleSymptomSelection(this);
                }
            });

            card.addEventListener('touchmove', function(e) {
                // Cancel the timer if the user moves their finger
                clearTimeout(touchTimer);
            });
        } else {
            // For non-touch devices, initialize tooltip
            new bootstrap.Tooltip(card);

            // Add click event for selection
            card.addEventListener('click', function() {
                toggleSymptomSelection(this);
            });
        }
    });

    // Add a "Show More" button if there are many symptoms
    if (images.length >= 8) {
        const showMoreCol = document.createElement('div');
        showMoreCol.className = 'col-12 text-center mt-3';
        showMoreCol.innerHTML = `
            <button id="show-more-symptoms" class="btn btn-outline-primary">
                <i class="fas fa-plus-circle"></i> Show More Symptoms
            </button>
        `;
        grid.appendChild(showMoreCol);

        // Add click event listener to the button
        const showMoreButton = document.getElementById('show-more-symptoms');
        if (showMoreButton) {
            showMoreButton.addEventListener('click', function() {
                // Get the current input text
                const symptomsInput = document.getElementById('symptoms');
                const inputText = symptomsInput ? symptomsInput.value.trim() : '';

                // Load more symptom images
                loadMoreSymptomImages(inputText);
            });
        }
    }
}

// Function to load more symptom images
function loadMoreSymptomImages(inputText = '') {
    const grid = document.getElementById('symptom-images-grid');
    if (!grid) return;

    // Show loading state in the "Show More" button
    const showMoreButton = document.getElementById('show-more-symptoms');
    if (showMoreButton) {
        showMoreButton.innerHTML = `
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Loading more...
        `;
        showMoreButton.disabled = true;
    }

    // Make API request to get more symptom images
    fetch('/api/symptom-images', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            input: inputText,
            offset: document.querySelectorAll('.symptom-image-card').length
        }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Remove the "Show More" button
        if (showMoreButton) {
            showMoreButton.parentNode.remove();
        }

        // Add the new images to the grid
        if (data.images && data.images.length > 0) {
            displayAdditionalSymptomImages(data.images);
        } else {
            // Show "No more symptoms" message
            const noMoreCol = document.createElement('div');
            noMoreCol.className = 'col-12 text-center mt-3';
            noMoreCol.innerHTML = `
                <div class="alert alert-info">
                    No more symptoms available.
                </div>
            `;
            grid.appendChild(noMoreCol);
        }
    })
    .catch(error => {
        console.error('Error fetching more symptom images:', error);

        // Show error message
        if (showMoreButton) {
            showMoreButton.innerHTML = `
                <i class="fas fa-exclamation-circle"></i> Error loading more
            `;
            showMoreButton.disabled = false;
        }
    });
}

// Function to display additional symptom images
function displayAdditionalSymptomImages(images) {
    const grid = document.getElementById('symptom-images-grid');
    if (!grid) return;

    // Add each image to the grid
    images.forEach(item => {
        const col = document.createElement('div');
        col.className = 'col-6 col-md-3';
        col.style.opacity = '0';
        col.style.transform = 'translateY(20px)';

        // Check if this symptom is already selected
        const isSelected = selectedSymptoms.includes(item.symptom);
        const selectedClass = isSelected ? 'selected' : '';

        // Get the description if available
        const description = item.description || `Medical illustration of ${item.symptom}`;

        col.innerHTML = `
            <div class="symptom-image-card ${selectedClass}"
                data-symptom="${item.symptom}"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                data-bs-custom-class="symptom-tooltip"
                title="${description}">
                <img src="${item.image}" alt="${item.symptom}" class="img-fluid">
                <div class="symptom-name">${item.symptom}</div>
                <div class="selection-indicator">
                    <i class="fas fa-check-circle"></i>
                </div>
            </div>
        `;

        grid.appendChild(col);

        // Animate the new card
        setTimeout(() => {
            col.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            col.style.opacity = '1';
            col.style.transform = 'translateY(0)';
        }, 50);

        // Add click event listener to the card
        const card = col.querySelector('.symptom-image-card');

        // Add touch-friendly event listeners for mobile
        if (isTouchDevice()) {
            let touchTimer;
            let touchDuration = 500; // Duration for long press in milliseconds

            card.addEventListener('touchstart', function(e) {
                touchTimer = setTimeout(() => {
                    // Show tooltip on long press
                    const tooltip = new bootstrap.Tooltip(this);
                    tooltip.show();

                    // Hide tooltip after 3 seconds
                    setTimeout(() => {
                        tooltip.hide();
                    }, 3000);
                }, touchDuration);
            });

            card.addEventListener('touchend', function(e) {
                if (touchTimer) {
                    clearTimeout(touchTimer);

                    // If it was a short touch, toggle selection
                    toggleSymptomSelection(this);
                }
            });

            card.addEventListener('touchmove', function(e) {
                // Cancel the timer if the user moves their finger
                clearTimeout(touchTimer);
            });
        } else {
            // For non-touch devices, initialize tooltip
            new bootstrap.Tooltip(card);

            // Add click event for selection
            card.addEventListener('click', function() {
                toggleSymptomSelection(this);
            });
        }
    });

    // Add a "Show More" button if there are many symptoms
    if (images.length >= 4) {
        const showMoreCol = document.createElement('div');
        showMoreCol.className = 'col-12 text-center mt-3';
        showMoreCol.innerHTML = `
            <button id="show-more-symptoms" class="btn btn-outline-primary">
                <i class="fas fa-plus-circle"></i> Show More Symptoms
            </button>
        `;
        grid.appendChild(showMoreCol);

        // Add click event listener to the button
        const showMoreButton = document.getElementById('show-more-symptoms');
        if (showMoreButton) {
            showMoreButton.addEventListener('click', function() {
                // Get the current input text
                const symptomsInput = document.getElementById('symptoms');
                const inputText = symptomsInput ? symptomsInput.value.trim() : '';

                // Load more symptom images
                loadMoreSymptomImages(inputText);
            });
        }
    }
}

// Helper function to detect touch devices
function isTouchDevice() {
    return (('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0));
}

// Toggle symptom selection
function toggleSymptomSelection(card) {
    const symptom = card.getAttribute('data-symptom');

    // Check if already selected
    if (card.classList.contains('selected')) {
        // Remove from selected
        card.classList.remove('selected');
        selectedSymptoms = selectedSymptoms.filter(s => s !== symptom);
    } else {
        // Check if we've reached the maximum number of selections
        if (selectedSymptoms.length >= maxSelectedSymptoms) {
            // Show a toast notification
            showToast(`You can select up to ${maxSelectedSymptoms} symptoms at a time.`, 'warning');
            return;
        }

        // Add to selected
        card.classList.add('selected');
        selectedSymptoms.push(symptom);
    }

    // Update the selected symptoms display
    updateSelectedSymptomsDisplay();

    // Update the symptoms input field
    updateSymptomsInput();
}

// Update the selected symptoms display
function updateSelectedSymptomsDisplay() {
    const container = document.getElementById('selected-symptoms');
    const list = document.querySelector('.selected-symptoms-list');
    if (!container || !list) return;

    // Show/hide the container based on whether there are selected symptoms
    if (selectedSymptoms.length > 0) {
        container.style.display = 'block';

        // Update the list
        list.innerHTML = '';
        selectedSymptoms.forEach(symptom => {
            const badge = document.createElement('span');
            badge.className = 'badge bg-primary me-2 mb-2';
            badge.innerHTML = `${symptom} <i class="fas fa-times-circle remove-symptom" data-symptom="${symptom}"></i>`;
            list.appendChild(badge);

            // Add click event listener to remove button
            const removeButton = badge.querySelector('.remove-symptom');
            removeButton.addEventListener('click', function(e) {
                e.stopPropagation();
                const symptomToRemove = this.getAttribute('data-symptom');
                removeSelectedSymptom(symptomToRemove);
            });
        });
    } else {
        container.style.display = 'none';
    }
}

// Remove a selected symptom
function removeSelectedSymptom(symptom) {
    // Remove from the selected symptoms array
    selectedSymptoms = selectedSymptoms.filter(s => s !== symptom);

    // Update the card selection state
    const card = document.querySelector(`.symptom-image-card[data-symptom="${symptom}"]`);
    if (card) {
        card.classList.remove('selected');
    }

    // Update the display
    updateSelectedSymptomsDisplay();

    // Update the symptoms input field
    updateSymptomsInput();
}

// Update the symptoms input field with selected symptoms
function updateSymptomsInput() {
    const symptomsInput = document.getElementById('symptoms');
    if (!symptomsInput) return;

    if (selectedSymptoms.length > 0) {
        symptomsInput.value = selectedSymptoms.join(', ');

        // Add a subtle highlight effect to the input
        symptomsInput.style.boxShadow = '0 0 8px rgba(52, 152, 219, 0.5)';
        setTimeout(() => {
            symptomsInput.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.1)';
        }, 1000);
    } else {
        symptomsInput.value = '';
    }
}

// Setup event listeners for the symptom search input
function setupSymptomSearch() {
    const symptomsInput = document.getElementById('symptoms');
    if (!symptomsInput) return;

    // Add input event listener to update images based on input
    let debounceTimer;
    symptomsInput.addEventListener('input', function() {
        // Clear previous timer
        clearTimeout(debounceTimer);

        // Set a new timer to avoid too many requests
        debounceTimer = setTimeout(() => {
            const inputText = this.value.trim();
            loadSymptomImages(inputText);
        }, 500); // 500ms debounce
    });
}

// Show a toast notification
function showToast(message, type = 'info') {
    // Check if toast container exists, create if not
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }

    // Create a unique ID for this toast
    const toastId = 'toast-' + Date.now();

    // Create the toast element
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.id = toastId;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    // Add the toast to the container
    toastContainer.appendChild(toast);

    // Initialize the Bootstrap toast
    const bsToast = new bootstrap.Toast(toast, {
        autohide: true,
        delay: 3000
    });

    // Show the toast
    bsToast.show();

    // Remove the toast element after it's hidden
    toast.addEventListener('hidden.bs.toast', function() {
        this.remove();
    });
}
