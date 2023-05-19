import RssFetcher from './rssFetcher.js';

const proxyServerUrl = 'https://walrus-app-gebas.ondigitalocean.app/';
const myRssFetcher = new RssFetcher(proxyServerUrl, DOMParser);

// Create an instance of RssFetcher
const rssFetcher = new RssFetcher();
const rssSubmitButton = document.getElementById('rss-submit');
const rssInput = document.getElementById('rss-input');


rssSubmitButton.addEventListener('click', function() {
    const rssInputValue = rssInput.value;
    const rssFeedUrls = JSON.parse(localStorage.getItem('rssFeedUrls')) || [];

    const existingFeed = rssFeedUrls.find(feed => feed.url === rssInputValue);

    if (existingFeed) {
        console.log("URL already exists");
        return;
    }
    let newsFeed = { url: rssInputValue };
    rssFeedUrls.push(newsFeed);
    localStorage.setItem('rssFeedUrls', JSON.stringify(rssFeedUrls));

    validateAndFetchNewsData(rssInputValue)
        .then(newsData => {
            newsFeed.sourceName = newsData.sourceName;
            localStorage.setItem('rssFeedUrls', JSON.stringify(rssFeedUrls));
            updateUrlList(newsFeed);
        })
        .catch(error => console.error('Error:', error));
});


document.getElementById('fetch-news-button').addEventListener('click', async () => {
    try {
        await fetchAllNewsData();
    } catch (error) {
        console.error('Error fetching news:', error);
    }
});

const showInstructionsButton = document.getElementById('show-instructions');
const instructions = document.getElementById('instructions');

showInstructionsButton.addEventListener('click', function() {
    instructions.style.display = instructions.style.display === 'none' ? 'block' : 'none';
});

const toggleUrlListButton = document.getElementById('toggle-url-list');
const urlListContainer = document.getElementById('url-list-container');

toggleUrlListButton.addEventListener('click', function() {
    urlListContainer.parentElement.style.display = urlListContainer.parentElement.style.display === 'none' ? 'block' : 'none';
});

function updateUrlList(newsFeed = {}) {
    const sourceName = newsFeed.sourceName ? newsFeed.sourceName : newsFeed.url;

    // Check if a list item for this newsFeed already exists
    const existingListItem = Array.from(urlListContainer.children).find(
        (child) => child.querySelector('span').textContent === sourceName
    );

    if (existingListItem) {
        // If it exists, don't create a new one
        console.log("List item for this URL already exists");
        return;
    }

    // If it doesn't exist, create a new list item
    const listItem = document.createElement('li');
    const sourceNameSpan = document.createElement('span');
    sourceNameSpan.textContent = sourceName;
    listItem.appendChild(sourceNameSpan);

    const removeButton = document.createElement('button');
    removeButton.classList.add('btn-primary');
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', function() {
        const rssFeedUrls = JSON.parse(localStorage.getItem('rssFeedUrls')) || [];
        const index = rssFeedUrls.findIndex(f => f.url === newsFeed.url);
        if (index > -1) {
            rssFeedUrls.splice(index, 1);
            localStorage.setItem('rssFeedUrls', JSON.stringify(rssFeedUrls));
            listItem.remove();
        }
    });

    const titleOrUrlText = document.createTextNode(` (${newsFeed.title || newsFeed.url})`);
    listItem.appendChild(titleOrUrlText);

    listItem.appendChild(removeButton);
    urlListContainer.appendChild(listItem);
}



function handleFetchNewsError(feed, error) {
    console.error(`Error fetching news data for URL: ${feed.url}. Error:`, error);
}

