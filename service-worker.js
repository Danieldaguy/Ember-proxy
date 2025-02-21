self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Redirect root to a proxy interface (if needed)
    if (url.pathname === '/') {
        return event.respondWith(new Response(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Proxy Service</title>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body>
                    <h1>Enter a URL to Proxy</h1>
                    <form action="/service/" method="GET">
                        <input type="text" name="url" placeholder="https://example.com" required>
                        <button type="submit">Go</button>
                    </form>
                </body>
            </html>
        `, { headers: { 'Content-Type': 'text/html' } }));
    }

    // Handle proxy requests
    if (url.pathname.startsWith('/service/')) {
        let targetUrl;
        try {
            targetUrl = decodeURIComponent(url.searchParams.get('url') || url.pathname.replace('/service/', ''));
            if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;
            new URL(targetUrl); // Validate URL
        } catch {
            return event.respondWith(new Response('Invalid URL', { status: 400 }));
        }

        event.respondWith(proxyRequest(targetUrl, event.request));
        return;
    }

    event.respondWith(new Response('Not Found', { status: 404 }));
});

// Proxy Request Handler
async function proxyRequest(targetUrl, originalRequest) {
    try {
        const response = await fetch(targetUrl, {
            method: originalRequest.method,
            headers: buildHeaders(originalRequest.headers, targetUrl),
            body: ['GET', 'HEAD'].includes(originalRequest.method) ? null : await originalRequest.clone().blob(),
            redirect: 'follow'
        });

        const contentType = response.headers.get('Content-Type') || '';
        let body = await response.text();

        // Modify content to ensure proper routing through proxy
        if (contentType.includes('text/html')) {
            body = body.replace(/(href|src|action)="(https?:\/\/[^"]+)"/g, (match, attr, link) => {
                return `${attr}="/service/?url=${encodeURIComponent(link)}"`;
            });
        }

        return new Response(body, {
            status: response.status,
            headers: response.headers
        });

    } catch (error) {
        return new Response('Error: ' + error.message, { status: 500 });
    }
}

// Build Proxy Headers
function buildHeaders(originalHeaders, targetUrl) {
    const headers = new Headers(originalHeaders);
    headers.set('Referer', new URL(targetUrl).origin);
    headers.set('Origin', new URL(targetUrl).origin);
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    return headers;
}
