if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(reg => console.log('Service Worker registered!', reg))
        .catch(err => console.error('Service Worker registration failed:', err));
}

function startProxy() {
    const urlInput = document.getElementById("urlInput").value.trim();
    if (urlInput) {
        let proxyUrl = `/service/${encodeURIComponent(urlInput)}`;
        window.location.href = proxyUrl;
    } else {
        alert("Please enter a valid URL.");
    }
}
