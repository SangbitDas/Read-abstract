function createModal(abstractText) {
  // Remove existing modal if any
  const existingModal = document.querySelector('.sar-modal-overlay');
  if (existingModal) existingModal.remove();

  // Create Overlay
  const overlay = document.createElement('div');
  overlay.className = 'sar-modal-overlay';

  // Create Modal
  const modal = document.createElement('div');
  modal.className = 'sar-modal';

  // Close Button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'sar-close-btn';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = closeModal;

  // Content
  const content = document.createElement('div');
  content.className = 'sar-abstract-text';
  content.innerText = abstractText;

  modal.appendChild(closeBtn);
  modal.appendChild(content);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // Close on Escape
  document.addEventListener('keydown', handleEsc);
}

function closeModal() {
  const overlay = document.querySelector('.sar-modal-overlay');
  if (overlay) {
    overlay.remove();
  }
  document.removeEventListener('keydown', handleEsc);
}

function handleEsc(e) {
  if (e.key === 'Escape') closeModal();
}

function addButtons() {
  const results = document.querySelectorAll('.gs_ri');

  results.forEach(result => {
    if (result.querySelector('.read-abs-btn')) return;

    const btn = document.createElement('button');
    btn.className = 'read-abs-btn';
    btn.innerText = 'Read Abstract';

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Show loading state
      createModal("Loading abstract...");

      // Get the link to the paper
      const linkEl = result.querySelector('.gs_rt a');
      if (!linkEl) {
        updateModalContent("Could not find a link to the paper.");
        return;
      }

      const url = linkEl.href;
      console.log("Sending fetch request for:", url);

      // Check if this is a NeurIPS URL (content is loaded dynamically)
      if (url.includes('proceedings.neurips.cc') || url.includes('papers.nips.cc')) {
        console.log("Detected NeurIPS URL - content is dynamically loaded");
        const snippet = result.querySelector('.gs_rs');
        const snippetText = snippet ? snippet.innerText.trim() : "";
        updateModalContent("NeurIPS abstracts are loaded dynamically and cannot be extracted automatically.\n\nHere is the snippet from Google Scholar:\n\n" + snippetText + "\n\nClick the paper link to view the full abstract.");
        return;
      }

      // Send message to background script to fetch the page
      chrome.runtime.sendMessage({ action: "fetchAbstract", url: url }, (response) => {
        console.log("Response received:", response);

        if (chrome.runtime.lastError) {
          console.error("Runtime error:", chrome.runtime.lastError);
          updateModalContent("Error: " + chrome.runtime.lastError.message);
          return;
        }

        if (response && response.success) {
          console.log("Fetch successful, parsing HTML...");
          const parser = new DOMParser();
          const doc = parser.parseFromString(response.html, "text/html");
          console.log("Fetched Page Title:", doc.title);
          console.log("Fetched Page Body Length:", doc.body.innerText.length);

          // Debug: Log all meta tags to see what's available
          const metas = doc.querySelectorAll('meta');
          console.log("Found " + metas.length + " meta tags.");
          metas.forEach(m => {
            if (m.name && m.name.includes('abstract')) console.log("Meta name match:", m.name, m.content);
            if (m.getAttribute('property') && m.getAttribute('property').includes('description')) console.log("Meta property match:", m.getAttribute('property'), m.content);
          });

          // Try to find abstract in common metadata tags
          let abstract = "";

          // 1. Metadata tags (High precision)
          const metaAbstract = doc.querySelector('meta[name="citation_abstract"]') ||
            doc.querySelector('meta[name="DC.Description"]') ||
            doc.querySelector('meta[name="description"]') ||
            doc.querySelector('meta[property="og:description"]');

          if (metaAbstract) {
            console.log("Found abstract in meta tag:", metaAbstract.getAttribute('name') || metaAbstract.getAttribute('property'));
            abstract = metaAbstract.content;
          }

          // Check if metadata abstract is truncated
          // Trim whitespace and check for common truncation markers
          const cleanAbstract = abstract ? abstract.trim() : "";
          if (cleanAbstract && (cleanAbstract.endsWith('...') || cleanAbstract.endsWith('…') || cleanAbstract.length < 300)) {
            console.log("Metadata abstract appears truncated or short. Resetting to search DOM...");
            abstract = "";
          }

          // 2. Common selectors (if metadata fails or is too short)
          if (!abstract) {
            console.log("Searching DOM for abstract...");
            const possibleSelectors = [
              '.abstractSection', // ACM Digital Library (Prioritize)
              '.abstract', '#abstract', '.Abstract',
              '.c-article-section__content', // Springer
              '.abstract-author',
              '.cas-body', // ScienceDirect sometimes
              'div[class*="abstract" i]', // Case insensitive partial match
              'section[class*="abstract" i]',
              'div[id*="abstract" i]',
              'section[id*="abstract" i]',
              '.pub-abstract' // Other publishers
            ];

            for (const selector of possibleSelectors) {
              const el = doc.querySelector(selector);
              console.log(`Checking selector: ${selector} -> ${el ? "Found" : "Not Found"}`);
              if (el) {
                const text = el.innerText.trim();
                console.log(`Selector ${selector} text length: ${text.length}`);
                if (text.length > 100) {
                  abstract = text;
                  console.log("Found abstract using selector:", selector);
                  break;
                }
              }
            }

            // 3. NeurIPS pattern: <h4>Abstract</h4> followed by <p>
            if (!abstract) {
              console.log("Trying NeurIPS pattern (h4 + p)...");
              const headers = doc.querySelectorAll('h4');
              console.log(`Found ${headers.length} h4 elements`);
              for (const h4 of headers) {
                const h4Text = h4.innerText.trim().toLowerCase();
                console.log(`h4 text: "${h4Text}"`);
                if (h4Text === 'abstract') {
                  console.log("Found h4 with 'abstract' text!");
                  let nextP = h4.nextElementSibling;
                  console.log(`Next sibling: ${nextP ? nextP.tagName : 'null'}`);
                  if (nextP && nextP.tagName === 'P') {
                    console.log(`P tag innerHTML: ${nextP.innerHTML.substring(0, 200)}`);
                    console.log(`P tag children count: ${nextP.children.length}`);

                    // Check if there's a nested <p> inside
                    const innerP = nextP.querySelector('p');
                    console.log(`Inner p found: ${innerP ? 'yes' : 'no'}`);

                    // Use textContent instead of innerText for DOMParser-parsed HTML
                    let text = innerP ? innerP.textContent.trim() : nextP.textContent.trim();

                    // If still empty, try getting all text from child nodes
                    if (!text && nextP.children.length > 0) {
                      console.log("Trying to extract from child elements...");
                      text = Array.from(nextP.children).map(child => child.textContent).join(' ').trim();
                    }

                    console.log(`NeurIPS h4 found, checking p tag. Text length: ${text.length}`);
                    console.log(`First 100 chars: ${text.substring(0, 100)}`);
                    if (text.length > 100) {
                      abstract = text;
                      console.log("Found abstract using NeurIPS pattern (h4 + p)");
                      break;
                    } else {
                      // P tag is empty - content might be loaded dynamically
                      // Use the snippet from Google Scholar to find the full paragraph
                      console.log("P tag empty, using snippet to find full abstract...");
                      const snippet = result.querySelector('.gs_rs');
                      if (snippet) {
                        const snippetText = snippet.innerText.trim();
                        // Get first 50 chars of snippet to search for
                        const searchText = snippetText.substring(0, 50).toLowerCase();
                        console.log(`Searching for paragraph containing: "${searchText}"`);

                        const allParagraphs = doc.querySelectorAll('p');
                        for (const p of allParagraphs) {
                          const pText = p.textContent.trim();
                          if (pText.length > 200 && pText.toLowerCase().includes(searchText)) {
                            abstract = pText;
                            console.log("Found full abstract using snippet match! Length:", pText.length);
                            break;
                          }
                        }
                      }
                      if (abstract) break;
                    }
                  }
                }
              }
            }
          }

          if (abstract) {
            updateModalContent(abstract);
          } else {
            console.log("Abstract not found in metadata or common classes.");

            // Check for potential security/challenge page
            const pageTitle = doc.title.toLowerCase();
            const bodyText = doc.body.innerText.trim();

            if (bodyText.length < 500 || pageTitle.includes("security") || pageTitle.includes("challenge") || pageTitle.includes("captcha")) {
              updateModalContent("Could not fetch the abstract. The site might be blocking the request (Security Check/CAPTCHA).\n\nPlease try clicking the link to open the paper, pass any security checks, and then try again.");
            } else {
              // Fallback to snippet if full abstract not found
              const snippet = result.querySelector('.gs_rs');
              const snippetText = snippet ? snippet.innerText.trim() : "No abstract available.";
              updateModalContent("Could not automatically extract the full abstract from the page. Here is the snippet:\n\n" + snippetText);
            }
          }
        } else {
          console.error("Fetch failed:", response ? response.error : "Unknown error");
          updateModalContent("Failed to load the paper page. " + (response ? response.error : "Unknown error"));
        }
      });
    });

    // Append button after the snippet or title
    result.appendChild(btn);
  });
}

function updateModalContent(text) {
  const content = document.querySelector('.sar-abstract-text');
  if (content) {
    content.innerText = text;
  }
}

// Run periodically to handle dynamic loading
setInterval(addButtons, 1000);

// Run immediately
addButtons();
