document.getElementById('scrapeButton').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "scrapeProfile" }, (response) => {
            console.log(response)
        });
    });
});

document.getElementById('send').addEventListener('click', () => {
    const prompt = document.getElementById('prompt').value;
    if (!prompt) {
        alert('Please enter a prompt.');
        return;
    }

    chrome.runtime.sendMessage({ type: 'SEND_PROMPT', prompt }, (response) => {
        if (response.error) {
            document.getElementById('response').innerText = `Error: ${response.error}`;
        } else {
            document.getElementById('response').innerText = response.result;
        }
    });
});

document.getElementById('settings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
});