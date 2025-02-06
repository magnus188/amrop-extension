let latestResponse = "";

let scrapeButton = document.getElementById('scrapeButton');
let responseDiv = document.getElementById('response');

let originalBtnText = "Genererate"
let btnTxtSuccess = "Copied!"

document.getElementById('scrapeButton').addEventListener('click', () => {
    setLoadingState();
    isValidUrl((isValid) => {
        if (!isValid) {
            setLoadingState(false);
            return;
        }
        scrapeButton.disabled = true;
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            // Send the scrape request.
            chrome.tabs.sendMessage(tabs[0].id, { action: "scrapeProfile" }, (resp) => {
                if (resp && resp.experiences) {
                    processScrapedData(resp);
                }
            });
        });
    });
});

// Listen for the SCRAPE_COMPLETE message sent from the full-page content script.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'SCRAPE_COMPLETE') {
        processScrapedData(msg.info);
    }
});

function processScrapedData(info) {
    // For example, send the data to your background or prompt logic.
    chrome.runtime.sendMessage({ type: 'SEND_PROMPT', resp: info }, (response) => {
        scrapeButton.disabled = false;
        if (response.error) {
            setLoadingState(false);
            responseDiv.innerText = `Error: ${response.error}`;
        } else {
            latestResponse = response.result;
            setLoadingState(false);
            navigator.clipboard.writeText(response.result).then(() => {
                scrapeButton.textContent = btnTxtSuccess;
                setTimeout(() => {
                    scrapeButton.textContent = originalBtnText;
                }, 2000);
            }).catch(err => {
                console.error('Could not copy text: ', err);
            });
        }
    });
}


function updateResponseDiv (content) {
    responseDiv.style.display = "block";
    responseDiv.textContent = content;

    setTimeout(() => {
        responseDiv.style.display = "none";
        responseDiv.textContent = "";
    }, 5000);
}

function isValidUrl(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) {
            updateResponseDiv('No active tab found.')
            callback(false);
            return;
        }

        let url;
        try {
            url = new URL(tabs[0].url);
        } catch (e) {
            updateResponseDiv('Invalid URL.');
            callback(false);
            return;
        }

        if (url.hostname !== 'www.linkedin.com') {
            updateResponseDiv('This extension only works on LinkedIn.')
            callback(false);
        } else {
            callback(true);
        }
    });
}

function setLoadingState(on=true) {
    if (on) {
        scrapeButton.classList.add('loading');
    }
    else {
        scrapeButton.classList.remove('loading');
    }
}


document.getElementById('copy').addEventListener('click', () => {
    navigator.clipboard.writeText(latestResponse)

});

document.getElementById('settings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
});