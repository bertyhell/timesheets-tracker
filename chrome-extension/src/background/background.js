// onUpdated/onActivated/onHighlighted all fire independently for a single tab switch or
// navigation, so debounce them into one lookup and skip re-sending the site we already
// reported, otherwise the API ends up with several near-duplicate, overlapping entries
// for the same visit.
const DEBOUNCE_MS = 500;

let debounceTimer = null;
let lastSentUrl = null;

chrome.tabs.onUpdated.addListener(() => {
  scheduleGetTabInfo();
});

chrome.tabs.onActivated.addListener(() => {
  scheduleGetTabInfo();
});

chrome.tabs.onHighlighted.addListener(() => {
  scheduleGetTabInfo();
});

function scheduleGetTabInfo() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(getTabInfo, DEBOUNCE_MS);
}

async function getTabInfo() {
  try {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tabs?.[0]?.url || !tabs?.[0]?.title) {
      return;
    }
    if (tabs[0].url === lastSentUrl) {
      // Already tracking this site, nothing actually changed
      return;
    }
    lastSentUrl = tabs[0].url;

    const headers = new Headers({
      'Content-Type': 'application/json',
    });
    await fetch('http://localhost:55577/api/websites', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        websiteTitle: tabs[0].title,
        websiteUrl: tabs[0].url,
        startedAt: new Date().toISOString(),
      }),
    });
    // console.log({url: tabs[0].url, title: tabs[0].title});
  } catch (err) {
    console.error(err);
  }
}
