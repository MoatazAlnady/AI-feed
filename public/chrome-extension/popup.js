const APP_URL = 'https://lovable-platform-boost.lovable.app';

// Show current tab URL
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const url = tabs[0]?.url || '';
  document.getElementById('current-url').textContent = url;
});

// Submit button handler
document.getElementById('submit-btn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0]?.url;
    if (url) {
      chrome.tabs.create({
        url: `${APP_URL}/submit-tool?url=${encodeURIComponent(url)}`
      });
      window.close();
    }
  });
});
