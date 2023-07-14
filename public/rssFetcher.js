import axios from 'axios';
import xml2js from 'xml2js';

export default class RssFetcher {
  constructor(proxyUrl) {
    this.proxyServerUrl = proxyUrl;
    this.parser = new xml2js.Parser();
  }

  isValidRssOrXmlUrl(url) {
    const urlRegex = /^https?:\/\/.+/i;
    if (!urlRegex.test(url)) {
      return false;
    }

    const rssXmlRegex = /\.(rss|xml|rss2)$|\?.*(rss|xml|rss2)/i;
    if (!rssXmlRegex.test(url)) {
      return false;
    }

    return true;
  }

  async fetchNewsData(url) {
  if (!url || typeof url !== "string" || !url.trim().length) {
    return;
  }

  const proxiedUrl = `${this.proxyServerUrl}?url=${encodeURIComponent(url)}`;
  console.log('Fetching URL:', proxiedUrl);

  try {
    const response = await axios.get(proxiedUrl);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const responseText = response.data;
    console.log('Response text:', responseText);

    // Parse XML to JavaScript Object
    const data = parser.parse(responseText);
    
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}


  async parseNewsData(data) {
    return data.items.map(item => {
      return {
        title: item.title,
        link: item.link,
        description: item.description,
        // Add more properties as needed
      };
    });
  }
}
