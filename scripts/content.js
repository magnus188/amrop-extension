//////////////////////////////
// 1) Helper Functions     //
//////////////////////////////

/**
 * Scrape the "About" section from the DOM.
 */
function getAboutSection() {
    let aboutText = 'N/A';

    // 1) Locate the #about anchor
    const aboutAnchor = document.querySelector('#about');
    if (!aboutAnchor) return aboutText;

    // 2) Move up to the section
    const aboutSection = aboutAnchor.closest('section.artdeco-card');
    if (!aboutSection) return aboutText;

    // 3) Find the collapsed or expanded text container
    const collapsedTextEl = aboutSection.querySelector(
        '.inline-show-more-text--is-collapsed span[aria-hidden="true"]'
    );

    // 4) Fallback if already expanded
    let textEl = collapsedTextEl;
    if (!textEl) {
        textEl = aboutSection.querySelector('.inline-show-more-text span[aria-hidden="true"]');
    }

    // 5) Extract text if found
    if (textEl) {
        aboutText = textEl.textContent.trim();
    }
    return aboutText;
}

/**
 * Scrape the profile name from the DOM.
 */
function getProfileName() {
    let name = 'N/A';

    // Attempt 1: Look for the main <h1> tag
    const nameHeader = document.querySelector('h1.text-heading-xlarge.inline.t-24.v-align-middle.break-words');
    if (nameHeader) {
        name = nameHeader.textContent.trim();
        return name;
    }

    // Attempt 2: Alternative selector
    const alternativeNameHeader = document.querySelector('li.inline.t-24.t-black.t-normal.break-words');
    if (alternativeNameHeader) {
        name = alternativeNameHeader.textContent.trim();
        return name;
    }

    // Attempt 3: Using more general selectors with role attributes
    const roleNameHeader = document.querySelector('[role="heading"][aria-level="1"]');
    if (roleNameHeader) {
        name = roleNameHeader.textContent.trim();
        return name;
    }

    // Attempt 4: Fallback to the page's title tag
    if (document.title) {
        // e.g., "First Last | LinkedIn"
        const titleParts = document.title.split('|');
        if (titleParts.length > 0) {
            name = titleParts[0].trim();
        }
    }
    return name;
}

//////////////////////////////
// 2) Main Scrape Functions //
//////////////////////////////

/**
 * Decide how to scrape the experiences.
 *  - Try "short-page" approach first.
 *  - If empty, use the "full-page" approach.
 */
function scrapeExperiences() {
    // Try the short-page approach first:
    let experiences = scrapeExperiencesShortPage();
    if (experiences && experiences.length > 0) {
        return experiences;
    }

    // Otherwise, use the full-page approach.
    experiences = scrapeExperiencesFullPage();
    return experiences;
}

/**
 * SHORT-PAGE APPROACH
 */
function scrapeExperiencesShortPage() {
    const experiences = [];

    // 1) Look for #experience
    const experienceDiv = document.querySelector('#experience');
    if (!experienceDiv) {
        // No #experience div found (likely already full page)
        return experiences; // empty
    }

    const experienceSection = experienceDiv.closest('section.artdeco-card');
    if (!experienceSection) {
        // No parent section found for #experience
        return experiences;
    }

    // 2) Within that section, get all blocks that have data-view-name="profile-component-entity"
    const allBlocks = experienceSection.querySelectorAll('div[data-view-name="profile-component-entity"]');

    // 3) Filter to top-level
    const topLevelBlocks = [...allBlocks].filter((block) => {
        const parent = block.parentElement?.closest('div[data-view-name="profile-component-entity"]');
        if (parent) return false; // skip nested
        return hasJobTitle(block);
    });

    // 4) Parse each top-level block
    topLevelBlocks.forEach((companyBlock) => {
        const fallbackCompany = getCompanyName(companyBlock);
        const childBlocks = [...companyBlock.querySelectorAll('div[data-view-name="profile-component-entity"]')]
            .filter((b) => b !== companyBlock)
            .filter(hasJobTitle);

        if (childBlocks.length === 0) {
            // Single
            const singlePos = parsePosition(companyBlock, fallbackCompany);
            if (singlePos.jobTitle !== 'N/A' || singlePos.company !== 'N/A') {
                experiences.push(singlePos);
            }
        } else {
            // Multiple
            childBlocks.forEach((posBlock) => {
                const subPos = parsePosition(posBlock, fallbackCompany);
                if (subPos.jobTitle !== 'N/A' || subPos.company !== 'N/A') {
                    experiences.push(subPos);
                }
            });
        }
    });

    return experiences;
}

