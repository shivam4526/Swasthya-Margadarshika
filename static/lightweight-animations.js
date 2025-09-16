// lightweight-animations.js - Replaces anime.js with lightweight CSS transitions

document.addEventListener('DOMContentLoaded', function() {
    // Add visible class to navbar items with a slight delay between each
    const navItems = document.querySelectorAll('.navbar-nav .nav-item');
    navItems.forEach((item, index) => {
        setTimeout(() => {
            item.classList.add('visible');
        }, 100 * index);
    });

    // Make logo visible
    const logo = document.querySelector('.logo img');
    if (logo) {
        setTimeout(() => {
            logo.style.opacity = '1';
        }, 200);
    }

    // Make main heading visible
    const mainHeading = document.querySelector('h1.mt-4');
    if (mainHeading) {
        setTimeout(() => {
            mainHeading.classList.add('visible');
        }, 300);
    }

    // Make containers visible
    const containers = document.querySelectorAll('.container');
    containers.forEach((container) => {
        setTimeout(() => {
            container.classList.add('visible');
        }, 400);
    });

    // Add animation classes to elements
    const headings = document.querySelectorAll('h2, h3, h4, h5');
    headings.forEach(heading => {
        if (!heading.classList.contains('fade-in') && !heading.classList.contains('slide-in')) {
            heading.classList.add('fade-in');
        }
    });

    // Add animation to paragraphs
    const paragraphs = document.querySelectorAll('p');
    paragraphs.forEach(paragraph => {
        if (!paragraph.classList.contains('fade-in') && !paragraph.classList.contains('slide-in')) {
            paragraph.classList.add('fade-in');
        }
    });

    // Add animation to cards
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        if (!card.classList.contains('fade-in') && !card.classList.contains('slide-in')) {
            card.classList.add('slide-in');
        }
    });

    // Function to check if an element is in viewport with threshold
    function isInViewport(element, threshold = 0.1) {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;

        // Element is considered in viewport if at least threshold percent is visible
        const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
        const elementHeight = rect.bottom - rect.top;

        return visibleHeight > 0 && visibleHeight / elementHeight >= threshold;
    }

    // Function to handle scroll animations with performance optimization
    function handleScrollAnimations() {
        // Check if prefersReducedMotion is defined, if not, define it
        if (typeof window.prefersReducedMotion === 'undefined') {
            window.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        }

        // Skip if user prefers reduced motion
        if (window.prefersReducedMotion) return;

        // Use requestAnimationFrame for better performance
        requestAnimationFrame(() => {
            const elements = document.querySelectorAll('.fade-in:not(.visible), .slide-in:not(.visible)');

            elements.forEach(element => {
                if (isInViewport(element)) {
                    element.classList.add('visible');
                }
            });
        });
    }

    // Debounce function to limit how often a function is called
    function debounce(func, wait = 10, immediate = true) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    // Run animation check on scroll with debounce for better performance
    window.addEventListener('scroll', debounce(handleScrollAnimations, 15));

    // Run once on page load to animate elements already in view
    handleScrollAnimations();

    // Also run when images are loaded, as this can change layout
    window.addEventListener('load', handleScrollAnimations);

    // Add animation classes to elements
    function addAnimationClasses() {
        // Add to headings
        document.querySelectorAll('h2, h3, h4, h5').forEach(heading => {
            heading.classList.add('fade-in');
        });

        // Add to paragraphs
        document.querySelectorAll('p').forEach(paragraph => {
            paragraph.classList.add('slide-in');
        });

        // Add to cards and other elements
        document.querySelectorAll('.card, .blog-post').forEach(element => {
            element.classList.add('fade-in');
        });

        // Add transition class to buttons
        document.querySelectorAll('.btn').forEach(button => {
            button.classList.add('transition-element');
        });

        // Add transition class to toggle buttons
        document.querySelectorAll('.toggle-button').forEach(button => {
            button.classList.add('transition-element');
        });
    }

    // Initialize animations
    addAnimationClasses();
    handleScrollAnimations();

    // Listen for scroll events
    window.addEventListener('scroll', handleScrollAnimations);

    // Make toast notifications visible when created
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.classList && node.classList.contains('toast')) {
                        setTimeout(() => {
                            node.classList.add('visible');
                        }, 10);
                    }
                });
            }
        });
    });

    // Start observing the document body for toast container changes
    const toastContainer = document.getElementById('toast-container');
    if (toastContainer) {
        observer.observe(toastContainer, { childList: true });
    }

    // Handle form submission with subtle animation
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function() {
            const submitButton = this.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.classList.add('button-pulse');
                setTimeout(() => {
                    submitButton.classList.remove('button-pulse');
                }, 500);
            }
        });
    });
});