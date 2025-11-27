chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchAbstract") {
        console.log("Background fetching:", request.url);
        fetch(request.url, {
            credentials: 'include',
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Upgrade-Insecure-Requests': '1',
                'User-Agent': navigator.userAgent
            }
        })
            .then(response => {
                console.log("Fetch response status:", response.status);
                return response.text();
            })
            .then(text => {
                console.log("Fetch successful, text length:", text.length);
                sendResponse({ success: true, html: text });
            })
            .catch(error => {
                console.error("Fetch error:", error);
                sendResponse({ success: false, error: error.message });
            });
        return true; // Keep the message channel open for async response
    }
});
