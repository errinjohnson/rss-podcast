import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import path from 'path';


const app = express();

app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

const port = process.env.PORT || 3000;

app.use(cors());

// Serve the index.html file
app.get('/public/index.html', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use('/', createProxyMiddleware({
    changeOrigin: true,
    logLevel: 'debug',
    onProxyReq(proxyReq, req, res) {
        proxyReq.setHeader('Referer', req.url);
    },
    onProxyRes(proxyRes, req, res) {
        // set cors headers in the response from the target server
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        const setCookie = proxyRes.headers['set-cookie'];
        if (setCookie) {
            const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
            cookies.forEach((cookie) => {
                res.setHeader('Set-Cookie', cookie + '; domain=digitalocean.com; HttpOnly; Secure; SameSite=None');
            });
        }
    },
    router: (req) => {
        const targetUrl = req.query.url;
        if (!targetUrl) {
            return null;
        }
        return targetUrl;
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
  return url.pathname;
},

}));

app.listen(port, () => {
    console.log(`Proxy server listening on port ${port}`);
});