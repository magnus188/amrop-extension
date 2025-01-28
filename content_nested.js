function scrapeExperiences() {
    const experiences = [];

    // 1) Locate the Experience section
    const experienceDiv = document.querySelector('#experience');
    if (!experienceDiv) {
        console.log('No #experience div found');
        return experiences;
    }
    const experienceSection = experienceDiv.closest('section.artdeco-card');
    if (!experienceSection) {
        console.log('No parent section.artdeco-card found for #experience');
        return experiences;
    }

    // 2) Grab ALL blocks that have data-view-name="profile-component-entity" inside Experience
    const allBlocks = experienceSection.querySelectorAll('div[data-view-name="profile-component-entity"]');

    // 3) Filter down to top-level blocks (i.e., those that do NOT have a parent "profile-component-entity"),
    //    and that actually look like they have a job title (so we skip skill expansions, etc.).
    const topLevelCompanyBlocks = [...allBlocks].filter((block) => {
        // Must not be a nested (child) block
        const parentBlock = block.parentElement?.closest('div[data-view-name="profile-component-entity"]');
        if (parentBlock) return false;

        // Must have some text that looks like a job title
        return hasJobTitle(block);
    });

    // 4) For each top-level block, parse the fallback (company) name,
    //    then parse either the sub-positions or treat it as a single position.
    topLevelCompanyBlocks.forEach((companyBlock) => {
        const fallbackCompany = getCompanyName(companyBlock);

        // 5) Gather child blocks (nested positions) that have a job title
        const childBlocks = [...companyBlock.querySelectorAll('div[data-view-name="profile-component-entity"]')]
            .filter((b) => b !== companyBlock) // exclude the block itself
            .filter(hasJobTitle);

        // If no valid sub-blocks, treat the top-level block as a single position
        if (childBlocks.length === 0) {
            const singlePosition = parsePosition(companyBlock, fallbackCompany);
            // Skip pushing if it’s completely empty
            if (singlePosition.jobTitle !== 'N/A' || singlePosition.company !== 'N/A') {
                experiences.push(singlePosition);
            }
        } else {
            // Otherwise, parse each sub-position as a distinct role
            childBlocks.forEach((posBlock) => {
                const subPosition = parsePosition(posBlock, fallbackCompany);
                if (subPosition.jobTitle !== 'N/A' || subPosition.company !== 'N/A') {
                    experiences.push(subPosition);
                }
            });
        }
    });

    console.log('Scraped experiences:', experiences);
    return experiences;
}

/**
 * Return a string with the fallback company name from a top-level block.
 * We use multiple possible selectors, because LinkedIn’s HTML can vary.
 */
function getCompanyName(companyBlock) {
    // 1) Typical approach: data-field="experience_company_logo"
    let el = companyBlock.querySelector(
        'a[data-field="experience_company_logo"] div.t-bold span[aria-hidden="true"]'
    );
    // 2) If that fails, try the standard anchor used on single-position blocks
    if (!el) {
        el = companyBlock.querySelector(
            'a.optional-action-target-wrapper.display-flex.flex-column.full-width div.t-bold span[aria-hidden="true"]'
        );
    }
    // 3) If that still fails, try any .t-bold + aria-hidden
    if (!el) {
        el = companyBlock.querySelector('span.t-bold[aria-hidden="true"]');
    }

    return el ? el.textContent.trim() : 'N/A';
}

/**
 * Quickly check if a block *likely* has a job title (so we know it’s a position).
 * This ensures we don’t treat skill “blocks” or other expansions as positions.
 */
function hasJobTitle(block) {
    // Searching for typical jobTitle patterns. If we find one, it’s presumably a real job item:
    const jobTitleCandidate = block.querySelector(`
        div.display-flex.align-items-center.mr1.hoverable-link-text.t-bold span[aria-hidden="true"],
        div.t-bold span[aria-hidden="true"],
        span.t-bold[aria-hidden="true"]
    `);
    return !!jobTitleCandidate;
}

/**
 * Extract jobTitle, duration, location from a single "position" block.
 * @param {HTMLElement} positionBlock - The DOM node for one role
 * @param {string} fallbackCompany    - Parent company's name
 */
function parsePosition(positionBlock, fallbackCompany) {
    let jobTitle = 'N/A';
    let duration = 'N/A';
    let location = 'N/A';

    // -- More flexible job-title search --
    const jobTitleEl = positionBlock.querySelector(`
        div.display-flex.align-items-center.mr1.hoverable-link-text.t-bold span[aria-hidden="true"],
        div.t-bold span[aria-hidden="true"],
        span.t-bold[aria-hidden="true"]
    `);
    if (jobTitleEl) {
        jobTitle = jobTitleEl.textContent.trim();
    }

    // Duration is typically the first aria-hidden span under .t-14.t-normal.t-black--light
    const durationEl = positionBlock.querySelector(
        'span.t-14.t-normal.t-black--light span[aria-hidden="true"]'
    );
    if (durationEl) {
        duration = durationEl.textContent.trim();
    }

    // Location often is the second aria-hidden span
    const locationEl = positionBlock.querySelector(
        'span.t-14.t-normal.t-black--light span[aria-hidden="true"]:nth-of-type(2)'
    );
    if (locationEl) {
        location = locationEl.textContent.trim();
    }

    // Use the parent's fallback for the company name
    const company = fallbackCompany || 'N/A';

    return { jobTitle, company, duration, location };
}

// Listener for your extension message
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scrapeProfile") {
        const data = scrapeExperiences();
        sendResponse(data);
    }
});