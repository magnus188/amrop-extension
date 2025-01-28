document.getElementById('scrapeButton').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "scrapeProfile" }, (resp) => {

            chrome.runtime.sendMessage({ type: 'SEND_PROMPT', resp }, (response) => {
                if (response.error) {
                    document.getElementById('response').innerText = `Error: ${response.error}`;
                } else {
                    document.getElementById('response').innerText = response.result;
                }
            });
        });
    });
});

document.getElementById('settings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
});