function fetchAllNewsData() {
    const rssFeedUrls = JSON.parse(localStorage.getItem('rssFeedUrls')) || [];

    if (rssFeedUrls.length > 0) {
        rssFeedUrls.forEach(feed => {
            myRssFetcher.fetchNewsData(feed.url) 
                .then(newsData => {
                    console.log('newsData:', newsData);
                    return myRssFetcher.parseNewsData(newsData);
                })
                .then(parsedData => {
                    console.log('parsedData:', parsedData);
                    const newsFeed = {
                        url: feed.url,
                        sourceName: parsedData.sourceName
                    };
                    updateUrlList(newsFeed);
                })
                .catch(error => handleFetchNewsError(feed, error));
        });
    } else {
        console.log('No URLs to fetch');
    }
}

document.addEventListener("DOMContentLoaded", function () {
  const rssFeedForm = document.getElementById("rssFeedForm");
  const rssFeedUrls = document.getElementById("rssFeedUrls");
  const rssFeedList = document.getElementById("rssFeedList");
  const saveRssFeedUrls = document.getElementById("saveRssFeedUrls");

  // Load stored URLs
  loadUrls();

// Save button listener
saveRssFeedUrls.addEventListener("click", function () {
  const newUrls = rssFeedUrls.value.split("\n").filter((url) => url.trim() !== "");
  const storedUrls = JSON.parse(localStorage.getItem("backupUrlList")) || [];
  const combinedUrls = [...storedUrls, ...newUrls];

  saveUrls(combinedUrls);
  loadUrls();

  // Clear the textarea
  rssFeedUrls.value = "";
});


  function saveUrls(urls) {
    localStorage.setItem("backupUrlList", JSON.stringify(urls));
  }

  function loadUrls() {
    const storedUrls = JSON.parse(localStorage.getItem("backupUrlList")) || [];

    // Clear the list first
    rssFeedList.innerHTML = "";

    // Populate the list with stored URLs
    storedUrls.forEach((url) => {
      const li = document.createElement("li");
      li.classList.add("list-group-item");
      li.textContent = url;

      // Add remove button for each URL
      const removeBtn = document.createElement("button");
      removeBtn.classList.add("btn", "btn-sm", "btn-danger", "float-end");
      removeBtn.textContent = "Remove";
      removeBtn.addEventListener("click", function () {
        removeUrl(url);
      });

      li.appendChild(removeBtn);
      rssFeedList.appendChild(li);
    });
  }

  function removeUrl(urlToRemove) {
    const storedUrls = JSON.parse(localStorage.getItem("backupUrlList")) || [];
    const updatedUrls = storedUrls.filter((url) => url !== urlToRemove);

    saveUrls(updatedUrls);
    loadUrls();
  }
});

const resetLocalStorage = document.getElementById("resetLocalStorage");

// Reset button listener
resetLocalStorage.addEventListener("click", function () {
  const confirmed = confirm("Are you sure you want to reset the RSS Feed URLs? This action cannot be undone.");

  if (confirmed) {
    localStorage.removeItem("rssFeedUrls");
    alert("The RSS Feed URLs have been reset.");
  }
});
async function validateAndFetchNewsData(url) {
    if (!url || typeof url !== "string" || !url.trim().length || !myRssFetcher.isValidRssOrXmlUrl(url)) {
        throw new Error('Invalid or empty "url" query parameter, or not an RSS/XML feed URL.');
    }
    return myRssFetcher.fetchNewsData(url);
}

document.getElementById('shareByEmail').addEventListener('click', function() {
    const urls = JSON.parse(localStorage.getItem('backupUrlList')) || [];

    if (urls.length === 0) {
        alert('No URLs to share');
        return;
    }

    const emailSubject = 'My RSS Feed URLs';
    const emailBody = urls.join('\n');
    const emailUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(emailUrl);
});


// podcast script starts hre

// Add event listener to the podcast search button
const podcastSearchButton = document.getElementById('podcast-search-button');
const podcastSearchInput = document.getElementById('podcast-search-input');
const podcastSearchResults = document.getElementById('podcast-search-results');
const podcastList = document.getElementById('podcast-list');

