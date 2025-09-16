// auth.js - Handles authentication functionality

document.addEventListener('DOMContentLoaded', function() {
    // Auto-dismiss alerts after 3 seconds
    const autoDismissAlerts = () => {
        // Target both regular alerts and flash message alerts
        const alerts = document.querySelectorAll('.alert, .auto-dismiss-alert');
        if (alerts.length > 0) {
            alerts.forEach(alert => {
                setTimeout(() => {
                    // Add fade-out class
                    alert.classList.add('fade-out');

                    // Remove the alert after the animation completes
                    setTimeout(() => {
                        // Use bootstrap's dismiss method if available
                        if (bootstrap && bootstrap.Alert) {
                            const bsAlert = bootstrap.Alert.getInstance(alert);
                            if (bsAlert) {
                                bsAlert.close();
                            } else {
                                alert.remove();
                            }
                        } else {
                            alert.remove();
                        }
                    }, 500); // 500ms for the fade-out animation
                }, 3000); // 3 seconds before starting the fade-out
            });
        }
    };

    // Call the function to auto-dismiss alerts
    autoDismissAlerts();

    // Form validation for login
    const loginForm = document.querySelector('form[action^="/login"]'); // Use starts-with selector to match forms with query parameters
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // Demo account auto-fill
            if (email === 'demo@example.com' && password === 'password123') {
                // Store login info in localStorage
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userEmail', email);
                localStorage.setItem('userName', 'Demo User');

                // Continue with form submission
                return true;
            }

            // For demo purposes, we'll accept any valid-looking email and password
            if (email && password && password.length >= 6) {
                // Store login info in localStorage
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userEmail', email);

                // Extract name from email for display
                const userName = email.split('@')[0];
                localStorage.setItem('userName', userName);

                // Continue with form submission
                return true;
            } else {
                // Show error for invalid credentials
                event.preventDefault();

                // Create error message if it doesn't exist
                let errorDiv = document.querySelector('.alert-danger');
                if (!errorDiv) {
                    errorDiv = document.createElement('div');
                    errorDiv.className = 'alert alert-danger';
                    loginForm.insertBefore(errorDiv, loginForm.firstChild);
                }

                errorDiv.textContent = 'Invalid email or password. Password must be at least 6 characters.';
                return false;
            }
        });
    }

    // Form validation for registration
    const registerForm = document.querySelector('form[action^="/register"]'); // Use starts-with selector to match forms with query parameters
    if (registerForm) {
        registerForm.addEventListener('submit', function(event) {
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            // Validate form fields
            if (!firstName || !lastName || !email || !password || !confirmPassword) {
                event.preventDefault();
                showError('All fields are required');
                return false;
            }

            // Validate password length
            if (password.length < 6) {
                event.preventDefault();
                showError('Password must be at least 6 characters');
                return false;
            }

            // Validate password match
            if (password !== confirmPassword) {
                event.preventDefault();
                showError('Passwords do not match');
                return false;
            }

            // Store registration info in localStorage
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userName', firstName + ' ' + lastName);

            // Continue with form submission (in a real app, this would go to the server)
            return true;
        });

        function showError(message) {
            let errorDiv = document.querySelector('.alert-danger');
            if (!errorDiv) {
                errorDiv = document.createElement('div');
                errorDiv.className = 'alert alert-danger';
                registerForm.insertBefore(errorDiv, registerForm.firstChild);
            }
            errorDiv.textContent = message;
        }
    }

    // Check login status on page load
    function checkLoginStatus() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const currentPath = window.location.pathname;

        // If on login or register page but already logged in, redirect to home
        if ((currentPath === '/login' || currentPath === '/register') && isLoggedIn) {
            window.location.href = '/';
        }
    }

    // Call the function to check login status
    checkLoginStatus();

    // Make sure fade-in elements are visible
    setTimeout(function() {
        const fadeElements = document.querySelectorAll('.fade-in');
        fadeElements.forEach(function(element) {
            element.classList.add('visible');
        });
    }, 100);
});
