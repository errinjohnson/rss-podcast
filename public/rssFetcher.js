import cheerio from 'cheerio';

export default class RssFetcher {
    constructor(proxyUrl) {
        this.proxyServerUrl = proxyUrl;
    }

    async fetchWithTimeout(url, options, timeout = 60000) {
        let start = Date.now();

        const controller = new AbortController();
        const signal = controller.signal;
        const fetchOptions = { ...options, signal };

        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, fetchOptions);
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            const elapsed = Date.now() - start;
            if (error.name === "AbortError") {
                throw new Error(`Request timed out after ${elapsed}ms.`);
            } else {
                console.error('Fetch error:', error);
                throw error;
            }
        }
    }

    isValidRssOrXmlUrl(url) {
        // Check if the URL has an 'http' or 'https' scheme
        const urlRegex = /^https?:\/\/.+/i;
        if (!urlRegex.test(url)) {
            return false;
        }

        // Check if the URL ends with .rss, .xml, or has 'rss' or 'xml' as query parameters
        const rssXmlRegex = /\.(rss|xml|rss2)$|\?.*(rss|xml|rss2)/i;
        if (!rssXmlRegex.test(url)) {
            return false;
        }

        return true;
    }

    // async fetchData(feedUrl) {
    //     try {
    //         const response = await fetch(feedUrl);
    //         const data = await response.json();
    //         return data;
    //     } catch (error) {
    //         console.error('Error fetching podcast data:', error);
    //         throw error;
    //     }
    // }

    // parseDataPodCast(podcastData) {
    //     const parsedData = {
    //         title: podcastData.title,
    //         episodes: podcastData.episodes.map((episode) => ({
    //             title: episode.title,
    //             description: episode.description,
    //             audioUrl: episode.audioUrl,
    //             // Add more properties as needed
    //         })),
    //     };

    //     return parsedData;
    // }

   async fetchNewsData(url) {
    if (!url || typeof url !== "string" || !url.trim().length) {
        return;
    }
    const proxiedUrl = `${this.proxyServerUrl}?url=${encodeURIComponent(url)}`;
    console.log('Fetching URL:', proxiedUrl);

    try {
        const response = await this.fetchWithTimeout(proxiedUrl, {
            method: 'GET',
        }, 30000);
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.text();

        // load the data into cheerio
        const $ = cheerio.load(data, {
            xmlMode: true,
        });

        const items = $('item');
        const sourceName = $('channel > title').text();
        const sourceDescription = $('channel > description').text();

        return {
            items,
            sourceName,
            sourceDescription
        };
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

  async parseNewsData({ items }) {
    let parsedItems = [];
    items.each((index, element) => {
        const item = {
            title: $(element).find('title').text(),
            link: $(element).find('link').text(),
            description: $(element).find('description').text()
            // Add more properties as needed
        };
        parsedItems.push(item);
    });
    return parsedItems;
}

    // For parseNewsData method, since it uses DOM APIs (browser-specific), it would need 
    // a different approach for Node.js. You may want to use a library such as 'cheerio' 
    // to manipulate and traverse through the XML data.
}
