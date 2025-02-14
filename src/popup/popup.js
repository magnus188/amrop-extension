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
                if (chrome.runtime.lastError) {
                    console.log(chrome.runtime.lastError.message);
                    updateResponseDiv(`Something went wrong. Please refresh window and try again.`);
                    setLoadingState(false);
                    setIcon(true);


                    scrapeButton.disabled = false;
                    return;
                }
                if (resp && resp.experiences) {
                    processScrapedData(resp);
                }
            });
        });
    });
});

function setIcon(visible=true) {
    buttonIcon.style.display = visible ? "block" : "none";
    
}

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

            if (response.error.includes("resource has been exhausted")) {
                updateResponseDiv("Error: You have exceeded your quota or rate limit for the Gemini API.\nRemember: 15 request per minute for free tier!.");
            } else {
                updateResponseDiv(`Error: ${response.error}`);
            }
        } else {
            latestResponse = response.result;
            setLoadingState(false);
            navigator.clipboard.writeText(response.result).then(() => {
                updateButtonText(btnTxtSuccess);
            }).catch(err => {
                setIcon(true);
                if (err.message.includes("Document is not focused")) {
                    updateResponseDiv("Copy to clipboard failed. Browser needs to be in focus. Please try again.", 7000);
                } else {
                    updateResponseDiv(`Could not copy text: ${err.message}`);
                }
            });
        }
    });
}


function updateButtonText(text, timeout=3000) {
    setIcon(false);
    buttonText.display = "block";
    buttonText.textContent = text;
    setTimeout(() => {
        // scrapeButton.textContent = originalBtnText;
        buttonText.textContent = "";
        setIcon(true);

    }, timeout);
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
        setIcon(false);
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