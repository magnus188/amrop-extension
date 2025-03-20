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

    // 3) Convert heading text to lowercase and check if it's some "people also viewed" or similar
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

/**
 * Scrape education entries from the profile.
 */
function scrapeEducation() {
    // Try the short-page approach first:
    let educations = scrapeEducationShortPage();
    if (educations && educations.length > 0) {
        return educations;
    }

    // Otherwise, use the full-page approach.
    educations = scrapeEducationFullPage();
    return educations;
}

/**
 * SHORT-PAGE APPROACH
 */
function scrapeEducationShortPage() {
    const educations = [];

    // 1) Look for #education
    const educationDiv = document.querySelector('#education');
    if (!educationDiv) {
        // No #education div found (likely already full page)
        return educations; // empty
    }

    const educationSection = educationDiv.closest('section.artdeco-card');
    if (!educationSection) {
        // No parent section found for #education
        return educations;
    }

    // 2) Get all education blocks
    const educationBlocks = educationSection.querySelectorAll('div[data-view-name="profile-component-entity"]');

    educationBlocks.forEach((block) => {
        const education = parseEducation(block);
        if (education.school !== 'N/A' || education.degree !== 'N/A') {
            educations.push(education);
        }
    });

    return educations;
}

/**
 * FULL-PAGE APPROACH
 */
function scrapeEducationFullPage() {
    const educations = [];

    // Grab all "profile-component-entity" blocks in the DOM
    const allBlocks = document.querySelectorAll('div[data-view-name="profile-component-entity"]');

    // Filter to top-level blocks (exclude nested, exclude "people also viewed" side sections, etc.)
    const topLevelBlocks = [...allBlocks].filter((block) => {
        const parent = block.parentElement?.closest('div[data-view-name="profile-component-entity"]');
        if (parent) return false; // skip nested
        if (isInBrowsemapSection(block)) {
            return false; // skip 'people also viewed'
        }
        return hasEducationContent(block);
    });

    topLevelBlocks.forEach((block) => {
        const education = parseEducation(block);
        if (education.school !== 'N/A' || education.degree !== 'N/A') {
            educations.push(education);
        }
    });

    return educations;
}

/**
 * Check if a block has education content.
 */
function hasEducationContent(block) {
    const schoolEl = block.querySelector(`
        div.display-flex.align-items-center.mr1.hoverable-link-text.t-bold span[aria-hidden="true"],
        div.t-bold span[aria-hidden="true"],
        span.t-bold[aria-hidden="true"]
    `);
    return !!schoolEl;
}

/**
 * Parse a single education entry from a block.
 */
function parseEducation(block) {
    let school = 'N/A';
    let degree = 'N/A';
    let duration = 'N/A';
    let description = 'N/A';

    // School name
    const schoolEl = block.querySelector(`
        div.display-flex.align-items-center.mr1.hoverable-link-text.t-bold span[aria-hidden="true"],
        div.t-bold span[aria-hidden="true"],
        span.t-bold[aria-hidden="true"]
    `);
    if (schoolEl) {
        school = schoolEl.textContent.trim();
    }

    // Degree
    const degreeEl = block.querySelector('span.t-14.t-normal span[aria-hidden="true"]');
    if (degreeEl) {
        degree = degreeEl.textContent.trim();
    }

    // Duration
    const durationEl = block.querySelector('span.t-14.t-normal.t-black--light span[aria-hidden="true"]');
    if (durationEl) {
        duration = durationEl.textContent.trim();
    }

    // Description (if available)
    const descriptionEl = block.querySelector('.pvs-entity__description span[aria-hidden="true"]');
    if (descriptionEl) {
        description = descriptionEl.textContent.trim();
    }

    return { school, degree, duration, description };
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
        const seeAllExperiencesLink = document.querySelector('#navigation-index-see-all-experiences');
        const seeAllEducationLink = document.querySelector('#navigation-index-see-all-education');

        if (seeAllEducationLink) {
            // Handle education navigation first
            const about = getAboutSection();
            const name = getProfileName();
            const education = scrapeEducation();
            
            // Store the navigation sequence and initial data
            chrome.storage.local.set(
                { 
                    aboutText: about, 
                    name: name, 
                    education: education,
                    nextPageScrapeNeeded: true,
                    navigationSequence: [{
                        type: 'education',
                        href: seeAllEducationLink.href
                    }],
                    currentNavigationIndex: 0
                },
                () => {
                    // Send response first
                    sendResponse({ 
                        status: "navigating", 
                        message: "Redirecting to education page" 
                    });
                    
                    // Navigate immediately after sending response
                    window.location.href = seeAllEducationLink.href;
                }
            );
        } else if (seeAllExperiencesLink) {
            // Handle experience navigation
            const about = getAboutSection();
            const name = getProfileName();
            const education = scrapeEducation();
            
            // Store the navigation sequence and initial data
            chrome.storage.local.set(
                { 
                    aboutText: about, 
                    name: name, 
                    education: education,
                    nextPageScrapeNeeded: true,
                    navigationSequence: [{
                        type: 'experiences',
                        href: seeAllExperiencesLink.href
                    }],
                    currentNavigationIndex: 0
                },
                () => {
                    // Send response first
                    sendResponse({ 
                        status: "navigating", 
                        message: "Redirecting to experiences page" 
                    });
                    
                    // Navigate immediately after sending response
                    window.location.href = seeAllExperiencesLink.href;
                }
            );
        } else {
            // Already on full page (or no see-more links)
            const info = {
                name: getProfileName(),
                about: getAboutSection(),
                experiences: scrapeExperiences(),
                education: scrapeEducation()
            };
            sendResponse(info);
        }

        return true;
    }
});

