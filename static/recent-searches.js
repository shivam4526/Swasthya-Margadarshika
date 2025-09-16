// recent-searches.js - Handles the recent searches functionality

document.addEventListener('DOMContentLoaded', function() {
    // First, clean up any existing recent searches sections
    removeAllSearchSections();

    // Then display only one recent search
    displayRecentSearches();

    // Setup event listeners for the form
    setupFormListeners();

    // Set an interval to periodically check and remove duplicate sections
    setInterval(removeAllSearchSections, 1000);

    // Use MutationObserver to detect and remove duplicate sections as soon as they appear
    setupMutationObserver();
});

// Setup MutationObserver to watch for DOM changes and remove duplicate sections
function setupMutationObserver() {
    // Select the container where search sections might be added
    const container = document.querySelector('.container');
    if (!container) return;

    // Create a new observer
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Check if any of the added nodes contain recent search sections
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        // Check if this is a recent search section
                        if (node.textContent && (node.textContent.includes('Recent Searches') ||
                                                node.textContent.includes('Recent Search'))) {
                            // Count how many search sections we have
                            const searchSections = document.querySelectorAll('[id^="recent-searches"], .recent-searches-section');
                            if (searchSections.length > 1) {
                                console.log('MutationObserver detected duplicate sections, cleaning up...');
                                removeAllSearchSections();
                                displayRecentSearches();
                            }
                        }

                        // Also check children of the added node
                        const searchTexts = node.querySelectorAll('*');
                        searchTexts.forEach(el => {
                            if (el.textContent && (el.textContent.includes('Recent Searches') ||
                                                  el.textContent.includes('Recent Search'))) {
                                // Count how many search sections we have
                                const searchSections = document.querySelectorAll('[id^="recent-searches"], .recent-searches-section');
                                if (searchSections.length > 1) {
                                    console.log('MutationObserver detected duplicate sections in children, cleaning up...');
                                    removeAllSearchSections();
                                    displayRecentSearches();
                                }
                            }
                        });
                    }
                });
            }
        });
    });

    // Start observing the container for DOM changes
    observer.observe(container, {
        childList: true,      // Watch for changes to the direct children
        subtree: true,        // Watch for changes in the entire subtree
        attributes: false,    // Don't watch for attribute changes
        characterData: false  // Don't watch for character data changes
    });

    console.log('MutationObserver set up to watch for duplicate search sections');
}

// Display recent searches
function displayRecentSearches() {
    // First, make sure we remove any existing search sections
    removeAllSearchSections();

    // Get the container where the form is
    const container = document.querySelector('.container');
    if (!container) return;

    // Get the form
    const form = document.querySelector('form[action="/predict"]');
    if (!form) return;

    // Get search history from localStorage - ONLY keep the most recent search
    let searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');

    // Force to only have one item in the history
    if (searchHistory.length > 1) {
        // Keep only the most recent search
        searchHistory = [searchHistory[0]];
        // Update localStorage immediately
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    }

    // If there's no history, don't create the section
    if (searchHistory.length === 0) return;

    // Create recent searches section with a unique ID to help with removal
    const recentSearchesSection = document.createElement('div');
    recentSearchesSection.id = 'recent-searches-' + Date.now(); // Add timestamp to make ID unique
    recentSearchesSection.className = 'mt-4 p-3 bg-light rounded-3 border recent-searches-section';
    recentSearchesSection.style.borderRadius = '12px';
    recentSearchesSection.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';
    recentSearchesSection.innerHTML = `
        <h6 class="mb-3" style="color: #2c3e50; font-weight: 600;"><i class="fas fa-history me-2"></i> Recent Search</h6>
        <div id="recent-searches-list-${Date.now()}" class="d-flex flex-wrap mb-3 recent-searches-list"></div>
        <div>
            <button id="clear-history-${Date.now()}" class="btn btn-sm btn-outline-danger clear-history-btn" style="border-radius: 20px; padding: 5px 15px;">
                <i class="fas fa-trash-alt me-1"></i> Clear History
            </button>
        </div>
    `;

    // Insert after the form
    form.parentNode.insertBefore(recentSearchesSection, form.nextSibling);

    // Add the single most recent search as a button
    const recentSearchesList = recentSearchesSection.querySelector('.recent-searches-list');
    if (!recentSearchesList) return; // Safety check

    // Display the single recent search
    const search = searchHistory[0];

    const searchButton = document.createElement('button');
    searchButton.className = 'btn btn-sm me-2 mb-2 recent-search-button';
    searchButton.style.backgroundColor = '#e9f7fe';
    searchButton.style.color = '#3498db';
    searchButton.style.border = '1px solid #d1e8ff';
    searchButton.style.borderRadius = '20px';
    searchButton.style.padding = '6px 14px';
    searchButton.style.fontSize = '0.85rem';
    searchButton.style.transition = 'all 0.2s ease';
    searchButton.innerHTML = `<i class="fas fa-search-plus me-1"></i> ${search}`;

    // Add hover effect
    searchButton.onmouseover = function() {
        this.style.backgroundColor = '#d1e8ff';
        this.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
    };
    searchButton.onmouseout = function() {
        this.style.backgroundColor = '#e9f7fe';
        this.style.boxShadow = 'none';
    };

    searchButton.addEventListener('click', function() {
        document.getElementById('symptoms').value = search;
        // Add a subtle highlight effect to the input
        const symptomsInput = document.getElementById('symptoms');
        if (symptomsInput) {
            symptomsInput.style.boxShadow = '0 0 8px rgba(52, 152, 219, 0.5)';
            setTimeout(() => {
                symptomsInput.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.1)';
            }, 1000);
        }
    });
    recentSearchesList.appendChild(searchButton);

    // Add clear history functionality
    const clearButton = recentSearchesSection.querySelector('.clear-history-btn');
    if (clearButton) {
        clearButton.addEventListener('click', function() {
            // Clear the history from localStorage
            localStorage.removeItem('searchHistory');
            // Remove the section from the DOM
            recentSearchesSection.remove();
        });
    }
}

