function saveOptions() {
  const serverUrlInput = document.getElementById('serverUrlInput');
  const includeFigmaScreenLinkCheckbox = document.getElementById('includeFigmaScreenLink');

  chrome.storage.local.set(
    {
      serverUrl: serverUrlInput?.value,
      includeFigmaScreenLink: includeFigmaScreenLinkCheckbox.checked,
    },
    () => {
      // Update status to let user know options were saved.
      const button = document.getElementById('saveOptionsButton');
      button.textContent = 'Saved successfully';
      setTimeout(() => {
        button.textContent = 'Save';
      }, 750);
    }
  );
}

const restoreOptions = () => {
  chrome.storage.local.get({ serverUrl: '', includeFigmaScreenLink: false }, (options) => {
    document.getElementById('serverUrlInput').value = options.serverUrl;
    document.getElementById('includeFigmaScreenLink').checked = options.includeFigmaScreenLink;
  });
};

document.addEventListener('DOMContentLoaded', () => {
  restoreOptions();
  document.getElementById('saveOptionsButton').addEventListener('click', saveOptions);
});
