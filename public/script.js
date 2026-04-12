document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('subscribeForm');
    const phoneInput = document.getElementById('phoneNumber');
    const messageDiv = document.getElementById('message');
    const submitButton = form.querySelector('button[type="submit"]');
    const btnText = submitButton.querySelector('.btn-text');
    const btnLoading = submitButton.querySelector('.btn-loading');

    // Format phone number as user types
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^\d+]/g, '');
        
        // Ensure it starts with +
        if (value && !value.startsWith('+')) {
            value = '+' + value;
        }
        
        e.target.value = value;
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const phoneNumber = phoneInput.value.trim();
        
        // Client-side validation
        if (!phoneNumber.match(/^\+\d{1,15}$/)) {
            showMessage('Please enter a valid phone number with country code (e.g., +1234567890)', 'error');
            return;
        }

        // Disable form and show loading state
        submitButton.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
        messageDiv.style.display = 'none';

        try {
            const response = await fetch('/api/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phoneNumber })
            });

            const data = await response.json();

            if (data.success) {
                showMessage(data.message, 'success');
                phoneInput.value = '';
            } else {
                showMessage(data.error || 'Something went wrong. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('Network error. Please check your connection and try again.', 'error');
        } finally {
            // Re-enable form
            submitButton.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        }
    });

    // Show message helper
    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        
        // Auto-hide after 8 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 8000);
        }
    }
});
