const defaultPrompts = {
    prompt1: {
        name: "Default 1",
        language: "English",
        text: `You are an AI assistant that summarizes LinkedIn profiles for a headhunter. Given the following profile data in JSON format, please provide the following sections in plain text:

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
`
    },
    prompt2: {
        name: "Default 2",
        language: "English",
        text: `You are an AI assistant that extracts and summarizes company information exclusively from a LinkedIn profile's experiences. The input is provided as a JSON object containing an array named "experiences," where each item includes details about the work history—most notably, the company name. Your task is to:

1. Identify every unique company mentioned in the experiences.
2. For each company, generate a concise, plain-text overview that includes any available details (such as industry, location, or notable achievements). If certain details are missing, simply include the company name with a brief inferred context if possible.
3. Present your output as a bullet-point list where each bullet represents a company and its overview.

Do not include any general summary of the candidate’s skills or personal background—focus solely on the companies and their relevant details.

Input:
`
    },
    prompt3: {
        name: "Default 3",
        language: "English",
        text: `You are an AI assistant that summarizes a LinkedIn profile in plain text. The input is a JSON object containing various sections such as "about", "experiences", "education", and "skills". Your task is to:

1. Analyze the provided profile data.
2. Generate a clear and concise summary that captures the candidate's overall professional background, career highlights, and key skills.
3. Produce a narrative summary in one or two paragraphs without bullet lists or separate sections for companies. Focus on the person's career trajectory rather than detailed company information.

Input:
`
    },
    prompt4: {
        name: "Default 4",
        language: "English",
        text: `
        You are an AI assistant helping a headhunter summarize LinkedIn profiles for client presentations. Your task is to create a concise, structured, and experience-focused summary of a candidate’s professional background and education based on available LinkedIn information.

Format:
Experience-focused summary:

Provide a clear and structured overview of the candidate’s most relevant experience, emphasizing leadership roles, responsibilities, and years in key positions.
Use a structured approach, for example:
"The candidate has extensive experience in the energy and industrial sectors. She has held leadership roles at Equinor and Statkraft. She was CEO at [Company] from 2020 to 2024 and has eight years of experience as CFO across [Company A] and [Company B]. She also has consulting experience."
Mention the candidate’s educational background briefly at the end, e.g., "She holds a master’s degree in economics from BI."
List of companies the candidate has worked for:

For each company, provide:
Company name
A brief description of its business
Number of employees
EBIT (retrieved from Proff.no, listed in MNOK without decimals)
Language and tone:
The summary should be clear, structured, and objective, avoiding unnecessary adjectives, speculation, or any information not explicitly stated in the LinkedIn profile.
Ensure varied phrasing across candidates to maintain a natural and professional tone.
The language should be neutral and concise, avoiding overly elaborate or AI-generated phrasing.
Example output:
Summary:
The candidate has extensive experience in the energy and industrial sectors. She has held leadership roles at Equinor and Statkraft. She was CEO at [Company] from 2020 to 2024 and has eight years of CFO experience at [Company A] and [Company B]. She also has a background in consulting. She holds a master’s degree in economics from BI.

Companies the candidate has worked for:

Equinor – Energy company focused on oil, gas, and renewables. Approx. 21,000 employees. EBIT: 470,000 MNOK.
Statkraft – State-owned company specializing in renewable energy. Approx. 5,000 employees. EBIT: 18,000 MNOK.
McKinsey & Company – Global consultancy firm specializing in strategy and leadership. Approx. 30,000 employees worldwide. EBIT: Not available.`
    }
};

