// Define default prompt text for each prompt
const defaultPrompts = {
    prompt1: `You are an AI assistant that summarizes LinkedIn profiles for a headhunter. Given the following profile data in JSON format, please provide the following sections in plain text:

1. **About**
- If the "about" section is present in the input, provide a five to ten-sentence summary of the person based on that information.
- If the "about" section is missing, create a five to ten-sentence summary of the person using the available data from the "experiences" section.

2. **Experiences**
- A list formatted similarly to LinkedIn's, with each item including the job title, company, duration, and location. For example:
    - Senior Recruiter at McKinsey & Company. 2 years 11 months. Oslo, Norway.

3. **Companies**
- A bullet-point list of each company, with a short paragraph (5-10 sentences) about each company. Include facts like sector, revenue, and what it does. If specific information is unavailable, dont include it.

Keep the text organized and easy to read. Use line breaks to separate sections and ensure clarity. Keep the language strictly informative. Do not include rich text or markdown; only provide raw text following this exact structure:

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
`,
    prompt2: `You are an AI assistant that extracts and summarizes company information exclusively from a LinkedIn profile's experiences. The input is provided as a JSON object containing an array named "experiences," where each item includes details about the work history—most notably, the company name. Your task is to:

1. Identify every unique company mentioned in the experiences.
2. For each company, generate a concise, plain-text overview that includes any available details (such as industry, location, or notable achievements). If certain details are missing, simply include the company name with a brief inferred context if possible.
3. Present your output as a bullet-point list where each bullet represents a company and its overview.

Do not include any general summary of the candidate’s skills or personal background—focus solely on the companies and their relevant details.

Input:
`,

    prompt3: `You are an AI assistant that summarizes a LinkedIn profile in plain text. The input is a JSON object containing various sections such as "about", "experiences", "education", and "skills". Your task is to:

1. Analyze the provided profile data.
2. Generate a clear and concise summary that captures the candidate's overall professional background, career highlights, and key skills.
3. Produce a narrative summary in one or two paragraphs without bullet lists or separate sections for companies. Focus on the person's career trajectory rather than detailed company information.

Input:
`
};


// Global state variables
let activePrompt = "prompt1";
let systemPrompts = {};
// This variable holds a deep copy of the settings as loaded initially.
let initialState = null;

// Utility function to update which tab/button is “active”
function updatePromptTabUI() {
    document.querySelectorAll(".prompt-tab").forEach((button) => {
        if (button.dataset.prompt === activePrompt) {
            button.classList.add("active");
        } else {
            button.classList.remove("active");
        }
    });
}

// Function to check whether settings have changed compared to initialState
function checkForChanges() {
    const currentApiKey = document.getElementById("apiKey").value.trim();
    const currentLanguage = document.getElementById("languageSelect").value;
    const currentPromptText = document.getElementById("systemPromptText").value;
    // Update systemPrompts for the active prompt
    systemPrompts[activePrompt] = currentPromptText;

    // Compare systemPrompts using JSON.stringify for a deep comparison
    const systemPromptsChanged = JSON.stringify(systemPrompts) !== JSON.stringify(initialState.systemPrompts);
    const apiKeyChanged = currentApiKey !== initialState.apiKey;
    const languageChanged = currentLanguage !== initialState.language;
    const activePromptChanged = activePrompt !== initialState.activePrompt;

    const changes = apiKeyChanged || languageChanged || activePromptChanged || systemPromptsChanged;

    const saveButton = document.getElementById("save");
    if (changes) {
        saveButton.disabled = false;
        saveButton.style.backgroundColor = "#4285f4";
        saveButton.style.cursor = "pointer";
    } else {
        saveButton.disabled = true;
        saveButton.style.backgroundColor = "#dadce0"; // Greyed out
        saveButton.style.cursor = "not-allowed";
    }
}

// On DOMContentLoaded, load settings and set up event listeners
document.addEventListener("DOMContentLoaded", () => {
    // Load all settings at once from chrome.storage
    chrome.storage.sync.get(["apiKey", "language", "systemPrompts", "activePrompt"], (data) => {
        if (data.apiKey) {
            document.getElementById("apiKey").value = data.apiKey;
        }
        if (data.language) {
            document.getElementById("languageSelect").value = data.language;
        }
        systemPrompts = data.systemPrompts || defaultPrompts;
        activePrompt = data.activePrompt || "prompt1";
        updatePromptTabUI();
        document.getElementById("systemPromptText").value =
            systemPrompts[activePrompt] || defaultPrompts[activePrompt];

        // Set initialState as a deep copy of the current state
        initialState = {
            apiKey: data.apiKey || "",
            language: data.language || "",
            activePrompt: activePrompt,
            systemPrompts: JSON.parse(JSON.stringify(systemPrompts))
        };
        checkForChanges();
    });

    // Listen for changes in the API key, language, and system prompt textarea
    document.getElementById("apiKey").addEventListener("input", checkForChanges);
    document.getElementById("languageSelect").addEventListener("change", checkForChanges);
    document.getElementById("systemPromptText").addEventListener("input", checkForChanges);

    // Set up click event listeners for each prompt tab button
    document.querySelectorAll(".prompt-tab").forEach((button) => {
        button.addEventListener("click", () => {
            // Save the current textarea content into the active prompt before switching
            systemPrompts[activePrompt] = document.getElementById("systemPromptText").value;
            // Update the active prompt key based on the button clicked
            activePrompt = button.dataset.prompt;
            updatePromptTabUI();
            // Load the new prompt content into the textarea
            document.getElementById("systemPromptText").value =
                systemPrompts[activePrompt] || defaultPrompts[activePrompt];
            checkForChanges();
        });
    });

    // Save all settings when the Save button is clicked
    document.getElementById("save").addEventListener("click", () => {
        // Save the current textarea content for the active prompt
        systemPrompts[activePrompt] = document.getElementById("systemPromptText").value;

        const apiKey = document.getElementById("apiKey").value.trim();
        const language = document.getElementById("languageSelect").value;

        // Save all settings to chrome.storage.sync
        chrome.storage.sync.set(
            {
                apiKey,
                language,
                systemPrompts,
                activePrompt
            },
            () => {
                if (chrome.runtime.lastError) {
                    console.error("Error saving settings:", chrome.runtime.lastError);
                    alert("An error occurred while saving settings. Please try again.");
                } else {
                    showSnackbar("Settings saved successfully");
                    // After saving, update initialState to reflect the new settings
                    initialState = {
                        apiKey,
                        language,
                        activePrompt,
                        systemPrompts: JSON.parse(JSON.stringify(systemPrompts))
                    };
                    checkForChanges();
                }
            }
        );
    });

    // Restore default text for the currently active prompt when clicked
    document.getElementById("restoreDefaultPrompt").addEventListener("click", () => {
        systemPrompts[activePrompt] = defaultPrompts[activePrompt];
        document.getElementById("systemPromptText").value = defaultPrompts[activePrompt];
        chrome.storage.sync.set({ systemPrompts }, () => {
            if (chrome.runtime && chrome.runtime.lastError) {
                console.error("Error restoring default prompt:", chrome.runtime.lastError);
                showSnackbar("An error occurred while restoring the default prompt. Please try again.");
            } else {
                showSnackbar("Default prompt restored");
                checkForChanges();
            }
        });
    });
});

// Snackbar utility to show messages at the bottom of the screen
function showSnackbar(text) {
    const snack = document.getElementById("snackbar");
    snack.textContent = text;
    snack.className = "show";
    setTimeout(() => {
        snack.className = snack.className.replace("show", "");
    }, 3000);
}