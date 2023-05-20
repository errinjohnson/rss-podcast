import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import path from 'path';

const app = express();

app.use(express.static(path.join(process.cwd(), 'public'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

const port = process.env.PORT || 3000;

app.use(cors());

// Serve the index.html file
app.get('/', function (req, res) {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

app.use('/', (req, res, next) => {
    const targetUrl = req.query.url;
    if (targetUrl) {
        try {
            new URL(targetUrl);
            createProxyMiddleware({
                target: targetUrl, 
                changeOrigin: true,
                logLevel: 'debug',
                onProxyReq(proxyReq, req, res) {
                    proxyReq.setHeader('Referer', req.url);
                },
                onError: (err, req, res) => {
                    if (err && err.status) {
                        console.error('Error in proxy middleware:', err);
                        res.status(err.status).send('Internal Server Error');
                    } else if (err) {
                        console.error('Unknown error in proxy middleware:', err);
                        res.status(500).send('Unknown Error');
                    } else {
                        res.status(500).send('Unknown Error');
                    }
                },
                pathRewrite: (path, req) => {
                    const url = new URL(targetUrl);
                    return url.pathname + url.search + url.hash;
                },
            })(req, res, next);
        } catch (_) {
            // not a valid URL
            console.error(`Invalid URL provided: ${targetUrl}`);
            res.status(400).send('Invalid URL');
        }
    } else {
        // If no URL is provided, just send a 400 error.
        res.status(400).send('No URL provided');
    }
});

app.listen(port, () => {
    console.log(`Proxy server listening on port ${port}`);
});
