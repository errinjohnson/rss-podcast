export default class RssFetcher {
  constructor(proxyUrl) {
    this.proxyServerUrl = proxyUrl;
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
      const response = await fetch(proxiedUrl);
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();

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
