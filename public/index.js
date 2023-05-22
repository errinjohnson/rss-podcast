import RssFetcher from './rssFetcher.js';

const proxyServerUrl = 'https://seahorse-app-ajw5j.ondigitalocean.app/';
const myRssFetcher = new RssFetcher(proxyServerUrl);


const rssSubmitButton = document.getElementById('rss-submit');
const rssInput = document.getElementById('rss-input');

rssSubmitButton.addEventListener('click', function () {
  const rssInputValue = rssInput.value;
  if (rssInputValue == '') {
    return;
  }
  
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

  const existingListItem = Array.from(urlListContainer.children).find(
    (child) => child.querySelector('span').textContent === sourceName
  );

  if (existingListItem) {
    console.log("List item for this URL already exists");
    return;
  }

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
  console.log("fetchAllNewsData: from rssFeedUrls",rssFeedUrls);
    if (rssFeedUrls.length > 0) {
        rssFeedUrls.forEach(feed => {
            myRssFetcher.fetchNewsData(feed.url) 
                .then(newsData => {
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
    if (!url ){
        throw new Error('Invalid or empty "url" query parameter, or not an RSS/XML feed URL.');
  }
  console.log("myRssFetcher.fetchNewsData(url)", myRssFetcher.fetchNewsData(url));

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