document.addEventListener("DOMContentLoaded", function () {
    const modal = document.getElementById("newPromptModal");

    document.getElementById("addPromptButton").addEventListener("click", function () {
        document.getElementById("newPromptModal").style.display = "block";
    });


    document.getElementById("resetAll").addEventListener("click", function () {
        if (confirm("Are you sure you want to reset all prompt data to factory settings?")) {
            chrome.storage.sync.set({
                systemPrompts: defaultPrompts,
                activePrompt: "prompt1"
            }, function () {
                if (chrome.runtime.lastError) {
                    console.error("Error resetting data:", chrome.runtime.lastError);
                    showSnackbar("Error resetting data. Please try again.");
                } else {
                    showSnackbar("Prompt data reset to factory settings.");

                    // Update the global variables.
                    systemPrompts = JSON.parse(JSON.stringify(defaultPrompts));
                    activePrompt = "prompt1";

                    // Update the UI for prompts, leaving the API key unchanged.
                    document.getElementById("systemPromptText").value = defaultPrompts["prompt1"].text;
                    document.getElementById("languageSelect").value = defaultPrompts["prompt1"].language;
                    populatePromptTabs();
                    checkForChanges();
                }
            });
        }
    });

    chrome.storage.sync.get(["apiKey", "systemPrompts", "activePrompt"], function (data) {
        const apiKeyInput = document.getElementById("apiKey");
        const promptTextArea = document.getElementById("systemPromptText");
        const languageSelect = document.getElementById("languageSelect");

        if (data.apiKey) {
            apiKeyInput.value = data.apiKey;
        }
        systemPrompts = data.systemPrompts || defaultPrompts;
        activePrompt = data.activePrompt || "prompt1";
        updatePromptTabUI();

        promptTextArea.value =
            (systemPrompts[activePrompt] && systemPrompts[activePrompt].text) ||
            defaultPrompts[activePrompt].text;
        languageSelect.value =
            (systemPrompts[activePrompt] && systemPrompts[activePrompt].language) ||
            defaultPrompts[activePrompt].language;
        if (!systemPrompts[activePrompt].name) {
            systemPrompts[activePrompt].name = defaultPrompts[activePrompt].name || activePrompt;
        }

        // Save the initial state for change detection.
        initialState = {
            apiKey: data.apiKey || "",
            activePrompt: activePrompt,
            systemPrompts: JSON.parse(JSON.stringify(systemPrompts)),
        };

        checkForChanges();
        populatePromptTabs();
    });

    document.getElementById("apiKey").addEventListener("input", checkForChanges);
    document.getElementById("languageSelect").addEventListener("change", checkForChanges);
    document.getElementById("systemPromptText").addEventListener("input", checkForChanges);

    document.getElementById("save").addEventListener("click", function () {
        const apiKeyInput = document.getElementById("apiKey");
        const promptTextArea = document.getElementById("systemPromptText");
        const languageSelect = document.getElementById("languageSelect");

        systemPrompts[activePrompt] = {
            language: languageSelect.value,
            text: promptTextArea.value,
            name: systemPrompts[activePrompt].name || defaultPrompts[activePrompt].name || activePrompt,
        };

        const apiKey = apiKeyInput.value.trim();

        chrome.storage.sync.set({
            apiKey: apiKey,
            systemPrompts: systemPrompts,
            activePrompt: activePrompt,
        }, function () {
            if (chrome.runtime.lastError) {
                console.error("Error saving settings:", chrome.runtime.lastError);
                alert("An error occurred while saving settings. Please try again.");
            } else {
                showSnackbar("Settings saved successfully");
                initialState = {
                    apiKey: apiKey,
                    activePrompt: activePrompt,
                    systemPrompts: JSON.parse(JSON.stringify(systemPrompts)),
                };
                checkForChanges();
            }
        });
    });

    document.getElementById("restoreDefaultPrompt").addEventListener("click", function () {
        const promptTextArea = document.getElementById("systemPromptText");
        const languageSelect = document.getElementById("languageSelect");

        systemPrompts[activePrompt] = defaultPrompts[activePrompt];
        promptTextArea.value = defaultPrompts[activePrompt].text;
        languageSelect.value = defaultPrompts[activePrompt].language;
        chrome.storage.sync.set({ systemPrompts: systemPrompts }, function () {
            if (chrome.runtime && chrome.runtime.lastError) {
                console.error("Error restoring default prompt:", chrome.runtime.lastError);
                showSnackbar("An error occurred while restoring the default prompt. Please try again.");
            } else {
                showSnackbar("Default prompt restored");
                checkForChanges();
            }
        });
    });

    const newPromptForm = document.getElementById("newPromptForm");
    newPromptForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const promptNameInput = document.getElementById("promptName");
        const promptTextInput = document.getElementById("promptText");
        const promptLanguageSelect = document.getElementById("promptLanguage");

        const promptName = promptNameInput.value.trim();
        const promptText = promptTextInput.value.trim();
        const promptLanguage = promptLanguageSelect.value;

        if (promptName && promptText && promptLanguage) {
            // Add the new prompt to the global systemPrompts.
            systemPrompts[promptName] = {
                name: promptName,
                text: promptText,
                language: promptLanguage,
            };

            // Re-populate the prompt tabs to include the new prompt.
            populatePromptTabs();

            // Clear form fields and close the modal.
            promptNameInput.value = "";
            promptTextInput.value = "";
            promptLanguageSelect.value = "English";
            modal.style.display = "none";
        }
    });
});

