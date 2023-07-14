const express = require('express');
const axios = require('axios'); // Used to fetch data from external URLs
const cors = require('cors'); // To bypass CORS restrictions

const app = express();

// Use express.static middleware to serve static files, such as your scripts, css files, and images.
app.use(express.static('public'));

// Set up the proxy endpoint
app.get('/proxy', cors(), async (req, res) => {
    const url = req.query.url;
    try {
        const response = await axios.get(url);
        res.send(response.data);
    } catch (error) {
        res.status(500).send({ message: `Error fetching data from URL: ${url}`, error });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
