let latestResponse = "";

const scrapeButton = document.getElementById('scrapeButton');
const responseDiv = document.getElementById('response');
const buttonIcon = document.getElementById('buttonIcon');
const buttonText = document.getElementById('buttonText');

const originalBtnText = "Genererate"
const btnTxtSuccess = "Copied!"

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
                buttonIcon.style.visibility = "initial";

                if (err.message.includes("Document is not focused")) {
                    updateResponseDiv("Copy to clipboard failed. Browser needs to be in focus. Please try again.", 7000);
                } else {
                    updateResponseDiv(`Could not copy text: ${err.message}`);
                }
            });
            
        }
    });
}


function updateButtonText(text) {
    buttonIcon.style.visibility = "hidden";
    buttonText.display = "block";
    buttonText.textContent = text;
    setTimeout(() => {
        // scrapeButton.textContent = originalBtnText;
        buttonText.textContent = "";
        buttonIcon.style.visibility = "initial";
    }, 2000);
}


function updateResponseDiv(content, timeout = 5000) {
    responseDiv.style.display = "block";
    responseDiv.textContent = content;

    setTimeout(() => {
        responseDiv.style.display = "none";
        responseDiv.textContent = "";
    }, timeout);
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
        buttonIcon.style.visibility = "hidden";
        scrapeButton.classList.add('loading');
    }
    else {
        scrapeButton.classList.remove('loading');
    }
}


document.getElementById('copy').addEventListener('click', () => {
    if (latestResponse == "") {
        updateResponseDiv("Latest response cache is empty");
        return;
    }
    navigator.clipboard.writeText(latestResponse).then(() => {
        updateButtonText(btnTxtSuccess);
    }).catch(err => {
        if (err.message.includes("Document is not focused")) {
            updateResponseDiv("Copy to clipboard failed. Browser needs to be in focus. Please try again.");
        } else {
            updateResponseDiv(`Could not copy text: ${err.message}`);
        }
    });
});

document.getElementById('settings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
});