// Global state variables
let activePrompt = "prompt1";
let systemPrompts = {};
let initialState = null;

function updatePromptTabUI() {
    document.querySelectorAll(".prompt-tab").forEach((button) => {
        if (button.dataset.prompt === activePrompt) {
            button.classList.add("active");
        } else {
            button.classList.remove("active");
        }
    });
}

function checkForChanges() {
    const apiKey = document.getElementById("apiKey").value.trim();
    const promptText = document.getElementById("systemPromptText").value;
    const languageSelect = document.getElementById("languageSelect");

    systemPrompts[activePrompt] = {
        language: languageSelect.value,
        text: promptText,
        name: systemPrompts[activePrompt].name || defaultPrompts[activePrompt].name || activePrompt,
    };

    const systemPromptsChanged =
        JSON.stringify(systemPrompts) !== JSON.stringify(initialState.systemPrompts);
    const apiKeyChanged = apiKey !== initialState.apiKey;
    const activePromptChanged = activePrompt !== initialState.activePrompt;

    const changes = apiKeyChanged || activePromptChanged || systemPromptsChanged;

    const saveButton = document.getElementById("save");
    if (changes) {
        saveButton.disabled = false;
        saveButton.classList.add("active");
    } else {
        saveButton.disabled = true;
        saveButton.classList.remove("active");
    }
}

function enableTabEdit(tabButton) {
    const labelSpan = tabButton.querySelector(".prompt-label");
    if (!labelSpan) return;
    const currentName = labelSpan.textContent;
    const input = document.createElement("input");
    input.type = "text";
    input.value = currentName;
    input.className = "prompt-edit-input";
    tabButton.replaceChild(input, labelSpan);
    input.focus();

    input.addEventListener("blur", function () {
        finishEditing(tabButton, input.value);
    });
    input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            input.blur();
        }
    });
}

function finishEditing(tabButton, newName) {
    const newLabel = document.createElement("span");
    newLabel.className = "prompt-label";
    newLabel.textContent = newName;
    const input = tabButton.querySelector("input.prompt-edit-input");
    if (input) {
        tabButton.replaceChild(newLabel, input);
    }
    const key = tabButton.dataset.prompt;
    if (systemPrompts[key]) {
        systemPrompts[key].name = newName;
    }
    chrome.storage.sync.set({ systemPrompts: systemPrompts }, function () {
        if (chrome.runtime.lastError) {
            console.error("Error updating prompt name:", chrome.runtime.lastError);
        } else {
            console.log("Prompt name updated in storage");
        }
    });
    checkForChanges();
}

function attachEditIconListener(tabButton) {
    const editIcon = tabButton.querySelector(".edit-icon");
    if (editIcon) {
        editIcon.addEventListener("click", function (e) {
            e.stopPropagation();
            enableTabEdit(tabButton);
        });
    }
}

