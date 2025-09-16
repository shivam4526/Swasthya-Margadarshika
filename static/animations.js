// animations.js - Handles all animations using anime.js

document.addEventListener('DOMContentLoaded', function() {
  // Check if anime.js is loaded
  if (typeof anime === 'undefined') {
    console.error('anime.js is not loaded. Please make sure it is properly included.');
    return;
  }

  // Animate navbar items on page load
  anime({
    targets: '.navbar-nav .nav-item',
    translateY: ['-20px', '0'],
    opacity: [0, 1],
    easing: 'easeOutQuad',
    duration: 800,
    delay: anime.stagger(100, {start: 300})
  });

  // Animate logo
  anime({
    targets: '.logo img',
    scale: [0.8, 1],
    opacity: [0, 1],
    easing: 'easeOutElastic(1, .5)',
    duration: 1000,
    delay: 200
  });

  // Animate main heading
  anime({
    targets: 'h1.mt-4',
    translateY: ['-30px', '0'],
    opacity: [0, 1],
    easing: 'easeOutQuad',
    duration: 1000,
    delay: 500
  });

  // Animate content containers
  anime({
    targets: '.container',
    translateY: ['20px', '0'],
    opacity: [0, 1],
    easing: 'easeOutQuad',
    duration: 800,
    delay: 700
  });

  // Button hover animations
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(button => {
    button.addEventListener('mouseenter', function() {
      anime({
        targets: this,
        scale: 1.05,
        duration: 300,
        easing: 'easeOutQuad'
      });
    });
    
    button.addEventListener('mouseleave', function() {
      anime({
        targets: this,
        scale: 1,
        duration: 300,
        easing: 'easeOutQuad'
      });
    });
  });

  // Animate elements when they come into view
  const animateOnScroll = function() {
    const elements = document.querySelectorAll('.fade-in, .slide-in');
    
    elements.forEach(element => {
      const elementPosition = element.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;
      
      if (elementPosition < windowHeight - 50) {
        element.classList.add('visible');
      }
    });
  };

  // Run animation check on scroll
  window.addEventListener('scroll', animateOnScroll);
  
  // Run once on page load to animate elements already in view
  animateOnScroll();

  // Add animation classes to elements
  const addAnimationClasses = function() {
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
  };
  
  addAnimationClasses();
  
  // Form submission animation
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      // Don't interfere with actual form submission
      if (!e.defaultPrevented) {
        const button = form.querySelector('button[type="submit"]');
        if (button) {
          anime({
            targets: button,
            scale: [1, 1.2, 1],
            duration: 600,
            easing: 'easeInOutQuad'
          });
        }
      }
    });
  });
});