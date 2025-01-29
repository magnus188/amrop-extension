
//////////////////////////////
// Maybe go to full page //
//////////////////////////////
function maybeGoToFullExperiencePage() {
    return new Promise((resolve, reject) => {
        const seeAllLink = document.querySelector('#navigation-index-see-all-experiences');
        if (seeAllLink) {
            const about = getAboutSection();
            const name = getProfileName();

            // Store 'aboutText', 'name', and set a flag indicating we need to scrape the full page
            chrome.storage.local.set({ aboutText: about, name: name, nextPageScrapeNeeded: true }, () => {
                // Navigate to the full experiences page
                window.location.href = seeAllLink.href;
                // No resolve here because the page is navigating away
            });
        } else {
            // We're likely on the full experiences page or a short page with no "see all" link
            chrome.storage.local.get(['aboutText', 'name', 'nextPageScrapeNeeded'], (res) => {
                const { aboutText, name, nextPageScrapeNeeded } = res;

                if (nextPageScrapeNeeded) {
                    let storedAbout = aboutText || 'N/A';
                    let storedName = name || 'N/A';

                    // If 'aboutText' or 'name' is missing, attempt to scrape them again
                    if (storedAbout === 'N/A') {
                        storedAbout = getAboutSection();
                    }
                    if (storedName === 'N/A') {
                        storedName = getProfileName();
                    }

                    // Scrape the experiences
                    const experiences = scrapeExperiences();

                    // Compile the final data object
                    const info = {
                        name: storedName,
                        about: storedAbout,
                        experiences
                    };

                    // Reset the flag to indicate scraping is complete
                    chrome.storage.local.set({ nextPageScrapeNeeded: false }, () => {
                        // Resolve the promise with the final data
                        resolve(info);
                    });
                } else {
                    // Optional: Handle scenarios where scraping isn't needed
                    // For example, scrape experiences without needing to combine with stored data
                    const storedAbout = aboutText || getAboutSection();
                    const storedName = name || getProfileName();
                    const experiences = scrapeExperiences();

                    const info = {
                        name: storedName,
                        about: storedAbout,
                        experiences
                    };

                    resolve(info);
                }
            });
        }
    });
}

