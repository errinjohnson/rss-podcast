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

app.use('/', createProxyMiddleware({
    target: 'https://walrus-app-gebas.ondigitalocean.app/', // default target
    changeOrigin: true,
    logLevel: 'debug',
    onProxyReq(proxyReq, req, res) {
        proxyReq.setHeader('Referer', req.url);
    },
    router: (req) => {
        const targetUrl = req.query.url;
        if (targetUrl) {
            try {
                new URL(targetUrl);
                return targetUrl;
            } catch (_) {
                // not a valid URL
                console.error(`Invalid URL provided: ${targetUrl}`);
            }
        }
        // if no valid url is provided, fall back to the default target
        return 'https://walrus-app-gebas.ondigitalocean.app/';
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
        const targetUrl = req.query.url;
        if (!targetUrl) {
            return path;
        }
        const url = new URL(targetUrl);
        return url.pathname + url.search + url.hash;
    },
}));

app.listen(port, () => {
    console.log(`Proxy server listening on port ${port}`);
});
