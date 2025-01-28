// Replace with your own API key for the free tier
const FREE_API_KEY = 'YOUR_FREE_API_KEY_HERE'; // Ensure this is kept secure

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SEND_PROMPT') {
        chrome.storage.sync.get(['authType', 'apiKey'], async (data) => {
            const { authType, apiKey } = data;
            let keyToUse = '';

            if (authType === 'user') {
                if (!apiKey) {
                    sendResponse({ error: 'No API key provided.' });
                    return;
                }
                keyToUse = apiKey;
            } else if (authType === 'free') {
                keyToUse = FREE_API_KEY;
            } else {
                sendResponse({ error: 'Invalid authentication type.' });
                return;
            }

            try {
                const result = await fetchOpenAI(message.prompt, keyToUse);
                sendResponse({ result });
            } catch (error) {
                sendResponse({ error: error.message });
            }
        });
        // Indicate that the response is asynchronous
        return true;
    }
});

// Function to interact with OpenAI's API
async function fetchOpenAI(prompt, apiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo', // or the model you prefer
            messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: 150
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || 'Unknown error from OpenAI API.');
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
}