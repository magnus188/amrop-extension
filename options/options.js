const initialPrompt = `You are an AI assistant that summarizes LinkedIn profiles for a headhunter. Given the following profile data in JSON format, please provide the following sections in plain text:

1. **About**
- If the "about" section is present in the input, provide a five to ten-sentence summary of the person based on that information.
- If the "about" section is missing, create a five to ten-sentence summary of the person using the available data from the "experiences" section.

2. **Experiences**
- A list formatted similarly to LinkedIn's, with each item including the job title, company, duration, and location. For example:
    - Senior Recruiter at McKinsey & Company. 2 years 11 months. Oslo, Norway.

3. **Companies**
- A bullet-point list of each company, with a short paragraph (5-10 sentences) about each company. Include facts like sector, revenue, and what it does. If specific information is unavailable, dont include it.

**Keep the text organized and easy to read. Use line breaks to separate sections and ensure clarity. Keep the language strictly informative. Do not include rich text or markdown; only provide raw text following this exact structure:**

About
[A short summary here]

Experiences
- [Experience 1]
- [Experience 2]
- ...

Companies
- [Company 1 overview]
- [Company 2 overview]
- ...

Input:
`;

document.addEventListener('DOMContentLoaded', () => {

    // Load saved settings
    chrome.storage.sync.get(['apiKey', 'language', 'promptInstruction'], (data) => {
        // Set Gemini API Key
        if (data.apiKey) {
            document.getElementById('apiKey').value = data.apiKey;
        }

        // Set Output Language
        if (data.language) {
            const languageSelect = document.getElementById('languageSelect');
            if (languageSelect) {
                languageSelect.value = data.language;
            }
        }

        // Set LLM Initial Prompt Instruction
        if (data.promptInstruction) {
            document.getElementById('promptInstruction').value = data.promptInstruction;
        } else {
            // If no saved prompt, set to default
            document.getElementById('promptInstruction').value = initialPrompt;
        }

    });
    // Save Settings
    document.getElementById('save').addEventListener('click', () => {
        const apiKey = document.getElementById('apiKey').value.trim();
        const language = document.getElementById('languageSelect').value;
        const promptInstruction = document.getElementById('promptInstruction').value.trim();

        // Prepare the settings object
        const settings = {
            apiKey,
            language,
            promptInstruction
        };

        // Save settings to chrome.storage.sync
        chrome.storage.sync.set(settings, () => {
            if (chrome.runtime.lastError) {
                console.error('Error saving settings:', chrome.runtime.lastError);
                alert('An error occurred while saving settings. Please try again.');
            } else {
                showSnackbar("Settings saved successfully")

            }
        });
    });
});

// Restore Default Prompt
document.getElementById('restoreDefault').addEventListener('click', () => {

    // Set the textarea to the default prompt
    document.getElementById('promptInstruction').value = initialPrompt;

    // Save the default prompt to storage
    chrome.storage.sync.set({ promptInstruction: initialPrompt }, () => {
        if (chrome.runtime.lastError) {
            console.error('Error restoring default prompt:', chrome.runtime.lastError);
            showSnackbar('An error occurred while restoring the default prompt. Please try again.');
        }
        else {
            showSnackbar("Default prompt restored")
        }
    });
});


function showSnackbar(text) {
    const snack = document.getElementById("snackbar");
    snack.textContent = text
    snack.className = "show";
    setTimeout(function () { snack.className = snack.className.replace("show", ""); }, 3000);
}