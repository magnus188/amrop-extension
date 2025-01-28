chrome.runtime.onInstalled.addListener(() => {
    console.log('LinkedIn Scraper Extension Installed.');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scrapedData") {
        const finalData = request.data;
        console.log("Got final data in background:", finalData);
        // e.g. call your LLM API here

        sendResponse({ status: "LLM started" });
        return true; // If your LLM call is async
    }
});