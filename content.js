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

    // 3) Filter to top-level blocks: no parent "profile-component-entity" AND looks like it has a job title
    const topLevelBlocks = [...allBlocks].filter((block) => {
        const parentBlock = block.parentElement?.closest('div[data-view-name="profile-component-entity"]');
        if (parentBlock) return false; // skip if nested

        return hasJobTitle(block);
    });

    // 4) Parse each top-level block
    topLevelBlocks.forEach((companyBlock) => {
        // Attempt to get the "parent" company name for these positions
        const fallbackCompany = getCompanyName(companyBlock);

        // 5) Sub-blocks (child positions) under the same companyBlock
        const childBlocks = [...companyBlock.querySelectorAll('div[data-view-name="profile-component-entity"]')]
            .filter((b) => b !== companyBlock) // exclude the block itself
            .filter(hasJobTitle);

        // If no sub-positions, treat companyBlock as a single position
        if (childBlocks.length === 0) {
            const singlePosition = parsePosition(companyBlock, fallbackCompany);
            if (singlePosition.jobTitle !== 'N/A' || singlePosition.company !== 'N/A') {
                experiences.push(singlePosition);
            }
        } else {
            // Otherwise parse each sub-position
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
 * Returns a "fallback" company name for a top-level companyBlock.
 * Because LinkedIn's DOM varies, we try multiple selectors.
 */
function getCompanyName(companyBlock) {
    // --- Attempt #1 ---
    // The "classic" approach: look for a link with data-field="experience_company_logo"
    // that has a bold span. E.g. single-company single-position entries often appear here
    let el = companyBlock.querySelector(
        'a[data-field="experience_company_logo"] div.t-bold span[aria-hidden="true"]'
    );

    // --- Attempt #2 ---
    // Single-position blocks sometimes have a link with the classes below
    if (!el) {
        el = companyBlock.querySelector(
            'a.optional-action-target-wrapper.display-flex.flex-column.full-width div.t-bold span[aria-hidden="true"]'
        );
    }

    // --- Attempt #3 ---
    // If we still haven't found it, try any bold text in the block
    let company = el ? el.textContent.trim() : 'N/A';

    // --- Attempt #4 ---
    // If still "N/A," try to parse the <img alt="Something-logo"> from
    // the anchor that has data-field="experience_company_logo"
    // E.g. alt="Amrop Norge-logo"
    if (company === 'N/A') {
        const logoImg = companyBlock.querySelector(
            'a[data-field="experience_company_logo"] img[alt*="-logo"]'
        );
        if (logoImg) {
            const altText = logoImg.getAttribute('alt');
            if (altText) {
                // e.g. "Amrop Norge-logo" => "Amrop Norge"
                company = altText.replace(/-logo$/i, '').trim();
            }
        }
    }

    // --- Attempt #5 ---
    // If STILL "N/A," check for that second line that often looks like
    //     <span class="t-14 t-normal">
    //       <span aria-hidden="true">Amrop · Heltid</span>
    //     </span>
    // or “Porter AS (Porterbuddy) · Konsulent”
    if (company === 'N/A') {
        const secondLine = companyBlock.querySelector('span.t-14.t-normal > span[aria-hidden="true"]');
        if (secondLine) {
            let text = secondLine.textContent.trim();  // e.g. "Amrop · Heltid"
            if (text.includes(' · ')) {
                // Grab everything before the " · " so we skip the job type
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
 * Checks if a block has a job title-like element (so we skip skill/media blocks).
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
 * Parse a single position's data: jobTitle, company, duration, location.
 * If fallbackCompany is "N/A," we do an extra pass to find a second bold span
 * that might be the organization name (especially for board roles).
 */
function parsePosition(positionBlock, fallbackCompany) {
    let jobTitle = 'N/A';
    let company = fallbackCompany || 'N/A';
    let duration = 'N/A';
    let location = 'N/A';

    // -- 1) Job Title --
    const jobTitleEl = positionBlock.querySelector(`
    div.display-flex.align-items-center.mr1.hoverable-link-text.t-bold span[aria-hidden="true"],
    div.t-bold span[aria-hidden="true"],
    span.t-bold[aria-hidden="true"]
  `);
    if (jobTitleEl) {
        jobTitle = jobTitleEl.textContent.trim();
    }

    // -- 2) Gather lines of "light text" (often date + location) --
    //    e.g. <span class="t-14 t-normal t-black--light">
    //           <span aria-hidden="true">jan. 2020 - nå …</span>
    //         </span>
    //         <span class="t-14 t-normal t-black--light">
    //           <span aria-hidden="true">Oslo, Norway · På kontoret</span>
    //         </span>
    const lightLines = [
        ...positionBlock.querySelectorAll('span.t-14.t-normal.t-black--light'),
    ];

    // Extract text from each line’s <span aria-hidden="true">
    const textLines = lightLines.map((line) => {
        const hiddenSpan = line.querySelector('span[aria-hidden="true"]');
        return hiddenSpan ? hiddenSpan.textContent.trim() : '';
    });

    // Typically textLines[0] is the date-range, textLines[1] is the location
    if (textLines[0]) duration = textLines[0];

    if (textLines.length > 1 && textLines[1]) {
        // We might get "Oslo, Norway · På kontoret", so split at " · "
        const locParts = textLines[1].split(' · ');
        location = locParts[0].trim(); // e.g. "Oslo, Norway"
    }

    // -- 3) If company is still "N/A," do a more thorough fallback lookup --
    if (!company || company === 'N/A') {
        company = getCompanyName(positionBlock);
    }

    return { jobTitle, company, duration, location };
}

// Example: extension message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scrapeProfile") {
        const data = scrapeExperiences();
        sendResponse(data);
    }
});