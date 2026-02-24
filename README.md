# SVGs and IMGs Downloader

A high-performance Chrome extension (Manifest V3) designed to streamline asset collection for designers and developers. "SVGs and IMGs" automatically scans active browser tabs to identify embedded visual elements, including inline SVGs and standard image files.

## 🚀 Key Features
- **Comprehensive Detection**: Scans for all `<img>` tags and inline `<svg>` elements on the current page.
- **Visual Gallery**: Preview all discovered assets in a clean grid within the extension popup before downloading.
- **One-Click Export**: Quickly save individual icons or high-resolution images to your local machine.
- **Privacy Focused**: Uses the `activeTab` permission model, meaning it only runs when you explicitly click the extension icon.
- **Built for Modern Browsers**: Fully compliant with Chrome's Manifest V3 standards for improved security and performance.

## 🛠 Installation (Development Mode)
Since this extension is in development, you can load it locally:
1. Clone this repository or download the source code as a `.zip`.
2. Extract the files to a local folder.
3. Open Google Chrome and navigate to `chrome://extensions/`.
4. Enable **Developer mode** using the toggle in the top-right corner.
5. Click **Load unpacked** and select the folder containing the `manifest.json` file.

## 📖 How to Use
1. Visit any website containing the graphics you want to collect.
2. Click the **SVGs and IMGs** icon in your browser toolbar.
3. Browse the gallery of detected assets in the popup window.
4. Select the assets you need and use the download feature to save them.

## 🏗 Project Structure
- `manifest.json`: Extension metadata and permission configuration.
- `background.js`: Service worker managing background processes and tab communication.
- `popup.html` / `popup.js`: The user interface for asset previews and interaction logic.
- `data/icons/`: Branding assets for the extension interface.

## 📄 License
[Insert your preferred license, e.g., MIT]