////////////////////////////////////////
// Function to scrape About //
////////////////////////////////////////
function getAboutSection() {
    let aboutText = 'N/A';

    // 1) Locate the #about anchor
    const aboutAnchor = document.querySelector('#about');
    if (!aboutAnchor) return aboutText; // none

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

////////////////////////////////////////
// Function to get Name //
////////////////////////////////////////
function getProfileName() {
    let name = 'N/A';

    // Attempt 1: Look for the main <h1> tag that typically contains the name
    const nameHeader = document.querySelector('h1.text-heading-xlarge.inline.t-24.v-align-middle.break-words');
    if (nameHeader) {
        name = nameHeader.textContent.trim();
        return name;
    }

    // Attempt 2: Alternative selector if the first one fails
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

    // Attempt 4: Fallback to the page's title tag (less reliable)
    if (document.title) {
        // Typically, LinkedIn profile titles are in the format "First Last | LinkedIn"
        const titleParts = document.title.split('|');
        if (titleParts.length > 0) {
            name = titleParts[0].trim();
        }
    }

    return name;
}

////////////////////////////////////
// The same experiences logic  //
////////////////////////////////////
function scrapeExperiences() {
    // Try the "short-page" approach first:
    let experiences = scrapeExperiencesShortPage();
    if (experiences && experiences.length > 0) {
        return experiences;
    }

    experiences = scrapeExperiencesFullPage();
    return experiences;
}

// --------------------------
// 1) Short-page approach
// --------------------------
function scrapeExperiencesShortPage() {
    const experiences = [];

    // 1) Look for #experience
    const experienceDiv = document.querySelector('#experience');
    if (!experienceDiv) {
        // No #experience div found (likely full page)
        return experiences;  // empty
    }

    const experienceSection = experienceDiv.closest('section.artdeco-card');
    if (!experienceSection) {
        // No parent section found for #experience
        return experiences;
    }

    // 2) Within that section, get all blocks that have data-view-name="profile-component-entity"
    const allBlocks = experienceSection.querySelectorAll(
        'div[data-view-name="profile-component-entity"]'
    );

    // 3) Filter to top-level
    const topLevelBlocks = [...allBlocks].filter((block) => {
        const parent = block.parentElement?.closest('div[data-view-name="profile-component-entity"]');
        if (parent) return false; // skip if nested
        return hasJobTitle(block);
    });

    // 4) Parse each top-level block
    topLevelBlocks.forEach((companyBlock) => {
        const fallbackCompany = getCompanyName(companyBlock);
        const childBlocks = [...companyBlock.querySelectorAll('div[data-view-name="profile-component-entity"]')]
            .filter((b) => b !== companyBlock)
            .filter(hasJobTitle);

        if (childBlocks.length === 0) {
            // single
            const singlePos = parsePosition(companyBlock, fallbackCompany);
            if (singlePos.jobTitle !== 'N/A' || singlePos.company !== 'N/A') {
                experiences.push(singlePos);
            }
        } else {
            // multiple
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

// --------------------------
// 2) Full-page approach
// --------------------------
function isInBrowsemapSection(block) {
    // 1) Find the nearest <section data-view-name="profile-card">
    const section = block.closest('section[data-view-name="profile-card"]');
    if (!section) return false;

    // 2) Look for the H2 heading in that section
    const headingEl = section.querySelector('h2.pvs-header__title');
    if (!headingEl) return false;

    // 3) Convert the heading text to lowercase
    const headingText = headingEl.textContent.trim().toLowerCase();

    // 4) If the heading text is "flere profiler til deg" OR "people also viewed" etc.,
    //    then this block is in the browsemap
    if (headingText.includes('flere profiler') || headingText.includes('people also viewed')) {
        return true;
    }
    return false;
}

function scrapeExperiencesFullPage() {
    const experiences = [];

    // Grab all "profile-component-entity" blocks in the DOM
    const allBlocks = document.querySelectorAll('div[data-view-name="profile-component-entity"]');

    const topLevelBlocks = [...allBlocks].filter((block) => {
        // 1) Skip if nested
        const parent = block.parentElement?.closest('div[data-view-name="profile-component-entity"]');
        if (parent) return false;

        // 2) Skip if it’s in the browsemap side section
        if (isInBrowsemapSection(block)) {
            return false;
        }

        // 3) Must have a job title
        return hasJobTitle(block);
    });

    topLevelBlocks.forEach((companyBlock) => {
        // same parse logic as before
        const fallbackCompany = getCompanyName(companyBlock);

        const childBlocks = [
            ...companyBlock.querySelectorAll('div[data-view-name="profile-component-entity"]'),
        ]
            .filter((b) => b !== companyBlock && hasJobTitle(b));

        if (childBlocks.length === 0) {
            const singlePos = parsePosition(companyBlock, fallbackCompany);
            if (singlePos.jobTitle !== 'N/A' || singlePos.company !== 'N/A') {
                experiences.push(singlePos);
            }
        } else {
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

//////////////////////////////////////
// Supporting sub-functions etc. //
//////////////////////////////////////
function hasJobTitle(block) {
    const jobTitleCandidate = block.querySelector(`
      div.display-flex.align-items-center.mr1.hoverable-link-text.t-bold span[aria-hidden="true"],
      div.t-bold span[aria-hidden="true"],
      span.t-bold[aria-hidden="true"]
    `);
    return !!jobTitleCandidate;
}

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

    // Attempt #3: alt text
    if (company === 'N/A') {
        const logoImg = companyBlock.querySelector(
            'a[data-field="experience_company_logo"] img[alt*="-logo"]'
        );
        if (logoImg) {
            const altText = logoImg.getAttribute('alt') || '';
            company = altText.replace(/-logo$/i, '').trim();
        }
    }

    // Attempt #4: "Amrop · Heltid" => "Amrop"
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

    if (textLines[0]) duration = textLines[0];

    if (textLines.length > 1 && textLines[1]) {
        // e.g. "Oslo, Norway · På kontoret" => "Oslo, Norway"
        const locParts = textLines[1].split(' · ');
        location = locParts[0].trim();
    }

    // If fallback didn't give a company name, try again
    if (!company || company === 'N/A') {
        company = getCompanyName(positionBlock);
    }

    return { jobTitle, company, duration, location };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scrapeProfile") {
        maybeGoToFullExperiencePage().then((info) => {
            console.log(info);
            sendResponse(info);
        });
        return true; // keep port open
    }
});