let latestResponse = "";

let scrapeButton = document.getElementById('scrapeButton');
let responseDiv = document.getElementById('response');

let originalBtnText = "Genererate"
let btnTxtSuccess = "Copied!"

let scrapeTimeout;

document.getElementById('scrapeButton').addEventListener('click', () => {
    setLoadingState();
    isValidUrl((isValid) => {
        if (!isValid) {
            setLoadingState(false);
            return;
        }
        scrapeButton.disabled = true;
        
        // Set a 30 second timeout to handle slow responses.
        scrapeTimeout = setTimeout(() => {
            updateResponseDiv("Error: Request timed out");
            setLoadingState(false);
            scrapeButton.disabled = false;
        }, 30000);
        
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
    // Clear the timeout since a response has been received.
    if (scrapeTimeout) {
        clearTimeout(scrapeTimeout);
        scrapeTimeout = null;
    }
    
    // For example, send the data to your background or prompt logic.
    chrome.runtime.sendMessage({ type: 'SEND_PROMPT', resp: info }, (response) => {
        scrapeButton.disabled = false;
        if (response.error) {
            setLoadingState(false);
            updateResponseDiv(`Error: ${response.error}`);
        } else {
            latestResponse = response.result;
            setLoadingState(false);
            navigator.clipboard.writeText(response.result).then(() => {
                updateButtonText(btnTxtSuccess);
            }).catch(err => {
                updateResponseDiv(`Could not copy text: ${err}`);
            });
        }
    });
}


function updateButtonText(text) {
    scrapeButton.textContent = text;
    setTimeout(() => {
        scrapeButton.textContent = originalBtnText;
    }, 2000);
}


function updateResponseDiv(content) {
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

function setLoadingState(on = true) {
    if (on) {
        scrapeButton.classList.add('loading');
    }
    else {
        scrapeButton.classList.remove('loading');
    }
}


document.getElementById('copy').addEventListener('click', () => {
    try {
        if (latestResponse == "") {
            throw new Error("Latest response cache is empty");
        }
        navigator.clipboard.writeText(latestResponse).then(() => {

            updateButtonText(btnTxtSuccess)
        })

    } catch (e) {
        updateResponseDiv(e.message)
    }

});

document.getElementById('settings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
});