//////////////////////////////
// 6) Auto-Scrape On Load   //
//////////////////////////////

/**
 *  On load of any LinkedIn page, check if we need a "full experiences" scrape.
 *  If yes, wait for container, then scrape, then reset flag, then send "SCRAPE_COMPLETE".
 */
chrome.storage.local.get(['nextPageScrapeNeeded', 'navigationSequence', 'currentNavigationIndex'], (res) => {
    if (res.nextPageScrapeNeeded && res.navigationSequence && res.currentNavigationIndex !== undefined) {
        // Check if the experiences container is already there:
        let container = document.querySelector('.scaffold-finite-scroll__content');
        if (container) {
            doFullScrape(res.navigationSequence, res.currentNavigationIndex);
        } else {
            waitForExperiencesContainer('.scaffold-finite-scroll__content', 2000).then(() => {
                doFullScrape(res.navigationSequence, res.currentNavigationIndex);
            });
        }
    }
});

/**
 * Check if we're on a valid LinkedIn profile page
 */
function isValidLinkedInProfile() {
    const url = window.location.href;
    console.log('Checking URL:', url);
    // Check if we're on a LinkedIn profile page or a detail page
    const isValid = url.includes('linkedin.com/in/') && 
           (url.includes('/details/education/') || url.includes('/details/experience/') || !url.includes('/details/'));
    console.log('Is valid profile:', isValid);
    return isValid;
}

/**
 * Helper for the "on load" scenario
 */
function doFullScrape(navigationSequence, currentIndex) {
    console.log('Starting full scrape with sequence:', navigationSequence, 'current index:', currentIndex);
    // First check if we're on a valid LinkedIn profile page
    if (!isValidLinkedInProfile()) {
        console.error('Not on a valid LinkedIn profile page');
        chrome.storage.local.set({ 
            nextPageScrapeNeeded: false,
            navigationSequence: null,
            currentNavigationIndex: null,
            experiences: null,
            education: null
        }, () => {
            chrome.runtime.sendMessage({ 
                type: 'SCRAPE_COMPLETE', 
                error: 'Could not find any LinkedIn profile. Please make sure you are on a LinkedIn profile page.'
            });
        });
        return;
    }

    console.log('Profile is valid, proceeding with scrape');
    console.log('Current page type:', navigationSequence[currentIndex].type);

    chrome.storage.local.get(['aboutText', 'name', 'education', 'experiences'], (storedRes) => {
        console.log('Retrieved stored data:', storedRes);
        const storedAbout = storedRes.aboutText || getAboutSection();
        const storedName = storedRes.name || getProfileName();
        const storedEducation = storedRes.education || [];
        const storedExperiences = storedRes.experiences || [];
        
        let experiences = storedExperiences;
        let education = storedEducation;

        // Scrape based on current page type
        const currentPage = navigationSequence[currentIndex];
        console.log('Scraping page type:', currentPage.type);
        
        try {
            if (currentPage.type === 'experiences') {
                console.log('Scraping experiences...');
                experiences = scrapeExperiences();
                console.log('Scraped experiences:', experiences);
            } else if (currentPage.type === 'education') {
                console.log('Scraping education...');
                education = scrapeEducation();
                console.log('Scraped education:', education);
            }

            // Check if we need to navigate to the next page
            if (currentIndex < navigationSequence.length - 1) {
                console.log('More pages to scrape, navigating to next page');
                // Store current data and navigate to next page
                chrome.storage.local.set({
                    experiences: experiences,
                    education: education,
                    currentNavigationIndex: currentIndex + 1
                }, () => {
                    // Send progress message before navigation
                    chrome.runtime.sendMessage({ 
                        type: 'SCRAPE_PROGRESS', 
                        info: {
                            name: storedName,
                            about: storedAbout,
                            experiences,
                            education
                        },
                        currentIndex,
                        totalPages: navigationSequence.length
                    });
                    
                    // Navigate after a short delay to ensure message is sent
                    setTimeout(() => {
                        window.location.href = navigationSequence[currentIndex + 1].href;
                    }, 500);
                });
            } else {
                console.log('No more pages to scrape, sending complete data');
                // We're done with all pages, send complete data
                const info = {
                    name: storedName,
                    about: storedAbout,
                    experiences,
                    education
                };

                // Send final data back to extension (popup or background)
                chrome.runtime.sendMessage({ 
                    type: 'SCRAPE_COMPLETE', 
                    info,
                    error: null 
                }, (response) => {
                    // Only navigate back after the message has been processed
                    setTimeout(() => {
                        chrome.storage.local.set({ 
                            nextPageScrapeNeeded: false,
                            navigationSequence: null,
                            currentNavigationIndex: null,
                            experiences: null,
                            education: null
                        }, () => {
                            const mainProfileUrl = window.location.href.split('/details/')[0];
                            window.location.href = mainProfileUrl;
                        });
                    }, 1000); // Increased delay to ensure message is processed
                });
            }
        } catch (error) {
            console.error('Error during scraping:', error);
            chrome.storage.local.set({ 
                nextPageScrapeNeeded: false,
                navigationSequence: null,
                currentNavigationIndex: null,
                experiences: null,
                education: null
            }, () => {
                chrome.runtime.sendMessage({ 
                    type: 'SCRAPE_COMPLETE', 
                    error: 'An error occurred while scraping the profile: ' + error.message 
                });
            });
        }
    });
}