// modal-fix.js - Fixes modal display issues

document.addEventListener('DOMContentLoaded', function() {
    // Fix modals on page load
    fixModals();
    
    // Add event listener for when the page is fully loaded
    window.addEventListener('load', function() {
        // Fix modals again after everything is loaded
        fixModals();
    });
});

// Function to fix modals
function fixModals() {
    console.log("Fixing modals");
    
    // Fix disease modal
    fixDiseaseModal();
    
    // Fix description modal
    fixDescriptionModal();
    
    // Fix other modals
    fixOtherModals();
}

// Fix disease modal
function fixDiseaseModal() {
    const diseaseModal = document.getElementById('diseaseModal');
    if (!diseaseModal) return;
    
    const modalBody = diseaseModal.querySelector('.modal-body');
    if (!modalBody) return;
    
    const contentDiv = modalBody.querySelector('.p-2');
    if (!contentDiv) return;
    
    // Make sure the content div is visible
    contentDiv.style.display = 'block';
    contentDiv.style.visibility = 'visible';
    contentDiv.style.opacity = '1';
    
    // Check if there's content
    const paragraphs = contentDiv.querySelectorAll('p');
    if (paragraphs.length === 0) {
        // Add a default message
        const noContentMessage = document.createElement('p');
        noContentMessage.innerHTML = '<strong>No disease prediction available.</strong> Please enter your symptoms and click "Predict".';
        contentDiv.appendChild(noContentMessage);
    } else {
        // Make sure all paragraphs are visible
        paragraphs.forEach(p => {
            p.style.display = 'block';
            p.style.visibility = 'visible';
            p.style.opacity = '1';
        });
    }
}

// Fix description modal
function fixDescriptionModal() {
    const descriptionModal = document.getElementById('descriptionModal');
    if (!descriptionModal) return;
    
    const modalBody = descriptionModal.querySelector('.modal-body');
    if (!modalBody) return;
    
    const contentDiv = modalBody.querySelector('.p-3');
    if (!contentDiv) return;
    
    // Make sure the content div is visible
    contentDiv.style.display = 'block';
    contentDiv.style.visibility = 'visible';
    contentDiv.style.opacity = '1';
    
    // Check if there's content
    const paragraphs = contentDiv.querySelectorAll('p');
    if (paragraphs.length === 0) {
        // Add a default message
        const noContentMessage = document.createElement('p');
        noContentMessage.textContent = 'No description available. Please enter your symptoms and click "Predict".';
        contentDiv.appendChild(noContentMessage);
    } else {
        // Make sure all paragraphs are visible
        paragraphs.forEach(p => {
            p.style.display = 'block';
            p.style.visibility = 'visible';
            p.style.opacity = '1';
        });
    }
}

// Fix other modals (precautions, medications, workouts, diets)
function fixOtherModals() {
    const otherModals = [
        'precautionModal',
        'medicationsModal',
        'workoutsModal',
        'dietsModal'
    ];
    
    otherModals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        const modalBody = modal.querySelector('.modal-body');
        if (!modalBody) return;
        
        const contentDiv = modalBody.querySelector('.p-3');
        if (!contentDiv) return;
        
        // Make sure the content div is visible
        contentDiv.style.display = 'block';
        contentDiv.style.visibility = 'visible';
        contentDiv.style.opacity = '1';
        
        // Check for list group
        const listGroup = contentDiv.querySelector('.list-group');
        if (listGroup) {
            // Make sure the list group is visible
            listGroup.style.display = 'block';
            listGroup.style.visibility = 'visible';
            listGroup.style.opacity = '1';
            
            // Check if there are list items
            const listItems = listGroup.querySelectorAll('.list-group-item');
            if (listItems.length === 0) {
                // Add a default message
                const noContentMessage = document.createElement('p');
                noContentMessage.className = 'empty-content-message';
                noContentMessage.textContent = 'No content available. Please enter your symptoms and click "Predict".';
                contentDiv.appendChild(noContentMessage);
            } else {
                // Make sure all list items are visible
                listItems.forEach(item => {
                    item.style.display = 'block';
                    item.style.visibility = 'visible';
                    item.style.opacity = '1';
                });
            }
        }
    });
}
