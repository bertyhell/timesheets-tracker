const apiUrlInput = document.getElementById('api-url');
const saveButton = document.getElementById('save');
const statusDiv = document.getElementById('status');

chrome.storage.sync.get(['apiUrl'], (result) => {
  apiUrlInput.value = result.apiUrl || 'http://localhost:55577/api';
});

saveButton.addEventListener('click', () => {
  chrome.storage.sync.set({ apiUrl: apiUrlInput.value }, () => {
    statusDiv.textContent = 'Options saved.';
    setTimeout(() => {
      statusDiv.textContent = '';
    }, 2000);
  });
});
