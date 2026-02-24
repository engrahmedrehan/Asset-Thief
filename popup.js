const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const statusText = document.getElementById('status-text');
const scannedCount = document.getElementById('scanned-count');
const queuedCount = document.getElementById('queued-count');

function updateUI() {
  chrome.runtime.sendMessage({ action: "getStatus" }, (response) => {
    if (!response) return;
    
    if (response.isCrawling) {
      statusText.textContent = "EXTRACTING...";
      statusText.className = "active";
      startBtn.disabled = true;
    } else {
      statusText.textContent = "IDLE";
      statusText.className = "idle";
      startBtn.disabled = false;
    }
    
    scannedCount.textContent = response.scanned;
    queuedCount.textContent = response.queued;
  });
}

startBtn.addEventListener('click', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url) {
    chrome.runtime.sendMessage({ action: "startCrawl", startUrl: tab.url });
    updateUI();
  }
});

stopBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: "stopCrawl" });
  statusText.textContent = "ZIPPING...";
  statusText.style.color = "#FFD700";
  statusText.style.animation = "none";
  setTimeout(updateUI, 3000); 
});

// Sync the UI every 500ms
setInterval(updateUI, 500);
updateUI();