importScripts('lib/jszip.min.js');

let isCrawling = false;
let visitedUrls = new Set();
let urlQueue = [];
let zip = null;
let rootDomain = "";

// 15MB limit to prevent Service Worker memory crashes on large videos
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; 

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startCrawl") {
    startCrawl(request.startUrl);
    sendResponse({ status: "started" });
  } else if (request.action === "stopCrawl") {
    stopCrawlAndDownload();
    sendResponse({ status: "stopped" });
  } else if (request.action === "getStatus") {
    sendResponse({ isCrawling, scanned: visitedUrls.size, queued: urlQueue.length });
  }
  return true;
});

async function startCrawl(startUrl) {
  if (isCrawling) return;
  isCrawling = true;
  visitedUrls.clear();
  urlQueue = [startUrl];
  zip = new JSZip();
  rootDomain = new URL(startUrl).hostname;
  processQueue();
}

async function processQueue() {
  if (!isCrawling) return;
  if (urlQueue.length === 0) {
    await stopCrawlAndDownload();
    return;
  }

  const currentUrl = urlQueue.shift();
  if (visitedUrls.has(currentUrl)) {
    setTimeout(processQueue, 10); 
    return;
  }
  visitedUrls.add(currentUrl);

  try {
    // 1. Check file size before full download
    const headResponse = await fetch(currentUrl, { method: 'HEAD' });
    const contentLength = headResponse.headers.get('content-length');
    
    if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE_BYTES) {
      console.warn(`Skipping massive file: ${currentUrl}`);
      setTimeout(processQueue, 50);
      return;
    }

    // 2. Fetch payload
    const response = await fetch(currentUrl);
    const contentType = response.headers.get('content-type') || '';
    
    const isBinary = contentType.match(/(image|video|audio|font|octet-stream)/i);
    const fileData = isBinary ? await response.arrayBuffer() : await response.text();

    // 3. Build ZIP file path
    let urlObj = new URL(currentUrl);
    let zipPath = "";

    // If it's from the main domain, keep structure. If from a CDN, put in external_assets/
    if (urlObj.hostname === rootDomain) {
      zipPath = urlObj.pathname;
    } else {
      zipPath = `external_assets/${urlObj.hostname}${urlObj.pathname}`;
    }

    // Fix trailing slashes and missing extensions
    if (zipPath.endsWith('/') || zipPath === "") zipPath += "index.html";
    if (!isBinary && !zipPath.match(/\.[a-zA-Z0-9]+$/)) zipPath += ".html";
    zipPath = zipPath.replace(/^\/+/, ""); 

    // 4. Save to ZIP
    zip.file(zipPath, fileData, { binary: !!isBinary });

    // 5. If it's an HTML or CSS file, look for more links
    if (!isBinary) {
      const assetRegex = /(?:href|src)=["']([^"']+)["']/gi;
      let match;
      
      while ((match = assetRegex.exec(fileData)) !== null) {
        let link = match[1];
        if (link.match(/^(data:|mailto:|tel:|#)/)) continue;

        try {
          let absoluteUrl = new URL(link, currentUrl).href;
          let linkObj = new URL(absoluteUrl);
          
          // Is it an asset (image, css, js) or a webpage?
          const isAsset = absoluteUrl.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|mp4|webm)$/i);
          
          // Rule: Queue if it's an asset (from ANY domain), OR if it's a webpage from the ROOT domain
          if (isAsset || linkObj.hostname === rootDomain) {
            let cleanUrl = linkObj.origin + linkObj.pathname + linkObj.search;
            if (!visitedUrls.has(cleanUrl) && !urlQueue.includes(cleanUrl)) {
              urlQueue.push(cleanUrl);
            }
          }
        } catch (e) { /* Ignore bad URLs */ }
      }
    }
  } catch (error) {
    console.error(`Failed to scrape ${currentUrl}`, error);
  }

  // 150ms throttle to prevent IP bans and memory leaks
  setTimeout(processQueue, 150); 
}

async function stopCrawlAndDownload() {
  isCrawling = false;
  if (!zip) return;

  const content = await zip.generateAsync({ type: "blob", compression: "STORE" });
  
  const reader = new FileReader();
  reader.onloadend = function() {
    chrome.downloads.download({
      url: reader.result,
      filename: `${rootDomain}_full_rip.zip`,
      saveAs: true
    });
  };
  reader.readAsDataURL(content);
  zip = null;
}