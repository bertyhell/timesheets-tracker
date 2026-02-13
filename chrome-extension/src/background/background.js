chrome.tabs.onUpdated.addListener((tabId, _changeInfo, _tab) => {
  getTabInfo(tabId);
});

chrome.tabs.onActivated.addListener((info) => {
  getTabInfo(info.tabId);
});

chrome.tabs.onHighlighted.addListener((info) => {
  getTabInfo(info.tabIds[0]);
});

async function getTabInfo(_tabId) {
  try {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tabs?.[0]?.url || !tabs?.[0]?.title) {
      return;
    }
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