podcastSearchButton.addEventListener('click', async (e) => {
    e.preventDefault();

    const searchTerm = podcastSearchInput.value.trim();
    if (searchTerm === '') {
        return;
    }

    try {
        // Clear previous search results
        podcastSearchResults.innerHTML = '';
        podcastList.innerHTML = '';

        // Perform podcast search
        const podcasts = await searchPodcasts(searchTerm);

        if (podcasts.length > 0) {
            // Display search results
            displayPodcastSearchResults(podcasts);
        } else {
            // Display "No results" message
            displayNoResultsMessage();
        }
    } catch (error) {
        console.error('Error searching podcasts:', error);
    }
});

async function searchPodcasts(searchTerm) {
  const term = encodeURIComponent(searchTerm); // URL-encode the search term
  const country = 'US'; // Specify the country code, e.g., 'US' for the United States
  const proxyUrl = 'https://squid-app-i75i8.ondigitalocean.app/';

  const itunesUrl = `https://itunes.apple.com/search?term=${term}&country=${country}`;
  const url = `${proxyUrl}?url=${encodeURIComponent(itunesUrl)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      // Process the search results
      return data.results.map((result) => {
        // Extract relevant information from the result
        return {
          title: result.trackName,
          artist: result.artistName,
          artwork: result.artworkUrl100,
          feedUrl: result.feedUrl,
          fullEpisodes: result.trackCount > 0
        };
      });
    } else {
      // No results found
      return [];
    }
  } catch (error) {
    console.error('Error searching podcasts:', error);
    throw error;
  }
}
function displayPodcastSearchResults(podcasts) {
  // Display the search results in the podcast search results container
  // You can customize this function to create HTML elements based on the podcast data
  podcasts.forEach((podcast) => {
    const resultItem = document.createElement('div');

    // Create the podcast information
    const title = document.createElement('h3');
    title.textContent = podcast.title;
    const artist = document.createElement('p');
    artist.textContent = `Artist: ${podcast.artist}`;
    const artwork = document.createElement('img');
    artwork.src = podcast.artwork;

    // Create the play button
    const playButton = document.createElement('button');
    playButton.textContent = 'Play';
    playButton.addEventListener('click', () => {
      playPodcast(podcast);
    });

    // Append elements to the result item
    resultItem.appendChild(title);
    resultItem.appendChild(artist);
    resultItem.appendChild(artwork);
    resultItem.appendChild(playButton);

    playButton.addEventListener('click', () => {
  playPodcast(podcast, rssFetcher);
});

    podcastSearchResults.appendChild(resultItem);
  });

  // Show the podcast search results container
  podcastSearchResults.classList.remove('d-none');
}
function displayNoResultsMessage() {
    // Display a "No results" message in the podcast search results container
    const message = document.createElement('div');
    message.textContent = 'No results found.';
    podcastSearchResults.appendChild(message);

    // Show the podcast search results container
    podcastSearchResults.classList.remove('d-none');
}
// // Update the click event listener for the play button


// Update the function name and parameters
async function playPodcast(podcast, rssFetcher) {
  // Update the UI to show the selected podcast
  const podcastList = document.getElementById('podcast-list');
  podcastList.innerHTML = '';

  const podcastTitle = document.createElement('h2');
  podcastTitle.textContent = podcast.title;
  podcastList.appendChild(podcastTitle);

  const podcastEpisodes = document.createElement('ul');
  podcastList.appendChild(podcastEpisodes);

  // Fetch the podcast feed and parse the episodes
  const feedUrl = podcast.feedUrl;

  try {
    const podcastData = await rssFetcher.fetchData(feedUrl);
    const parsedData = rssFetcher.parseData(podcastData);

    parsedData.episodes.forEach((episode) => {
      const episodeItem = document.createElement('li');
      const episodeLinkElem = document.createElement('a');
      episodeLinkElem.textContent = episode.title;
      episodeLinkElem.href = episode.audioUrl;
      episodeLinkElem.target = '_blank';
      episodeItem.appendChild(episodeLinkElem);

      podcastEpisodes.appendChild(episodeItem);
    });
  } catch (error) {
    console.error('Error fetching podcast episodes:', error);
  }
}