function populatePromptTabs() {
    const promptTabsContainer = document.querySelector(".prompt-tabs");
    promptTabsContainer.innerHTML = ""; // Clear previous tabs

    // Build an ordered list of keys: default prompts always come first.
    const defaultKeys = Object.keys(defaultPrompts).filter(key => systemPrompts.hasOwnProperty(key));
    const customKeys = Object.keys(systemPrompts).filter(key => !defaultPrompts.hasOwnProperty(key));
    const orderedKeys = [...defaultKeys, ...customKeys];

    orderedKeys.forEach((key) => {
        const promptData = systemPrompts[key];
        const button = document.createElement("button");
        button.type = "button";
        button.className = "prompt-tab";
        button.dataset.prompt = key;

        const labelSpan = document.createElement("span");
        labelSpan.className = "prompt-label";
        labelSpan.textContent = promptData.name || key;
        button.appendChild(labelSpan);

        const deleteIcon = document.createElement("span");
        deleteIcon.className = "material-icons delete-icon";
        deleteIcon.textContent = "close";
        button.appendChild(deleteIcon);

        const editIcon = document.createElement("span");
        editIcon.className = "material-icons edit-icon";
        editIcon.textContent = "edit";
        button.appendChild(editIcon);

        // When a tab is clicked, switch to that prompt.
        button.addEventListener("click", function () {
            const promptTextArea = document.getElementById("systemPromptText");
            const languageSelect = document.getElementById("languageSelect");
            // Save current prompt text.
            systemPrompts[activePrompt].text = promptTextArea.value;
            // Switch active prompt.
            activePrompt = button.dataset.prompt;
            updatePromptTabUI();

            promptTextArea.value = systemPrompts[activePrompt].text || "";
            languageSelect.value = systemPrompts[activePrompt].language || "English";
            checkForChanges();
        });

        // Attach the edit and delete listeners.
        attachEditIconListener(button);
        attachDeleteIconListener(button);

        promptTabsContainer.appendChild(button);
    });
    updatePromptTabUI();
}

function attachDeleteIconListener(tabButton) {
    const deleteIcon = tabButton.querySelector(".delete-icon");
    if (deleteIcon) {
        deleteIcon.addEventListener("click", function (e) {
            e.stopPropagation();
            const key = tabButton.dataset.prompt;
            if (confirm(`Are you sure you want to delete the prompt "${systemPrompts[key].name}"?`)) {
                // Remove the prompt from systemPrompts.
                delete systemPrompts[key];

                // If the deleted prompt was active, switch to another prompt if available.
                if (activePrompt === key) {
                    const remainingPrompts = Object.keys(systemPrompts);
                    activePrompt = remainingPrompts.length > 0 ? remainingPrompts[0] : "";

                    // Update the prompt text and language if there is an active prompt.
                    const promptTextArea = document.getElementById("systemPromptText");
                    const languageSelect = document.getElementById("languageSelect");
                    if (activePrompt) {
                        promptTextArea.value = systemPrompts[activePrompt].text || "";
                        languageSelect.value = systemPrompts[activePrompt].language || "English";
                    } else {
                        promptTextArea.value = "";
                        languageSelect.value = "English";
                    }
                }

                // Save the updated prompts (and active prompt) to storage.
                chrome.storage.sync.set({ systemPrompts: systemPrompts, activePrompt: activePrompt }, function () {
                    if (chrome.runtime.lastError) {
                        console.error("Error deleting prompt:", chrome.runtime.lastError);
                    } else {
                        showSnackbar("Prompt deleted successfully");
                        populatePromptTabs();
                        checkForChanges();
                    }
                });
            }
        });
    }
}

function showSnackbar(text) {
    const snack = document.getElementById("snackbar");
    snack.textContent = text;
    snack.className = "show";
    setTimeout(function () {
        snack.className = snack.className.replace("show", "");
    }, 3000);
}