/**
 * FULL-PAGE APPROACH
 */
function scrapeExperiencesFullPage() {
    const experiences = [];

    // Grab all "profile-component-entity" blocks in the DOM
    const allBlocks = document.querySelectorAll('div[data-view-name="profile-component-entity"]');

    // Filter to top-level blocks (exclude nested, exclude "people also viewed" side sections, etc.)
    const topLevelBlocks = [...allBlocks].filter((block) => {
        const parent = block.parentElement?.closest('div[data-view-name="profile-component-entity"]');
        if (parent) return false; // skip nested
        if (isInBrowsemapSection(block)) {
            return false; // skip 'people also viewed'
        }
        return hasJobTitle(block);
    });

    topLevelBlocks.forEach((companyBlock) => {
        const fallbackCompany = getCompanyName(companyBlock);
        const childBlocks = [...companyBlock.querySelectorAll('div[data-view-name="profile-component-entity"]')]
            .filter((b) => b !== companyBlock)
            .filter(hasJobTitle);

        if (childBlocks.length === 0) {
            // Single
            const singlePos = parsePosition(companyBlock, fallbackCompany);
            if (singlePos.jobTitle !== 'N/A' || singlePos.company !== 'N/A') {
                experiences.push(singlePos);
            }
        } else {
            // Multiple
            childBlocks.forEach((posBlock) => {
                const subPos = parsePosition(posBlock, fallbackCompany);
                if (subPos.jobTitle !== 'N/A' || subPos.company !== 'N/A') {
                    experiences.push(subPos);
                }
            });
        }
    });

    return experiences;
}

//////////////////////////////
// 3) Supporting Functions  //
//////////////////////////////

/**
 * Check if a block is in the "browsemap" side section (like "people also viewed").
 */
function isInBrowsemapSection(block) {
    // 1) Find the nearest <section data-view-name="profile-card">
    const section = block.closest('section[data-view-name="profile-card"]');
    if (!section) return false;

    // 2) Look for the <h2> heading
    const headingEl = section.querySelector('h2.pvs-header__title');
    if (!headingEl) return false;

    // 3) Convert heading text to lowercase and check if it’s some "people also viewed" or similar
    const headingText = headingEl.textContent.trim().toLowerCase();
    if (headingText.includes('flere profiler') || headingText.includes('people also viewed')) {
        return true;
    }
    return false;
}

/**
 * Check if a block has a job title candidate.
 */
function hasJobTitle(block) {
    const jobTitleCandidate = block.querySelector(`
    div.display-flex.align-items-center.mr1.hoverable-link-text.t-bold span[aria-hidden="true"],
    div.t-bold span[aria-hidden="true"],
    span.t-bold[aria-hidden="true"]
  `);
    return !!jobTitleCandidate;
}

/**
 * Attempt to extract the company name from a block.
 */
function getCompanyName(companyBlock) {
    // Attempt #1
    let el = companyBlock.querySelector(
        'a[data-field="experience_company_logo"] div.t-bold span[aria-hidden="true"]'
    );

    // Attempt #2
    if (!el) {
        el = companyBlock.querySelector(
            'a.optional-action-target-wrapper.display-flex.flex-column.full-width div.t-bold span[aria-hidden="true"]'
        );
    }

    let company = el ? el.textContent.trim() : 'N/A';

    // Attempt #3: alt text from logo
    if (company === 'N/A') {
        const logoImg = companyBlock.querySelector(
            'a[data-field="experience_company_logo"] img[alt*="-logo"]'
        );
        if (logoImg) {
            const altText = logoImg.getAttribute('alt') || '';
            company = altText.replace(/-logo$/i, '').trim();
        }
    }

    // Attempt #4: fallback from the second line (like "Amrop · Heltid" => "Amrop")
    if (company === 'N/A') {
        const secondLine = companyBlock.querySelector('span.t-14.t-normal > span[aria-hidden="true"]');
        if (secondLine) {
            let text = secondLine.textContent.trim();
            if (text.includes(' · ')) {
                text = text.split(' · ')[0].trim();
            }
            if (text) {
                company = text;
            }
        }
    }
    return company;
}

/**
 * Parse a position (jobTitle, company, duration, location) from a block.
 */