// This section is now handled inside the displayRecentSearches function
// and has been removed to avoid duplication

// Setup form listeners
function setupFormListeners() {
    const form = document.querySelector('form[action="/predict"]');
    const symptomsInput = document.getElementById('symptoms');

    if (form && symptomsInput) {
        form.addEventListener('submit', function() {
            // First, remove all existing search sections
            removeAllSearchSections();

            const symptoms = symptomsInput.value.trim();
            if (symptoms) {
                // Save to localStorage
                saveToSearchHistory(symptoms);

                // Add a small delay to ensure the form submission completes
                // before we clean up again
                setTimeout(() => {
                    removeAllSearchSections();
                    displayRecentSearches();
                }, 500);
            }
        });
    }

    // Also add a listener for the predict button directly
    const predictButton = document.querySelector('button[type="submit"]');
    if (predictButton) {
        predictButton.addEventListener('click', function() {
            // Remove all search sections when the button is clicked
            removeAllSearchSections();
        });
    }
}

// Save to search history
function saveToSearchHistory(symptoms) {
    // First, remove all existing search sections
    removeAllSearchSections();

    // For the user's preference, we'll only keep the most recent search
    // and immediately delete older searches

    // Create a new array with just the current symptoms
    const searchHistory = [symptoms];

    // Save to localStorage, replacing any existing history
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));

    // Force refresh the display to ensure only one search is shown
    // Use a small delay to ensure the DOM has updated
    setTimeout(() => {
        // Remove any existing sections again (double-check)
        removeAllSearchSections();

        // Display the updated search history
        displayRecentSearches();

        // Set another timeout to check for duplicates again
        setTimeout(removeAllSearchSections, 500);
    }, 100);
}

// Remove ALL search history sections completely
function removeAllSearchSections() {
    // Find all possible recent searches sections by various selectors
    const allHistorySections = document.querySelectorAll('[id^="recent-searches"], .recent-searches, .recent-searches-section');

    // Remove all of them
    if (allHistorySections.length > 0) {
        allHistorySections.forEach(section => {
            section.remove();
        });
        console.log('Removed all search history sections');
    }

    // Also look for any divs containing "Recent Searches" or "Recent Search" text
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
        if (el.textContent && (el.textContent.includes('Recent Searches') || el.textContent.includes('Recent Search'))) {
            // Find the parent container that might be a search history section
            const parentContainer = el.closest('div[class*="bg-light"], div[class*="border"], div[class*="mt-4"]');
            if (parentContainer && !parentContainer.classList.contains('container')) {
                parentContainer.remove();
                console.log('Removed section containing Recent Search text');
            }
        }
    });

    // Remove any clear history buttons that might be orphaned
    const clearButtons = document.querySelectorAll('[id*="clear-history"], button:contains("Clear History")');
    clearButtons.forEach(button => {
        button.remove();
    });
}
