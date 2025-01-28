// content.js
console.log("Content script is running.");

function scrapeExperiences() {
    const experiences = [];

    // 1) Find the main "#experience" div, move up to the containing <section>.
    const experienceDiv = document.querySelector('#experience');
    if (!experienceDiv) {
        console.log('No #experience element found on this page.');
        return experiences;
    }
    const experienceSection = experienceDiv.closest('section.artdeco-card');
    if (!experienceSection) {
        console.log('Could not find a parent <section> for #experience.');
        return experiences;
    }

    // 2) Each top-level "profile-component-entity" typically represents a company container
    //    which might have one or multiple sub-positions.
    const companyBlocks = experienceSection.querySelectorAll(
        'div[data-view-name="profile-component-entity"]'
    );

    companyBlocks.forEach((companyBlock) => {
        // Try to grab a parent-level company name
        const parentCompanyElement = companyBlock.querySelector(
            // This is where LinkedIn typically shows the company's name at the top
            'div.display-flex.align-items-center.mr1.hoverable-link-text.t-bold span[aria-hidden="true"]'
        );

        const fallbackCompany = parentCompanyElement?.textContent.trim() || 'N/A';

        // Now parse all roles (positions) inside this same block.
        // Sometimes there's just 1 role, sometimes multiple nested ones.
        // We'll handle them individually.
        const subPositionBlocks = companyBlock.querySelectorAll(
            'div[data-view-name="profile-component-entity"]'
        );

        // If there's no nested sub-position, then 'subPositionBlocks' will just be 1 (the block itself).
        subPositionBlocks.forEach((positionBlock) => {
            // Attempt to find a local job title
            const jobTitleElement = positionBlock.querySelector(
                'div.display-flex.align-items-center.mr1.hoverable-link-text.t-bold span[aria-hidden="true"]'
            );
            const jobTitle = jobTitleElement?.textContent.trim() || 'N/A';

            // If we can find a more specific local company name, we use it.
            // Otherwise, we inherit from the fallback (parent) company name.
            const localCompanyElement = positionBlock.querySelector(
                'div.display-flex.align-items-center.mr1.hoverable-link-text.t-bold span[aria-hidden="true"]'
            );
            const company = localCompanyElement?.textContent.trim() || fallbackCompany;

            // Grab typical metadata like duration, location, etc.
            const durationElement = positionBlock.querySelector(
                'span.t-14.t-normal.t-black--light span[aria-hidden="true"]'
            );
            const locationElement = positionBlock.querySelector(
                'span.t-14.t-normal.t-black--light span[aria-hidden="true"]:nth-of-type(2)'
            );
            const duration = durationElement?.textContent.trim() || 'N/A';
            const location = locationElement?.textContent.trim() || 'N/A';

            // Only push if we actually found a job title or some info
            experiences.push({ jobTitle, company, duration, location });
        });
    });

    console.log("Scraped experiences:", experiences);
    return experiences;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scrapeProfile") {
        const data = scrapeExperiences();
        sendResponse(data);
    }
});
