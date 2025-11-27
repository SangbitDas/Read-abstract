# Scholar Abstract Reader

A Chrome extension that automatically displays full paper abstracts from Google Scholar search results in a convenient modal popup - no need to open new tabs!

## Features

- 🔍 **One-Click Abstract Reading**: Click "Read Abstract" button on any Google Scholar result
- 📄 **Full Abstract Extraction**: Automatically fetches and displays complete abstracts from:
  - ACM Digital Library
  - Springer
  - ScienceDirect
  - IEEE
  - arXiv
  - And many other academic publishers
- 🚫 **No New Tabs**: View abstracts in a clean modal overlay without leaving Google Scholar
- ⚡ **Fast & Lightweight**: Minimal performance impact
- 🎨 **Clean UI**: Simple, distraction-free modal design

## Installation

### From Source

1. **Clone or download this repository**
   ```bash
   git clone https://github.com/yourusername/scholar-abstract-reader.git
   ```

2. **Open Chrome and navigate to extensions**
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)

3. **Load the extension**
   - Click "Load unpacked"
   - Select the `read_abstract` folder

4. **You're ready!** Navigate to Google Scholar and start reading abstracts

## Usage

1. **Search on Google Scholar**
   - Go to [Google Scholar](https://scholar.google.com)
   - Search for any academic paper

2. **Click "Read Abstract"**
   - Each search result will have a "Read Abstract" button
   - Click it to view the full abstract in a modal

3. **Close the modal**
   - Click the X button
   - Click outside the modal
   - Press the Escape key

## Supported Websites

The extension works best with:

- ✅ **ACM Digital Library** - Full abstract extraction
- ✅ **Springer** - Full abstract extraction
- ✅ **ScienceDirect** - Full abstract extraction
- ✅ **IEEE Xplore** - Full abstract extraction
- ✅ **arXiv** - Full abstract extraction
- ⚠️ **NeurIPS Proceedings** - Shows snippet (content is dynamically loaded)
- ✅ **Most other publishers** - Attempts extraction via common patterns

## Known Limitations

- **NeurIPS Proceedings**: These pages load content dynamically with JavaScript, so the extension cannot extract the full abstract. Instead, it displays the snippet from Google Scholar with a link to the full page.
- **PDF-only papers**: If a Google Scholar result links directly to a PDF, the extension will show the snippet instead.
- **Paywalled content**: The extension can only extract abstracts from publicly accessible pages.

## Technical Details

### How It Works

1. **Content Script**: Injects "Read Abstract" buttons into Google Scholar results
2. **Background Worker**: Fetches the paper's landing page to bypass CORS restrictions
3. **Smart Extraction**: Uses multiple strategies to find abstracts:
   - Metadata tags (`citation_abstract`, `og:description`, etc.)
   - Common CSS selectors (`.abstract`, `.abstractSection`, etc.)
   - Publisher-specific patterns
4. **Fallback**: Shows Google Scholar snippet if extraction fails

### Files

- `manifest.json` - Extension configuration (Manifest V3)
- `content.js` - Main logic for button injection and abstract extraction
- `background.js` - Background service worker for fetching pages
- `styles.css` - Modal and button styling

## Privacy

This extension:
- ✅ Only activates on Google Scholar pages
- ✅ Only fetches pages when you click "Read Abstract"
- ✅ Does not collect or transmit any personal data
- ✅ Does not track your browsing history
- ✅ Runs entirely locally in your browser

## Contributing

Contributions are welcome! If you find a publisher whose abstracts aren't being extracted correctly:

1. Open an issue with the paper URL
2. Or submit a PR with the appropriate selector added to `content.js`

## License

MIT License - feel free to use and modify as needed.

## Troubleshooting

### Extension not working after installation
- Make sure you've enabled the extension in `chrome://extensions/`
- Refresh the Google Scholar page after installing

### "Read Abstract" buttons not appearing
- Check that you're on a Google Scholar search results page
- Try refreshing the page
- Check the browser console (F12) for any errors

### Abstract shows "Could not extract"
- The paper's website may use an uncommon structure
- Try clicking the paper link to view it directly
- Report the issue with the paper URL so we can add support

### Extension context invalidated error
- This happens when you reload the extension
- Simply refresh the Google Scholar page to fix it

## Changelog

### v1.0.0
- Initial release
- Support for ACM, Springer, ScienceDirect, IEEE, and more
- Clean modal UI
- Dynamic content detection for NeurIPS

---

**Enjoy faster research with Scholar Abstract Reader! ⭐**
