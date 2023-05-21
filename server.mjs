import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();  // Initialization of 'app'

app.use(express.static(join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

const port = process.env.PORT || 3000;

app.use(cors());

// Serve the index html file
app.get('/public/index.html', function (req, res) {
    res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.use((req, res, next) => {
    // Set CORS headers for every response
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/', createProxyMiddleware({
    changeOrigin: true,
    logLevel: 'debug',
    onProxyReq(proxyReq, req, res) {
        proxyReq.setHeader('Referer', req.url);
    },
    onProxyRes(proxyRes, req, res) {
        const setCookie = proxyRes.headers['set-cookie'];
        if (setCookie) {
            const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
            cookies.forEach((cookie) => {
                res.setHeader('Set-Cookie', cookie + '; domain=.https://cloud.digitalocean.com; HttpOnly; Secure; SameSite=None');
            });
        }
    },
    router: (req) => {
        const targetUrl = req.query.url;
        console.log('Target URL:', targetUrl); 
        if (!targetUrl) {
            return null;
        }
        try {
            new URL(targetUrl);
        } catch (_) {
            return null;
        }
        return targetUrl;
    },
    onError: (err, req, res) => {
        console.error('Error in proxy middleware:', err);
        res.status(500).send(`Internal Server Error: ${err.message}`);
    },
    pathRewrite: (path, req) => {
        const url = new URL(req.query.url)
        console.log(url);
        return url.pathname + url.search;
    },
}));

app.listen(port, () => {
    console.log(`Proxy server listening on port ${port}`);
});
