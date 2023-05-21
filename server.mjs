import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';
import cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(express.static(join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

const port = process.env.PORT || 3000;

app.use(cors());

app.get('/public/index.html', function (req, res) {
    res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.use((req, res, next) => {
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
    async onProxyRes(proxyRes, req, res) {
        let originalBody = await proxyRes.text();
        let $ = cheerio.load(originalBody, { xmlMode: true });

        const items = [];
        $('item').each((index, element) => {
            items.push({
                title: $(element).find('title').text(),
                link: $(element).find('link').text(),
                description: $(element).find('description').text()
            });
        });

        const data = {
            sourceName: $('channel > title').text(),
            sourceDescription: $('channel > description').text(),
            items
        };

        // Override original response
        res.json(data);
    }
}));

app.listen(port, () => {
    console.log(`Proxy server listening on port ${port}`);
});
