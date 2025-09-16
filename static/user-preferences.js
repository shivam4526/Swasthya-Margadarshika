// user-preferences.js - Handles user preferences and history

document.addEventListener('DOMContentLoaded', function() {
    // Load previous symptoms if available
    loadPreviousSymptoms();
    
    // Setup event listeners
    setupEventListeners();
    
    // Create recent searches section if it doesn't exist
    createRecentSearchesSection();
});

// Load previous symptoms from localStorage
function loadPreviousSymptoms() {
    const symptomsInput = document.getElementById('symptoms');
    if (!symptomsInput) return;
    
    // Get previous symptoms from localStorage
    const previousSymptoms = localStorage.getItem('previousSymptoms');
    if (previousSymptoms) {
        // Don't auto-fill, but make them available for quick selection
        console.log('Previous symptoms found:', previousSymptoms);
    }
}

// Setup event listeners
function setupEventListeners() {
    const form = document.querySelector('form[action="/predict"]');
    const symptomsInput = document.getElementById('symptoms');
    
    if (form && symptomsInput) {
        form.addEventListener('submit', function() {
            const symptoms = symptomsInput.value.trim();
            if (symptoms) {
                // Save current symptoms to localStorage
                saveSymptoms(symptoms);
            }
        });
    }
}

// Save symptoms to localStorage
function saveSymptoms(symptoms) {
    // Save current symptoms
    localStorage.setItem('previousSymptoms', symptoms);
    
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

// Create recent searches section
function createRecentSearchesSection() {
    const container = document.querySelector('.container');
    const form = document.querySelector('form[action="/predict"]');
    
    if (!container || !form) return;
    
    // Get search history
    const searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    
    // If there's no history, don't create the section
    if (searchHistory.length === 0) return;
    
    // Create recent searches section
    const recentSearchesSection = document.createElement('div');
    recentSearchesSection.className = 'recent-searches mt-3';
    recentSearchesSection.innerHTML = `
        <h6><i class="fas fa-history"></i> Recent Searches:</h6>
        <div class="recent-searches-list"></div>
    `;
    
    // Insert after the form
    form.parentNode.insertBefore(recentSearchesSection, form.nextSibling);
    
    // Add recent searches
    const recentSearchesList = recentSearchesSection.querySelector('.recent-searches-list');
    searchHistory.forEach(search => {
        const searchItem = document.createElement('button');
        searchItem.className = 'btn btn-sm btn-outline-secondary me-2 mb-2';
        searchItem.textContent = search;
        searchItem.addEventListener('click', function() {
            document.getElementById('symptoms').value = search;
        });
        recentSearchesList.appendChild(searchItem);
    });
    
    // Add clear history button
    const clearButton = document.createElement('button');
    clearButton.className = 'btn btn-sm btn-link text-danger';
    clearButton.textContent = 'Clear History';
    clearButton.addEventListener('click', function() {
        localStorage.removeItem('searchHistory');
        recentSearchesSection.remove();
    });
    recentSearchesSection.appendChild(clearButton);
}
