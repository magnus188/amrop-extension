document.addEventListener('DOMContentLoaded', () => {
    // Load saved settings
    chrome.storage.sync.get(['authType', 'apiKey'], (data) => {
        if (data.authType) {
            document.querySelector(`input[name="auth"][value="${data.authType}"]`).checked = true;
        }
        if (data.apiKey) {
            document.getElementById('apiKey').value = data.apiKey;
        }
    });

    // Handle auth type change
    document.querySelectorAll('input[name="auth"]').forEach((elem) => {
        elem.addEventListener('change', () => {
            const isUser = document.querySelector('input[name="auth"]:checked').value === 'user';
            document.getElementById('apiKey').disabled = !isUser;
        });
    });

    // Save settings
    document.getElementById('save').addEventListener('click', () => {
        const authType = document.querySelector('input[name="auth"]:checked').value;
        const apiKey = document.getElementById('apiKey').value.trim();

        if (authType === 'user' && !apiKey) {
            alert('Please enter your OpenAI API key.');
            return;
        }

        chrome.storage.sync.set({ authType, apiKey }, () => {
            alert('Settings saved.');
        });
    });
});