export default class RssFetcher {
    constructor(proxyUrl, parser) {
        this.proxyServerUrl = proxyUrl;
        this.DOMParser = parser;
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
    async fetchData(feedUrl) {
        try {
            const response = await fetch(feedUrl);
            const data = await response.json();
            return data;
     } catch (error) {
      console.error('Error fetching podcast data:', error);
     throw error;
     }
    }

parseData(podcastData) {
 
  const parsedData = {
      title: podcastData.title,
      episodes: podcastData.episodes.map((episode) => ({
      title: episode.title,
      description: episode.description,
      audioUrl: episode.audioUrl,
      // Add more properties as needed
    })),
  };

  return parsedData;
}

    fetchNewsData(url) {
    if (!url || typeof url !== "string" || !url.trim().length) {
        return;
    }
    const proxiedUrl = `${this.proxyServerUrl}?url=${encodeURIComponent(url)}`;
    console.log('Fetching URL:', proxiedUrl);

    return this.fetchWithTimeout(proxiedUrl, {
        method: 'GET',
    }, 30000)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
    const parser = new DOMParser();
    const xml = parser.parseFromString(data, 'application/xml');
    const items = xml.querySelectorAll('item');
    const sourceName = xml.querySelector('channel > title').textContent;
            const sourceDescription = xml.querySelector('channel > description').textContent;
            return {
        items,
        sourceName,
        sourceDescription
        };
});

}

parseNewsData({
        items,
        sourceName
    }) {
        const sourceList = document.createElement('div');
        sourceList.classList.add('row');

        const sourceHeading = document.createElement('h2');
        sourceHeading.textContent = sourceName;
        sourceHeading.setAttribute('id', sourceName);
        sourceList.appendChild(sourceHeading);

        const buttonContainer = document.getElementById('news-buttons');

        const existingButton = Array.from(buttonContainer.children).find(
            (child) => child.getAttribute('data-target') === sourceName
        );

        if (!existingButton) {
            const button = document.createElement('button');
            button.setAttribute('data-target', sourceName);
            button.classList.add('btn-primary'); // Bootstrap classes here
            button.classList.add('scroll-btn');
            button.textContent = sourceName;
            buttonContainer.appendChild(button);

            button.addEventListener('click', () => {
                const targetId = button.dataset.target;
                document.getElementById(targetId).scrollIntoView({
                    behavior: 'smooth',
                });
            });
        }

        sourceHeading.addEventListener('mouseover', () => {
            sourceHeading.style.backgroundColor = ' ';
        });

        sourceHeading.addEventListener('mouseout', () => {
            sourceHeading.style.backgroundColor = '';
        });

        sourceHeading.addEventListener('click', () => {
            document.querySelector('#top').scrollIntoView({
                behavior: 'smooth',
            });
        });

        const addItemsPromise = Array.from(items).map((item) => {
            const link = item.querySelector('link');
            const title = item.querySelector('title');
            const description = item.querySelector('description');
            const enclosure = item.querySelector('enclosure');
            const mediaContent = item.querySelector('media\\:content, content');

            if (!link && !description && !title) {
                return null;
            }

            const linkText = link.textContent;
            const existingItem = sourceList.querySelector(`a[href="${linkText}"]`);

            if (existingItem) {
                existingItem.parentNode.querySelector('h2').textContent = sourceName;
                 existingItem.textContent = title.textContent;
                 existingItem.parentNode.querySelector('p').textContent = description.textContent;
             } else {
                 const colDiv = document.createElement('div');
                 colDiv.classList.add('col-md-6', 'mb-3');
                 colDiv.innerHTML = `<div class="card"> ${mediaContent ? `<img src="${mediaContent.getAttribute('url')}" class="img-fluid rounded alt="Card image cap">` : (enclosure ? `<img src="${enclosure.getAttribute('url')}" class="img-fluid rounded" alt="Card image cap">` : '')}<div class="card-body"><h5 class="card-title"><a href="${linkText}" target="_blank">${title.textContent}</a></h5><p class="card-text">${description.textContent}</p>
            </div></div>`;
                 sourceList.appendChild(colDiv);

             }

             return Promise.resolve();
         });
          return Promise.allSettled(addItemsPromise)
        .then(() => {
            const newsContainer = document.querySelector('.news-container');
            const currentSourceList = Array.from(newsContainer.children).find(
                (child) =>
                child.querySelector('h2') &&
                child.querySelector('h2').textContent === sourceName
            );
            if (currentSourceList) {
                newsContainer.replaceChild(sourceList, currentSourceList);
            } else {
                newsContainer.appendChild(sourceList);
            }
            return {
                items,
                sourceName
            };
        })
        .catch(error => {
            console.error('Error fetching news:', error.message);
        });
    }
}