function parsePosition(positionBlock, fallbackCompany) {
    let jobTitle = 'N/A';
    let company = fallbackCompany || 'N/A';
    let duration = 'N/A';
    let location = 'N/A';

    // Title
    const jobTitleEl = positionBlock.querySelector(`
    div.display-flex.align-items-center.mr1.hoverable-link-text.t-bold span[aria-hidden="true"],
    div.t-bold span[aria-hidden="true"],
    span.t-bold[aria-hidden="true"]
  `);
    if (jobTitleEl) {
        jobTitle = jobTitleEl.textContent.trim();
    }

    // Lines for date + location
    const lightLines = [
        ...positionBlock.querySelectorAll('span.t-14.t-normal.t-black--light')
    ];
    const textLines = lightLines.map((line) => {
        const hiddenSpan = line.querySelector('span[aria-hidden="true"]');
        return hiddenSpan ? hiddenSpan.textContent.trim() : '';
    });

    // If textLines[0] is e.g. "sep. 2023 - Nå · 1 år 6måneder"
    if (textLines[0]) {
        duration = textLines[0];
    }

    // If textLines[1] is e.g. "Oslo, Norway · På kontoret" => "Oslo, Norway"
    if (textLines.length > 1 && textLines[1]) {
        const locParts = textLines[1].split(' · ');
        location = locParts[0].trim();
    }

    // If fallback didn't give a company name, try again
    if (!company || company === 'N/A') {
        company = getCompanyName(positionBlock);
    }

    return { jobTitle, company, duration, location };
}

//////////////////////////////
// 4) Page Load "Wait" Logic  //
//////////////////////////////

/**
 * A function to wait until the experiences container is present or until timeout.
 * Adjust the selector or timing as needed if LinkedIn changes the DOM.
 */
function waitForExperiencesContainer(selector = '.scaffold-finite-scroll__content', timeout = 2000) {
    return new Promise((resolve) => {
        // If it's already there, resolve immediately
        const existing = document.querySelector(selector);
        if (existing) {
            resolve(existing);
            return;
        }

        // Otherwise, observe the DOM for new elements
        const observer = new MutationObserver(() => {
            const found = document.querySelector(selector);
            if (found) {
                observer.disconnect();
                resolve(found);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        // If still not found after X ms, stop and return null.
        setTimeout(() => {
            observer.disconnect();
            resolve(null);
        }, timeout);
    });
}

//////////////////////////////
// 5) Message Listener      //
//////////////////////////////

/**
 *  Listen for the "scrapeProfile" request from the popup.
 *  - If "see more" link is found, store about/name, set the flag, then navigate.
 *  - Otherwise, scrape immediately and return the data.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scrapeProfile") {
        const seeAllLink = document.querySelector('#navigation-index-see-all-experiences');

        if (seeAllLink) {
            // Store data and navigate away
            const about = getAboutSection();
            const name = getProfileName();
            chrome.storage.local.set(
                { aboutText: about, name: name, nextPageScrapeNeeded: true },
                () => {
                    window.location.href = seeAllLink.href;
                }
            );
            // Don't call sendResponse because we're navigating.
        } else {
            // Already on full experiences page (or no see-more link)
            const info = {
                name: getProfileName(),
                about: getAboutSection(),
                experiences: scrapeExperiences()
            };
            sendResponse(info);
        }

        return true; // Keep the channel open for async calls if needed.
    }
});

//////////////////////////////
// 6) Auto-Scrape On Load   //
//////////////////////////////

/**
 *  On load of any LinkedIn page, check if we need a "full experiences" scrape.
 *  If yes, wait for container, then scrape, then reset flag, then send "SCRAPE_COMPLETE".
 */
chrome.storage.local.get(['nextPageScrapeNeeded'], (res) => {
    if (res.nextPageScrapeNeeded) {
        // Quick immediate check
        let container = document.querySelector('.scaffold-finite-scroll__content');
        if (container) {
            // Already loaded, so scrape now
            doFullScrape();
        } else {
            waitForExperiencesContainer('.scaffold-finite-scroll__content', 2000).then(() => {
                chrome.storage.local.get(['aboutText', 'name'], (storedRes) => {
                    const storedAbout = storedRes.aboutText || getAboutSection();
                    const storedName = storedRes.name || getProfileName();
                    const experiences = scrapeExperiences();

                    const info = {
                        name: storedName,
                        about: storedAbout,
                        experiences
                    };

                    // Reset the flag
                    chrome.storage.local.set({ nextPageScrapeNeeded: false }, () => {
                        // Send the data back to your extension (e.g., the popup).
                        chrome.runtime.sendMessage({ type: 'SCRAPE_COMPLETE', info });
                    });
                });
            });
        }
    }
});