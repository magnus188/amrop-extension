latestResponse = "";

scrapeButton = document.getElementById('scrapeButton');
responseDiv = document.getElementById('response');

originalBtnText = "Genererate"
btnTxtSuccess = "Copied!"


document.getElementById('scrapeButton').addEventListener('click', () => {
    setLoadingState()
    isValidUrl((isValid) => {
        if (!isValid) {
            setLoadingState(false)
            return;
        }

        scrapeButton.disabled = true;
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: "scrapeProfile" }, (resp) => {
                chrome.runtime.sendMessage({ type: 'SEND_PROMPT', resp }, (response) => {
                    scrapeButton.disabled = false;
                    if (response.error) {
                        setLoadingState(false)
                        responseDiv.innerText = `Error: ${response.error}`;
                    } else {
                        // For clipboard
                        latestResponse = response.result
                        setLoadingState(false)
                        navigator.clipboard.writeText(response.result).then(() => {                            
                            scrapeButton.textContent = btnTxtSuccess
                            setTimeout(() => {
                                scrapeButton.textContent = originalBtnText;
                            }, 2000);
                        }).catch(err => {
                            console.error('Could not copy text: ', err);
                        });
                        /* updateResponseDiv(response.result) */
                    }
                });
            });
        });
    });
});


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