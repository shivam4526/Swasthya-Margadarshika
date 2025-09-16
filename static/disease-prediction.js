// disease-prediction.js - Handles disease prediction functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the recent searches section
    initializeRecentSearches();
    
    // Add event listeners for the disease category buttons
    setupCategoryButtons();
    
    // Track previous symptoms
    trackPreviousSymptoms();
});

// Initialize recent searches section
function initializeRecentSearches() {
    // Get search history from localStorage
    const searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    
    // Create recent searches container if it doesn't exist
    const container = document.querySelector('.container');
    if (!container) return;
    
    // Find the form
    const form = document.querySelector('form[action="/predict"]');
    if (!form) return;
    
    // Create recent searches section if we have history
    if (searchHistory.length > 0) {
        // Create the section
        const recentSearchesSection = document.createElement('div');
        recentSearchesSection.id = 'recent-searches';
        recentSearchesSection.className = 'mt-4';
        recentSearchesSection.innerHTML = `
            <h6 class="text-muted"><i class="fas fa-history"></i> Recent Searches:</h6>
            <div class="recent-searches-list d-flex flex-wrap"></div>
            <div class="mt-2">
                <button id="clear-history" class="btn btn-sm btn-outline-danger">Clear History</button>
            </div>
        `;
        
        // Insert after the form
        form.parentNode.insertBefore(recentSearchesSection, form.nextSibling);
        
        // Add recent searches as buttons
        const recentSearchesList = recentSearchesSection.querySelector('.recent-searches-list');
        searchHistory.forEach(search => {
            const searchButton = document.createElement('button');
            searchButton.className = 'btn btn-sm btn-outline-secondary me-2 mb-2';
            searchButton.textContent = search;
            searchButton.addEventListener('click', function() {
                document.getElementById('symptoms').value = search;
            });
            recentSearchesList.appendChild(searchButton);
        });
        
        // Add clear history functionality
        const clearButton = document.getElementById('clear-history');
        if (clearButton) {
            clearButton.addEventListener('click', function() {
                localStorage.removeItem('searchHistory');
                const recentSearchesSection = document.getElementById('recent-searches');
                if (recentSearchesSection) {
                    recentSearchesSection.remove();
                }
            });
        }
    }
}

// Setup category buttons
function setupCategoryButtons() {
    // Add click event listeners to all category buttons
    const categoryButtons = document.querySelectorAll('.toggle-button');
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetModalId = this.getAttribute('data-bs-target');
            if (targetModalId) {
                // Ensure the modal content is loaded properly
                const modal = document.querySelector(targetModalId);
                if (modal) {
                    // Check if the modal has content
                    const modalBody = modal.querySelector('.modal-body');
                    if (modalBody) {
                        // Make sure content is visible
                        modalBody.style.display = 'block';
                    }
                }
            }
        });
    });
}

// Track previous symptoms
function trackPreviousSymptoms() {
    const form = document.querySelector('form[action="/predict"]');
    const symptomsInput = document.getElementById('symptoms');
    
    if (form && symptomsInput) {
        form.addEventListener('submit', function() {
            const symptoms = symptomsInput.value.trim();
            if (symptoms) {
                // Save to localStorage
                saveToSearchHistory(symptoms);
            }
        });
    }
}

// Save to search history
function saveToSearchHistory(symptoms) {
    // Get existing history
    let searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    
    // Add current symptoms to history if not already present
    if (!searchHistory.includes(symptoms)) {
        // Add to beginning of array
        searchHistory.unshift(symptoms);
        
        // Limit history to 5 items
        if (searchHistory.length > 5) {
            searchHistory = searchHistory.slice(0, 5);
        }
        
        // Save updated history
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    }
}
