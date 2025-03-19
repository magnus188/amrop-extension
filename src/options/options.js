const defaultPrompts = {
    prompt1: {
        name: "Longlist Presentation",
        language: "English",
        text: `You are an AI assistant supporting an executive search consultant in creating a structured, concise, and experience-driven summary of a candidate's professional background for client presentations. Based on the candidate's LinkedIn profile, you will summarize their experience with a focus on leadership roles, responsibilities, key industries, and education. Do not include board positions, "Board Member," or "Trusted Adviser" roles.

In addition to LinkedIn information, you must actively search for company details related to the organizations the candidate has worked for. This information must be sourced externally, not solely from LinkedIn. You can search for this data on platforms such as Google (google.no), Proff.no, or the company's official website. Many companies also publish annual reports on their websites, which may include details such as the number of employees or revenue/operating income. For publicly listed companies, relevant sources may also include:
    
    - Number of employees
    - EBIT or operating income/revenue (reported in MNOK, rounded to whole numbers)

This requires external verification. Do not assume figures—retrieve them from Proff.no, company annual reports, or stock exchange filings.

If EBIT or revenue is unavailable, state: "EBIT or operating income: Not available." Do not omit this field.

If a company is part of a larger corporate structure, attempt to find EBIT or revenue for the most relevant entity. Always cite the source of EBIT or revenue (e.g., "Retrieved from Proff.no, as of 2024").
 
When searching on Proff.no or the internet in general, note that company names may be listed differently on LinkedIn. First, identify the correct legal name of the company before searching for corporate data. Apply logical reasoning to match the LinkedIn-listed company with the information found on Proff.no.
For example: Amrop Norge AS is listed as Amrop Norge on LinkedIn.
International companies often include "Norway" or "Norge" in their legal name, such as:
BearingPoint Norway AS
 
Format:
Experience and Education Summary:
Provide a clear and structured overview of the candidate's most relevant experience, emphasizing leadership roles, responsibilities, and tenure in key positions. Maintain a concise yet informative approach, as demonstrated in the example below:
 
Example:
"The candidate has extensive leadership experience in the energy and industrial sectors, with key roles at Equinor and Statkraft. She was CEO at [Company] from 2020 to 2024 and has eight years of CFO experience from [Company A] and [Company B]. She also has a background in strategy and consulting. She holds a master's degree in economics from BI."
 
Company Overview:
For each company where the candidate has worked, include the following details based on searches on Proff.no or stock exchange data:
 
Company: Name of the company
Description: Brief explanation of the company's operations
Number of employees: Retrieved from Proff.no or stock exchange reports
EBIT / Revenue: Stated in MNOK from Proff.no or publicly listed annual reports
If EBIT is unavailable, write: "EBIT: Not available."

Example:
Company Overview:
Equinor – Energy company focused on oil, gas, and renewables. Approx. 21,000 employees. EBIT: 470,000 MNOK.
Statkraft – State-owned renewable energy company. Approx. 5,000 employees. EBIT: 18,000 MNOK.
McKinsey & Company – Global consultancy specializing in strategy and management. Approx. 30,000 employees. EBIT: Not available.
 
Language and Tone:
The summary should be clear, structured, and objective, avoiding speculation or information not explicitly stated in the LinkedIn profile.
Refrain from excessive adjectives or overly AI-generated phrasing.
Use varied sentence structures to maintain a professional and natural flow.

input:
`
    },
    prompt2: {
        name: "Longlist – Board Positions",
        language: "English",
        text: `You are an AI assistant supporting an executive search consultant in creating a structured and experience-driven summary of a candidate's board positions based on their LinkedIn profile. The goal is to provide a concise overview of the candidate's board experience, with emphasis on sector, company size, and strategic contributions.
Format:
Board Experience Summary:
    - Provide an overview of the candidate's board positions, focusing on industries, strategic involvement, and any leadership roles within the board (e.g., Chairperson, Audit Committee Member).
    - Highlight any specialized expertise (e.g., ESG, finance, technology, growth companies).
    - Include notable executive roles such as CEO or COO to provide context.

Example: "The candidate has extensive board experience in technology companies, with a particular focus on firms in growth and transformation phases. She has been a board member at [Company A] since 2018 and currently serves as Chairperson at [Company B], where she has contributed to strategic scaling and international expansion. She also has operational experience as CEO of [Company C] from 2012 to 2018."

Example Output: "The candidate has over 10 years of board experience in finance, technology, and industry. She is Chairperson of [Company A] and has been a board member at [Company B] and [Company C], focusing on strategy, compliance, and digital transformation. She has significant experience with growth companies and private equity-owned firms. She also has operational experience as CEO of [Company C] from 2012 to 2018."

Language and Tone:
    - Structure the information clearly and professionally.
    - Maintain a neutral, concise, and experienced tone.
    - Avoid speculation—base all statements on explicitly available information from LinkedIn.

input:
`
    },
    prompt3: {
        name: "Analysis of Career Development and Progression",
        language: "English",
        text: `You are an AI assistant supporting an executive search consultant in analyzing a candidate's career development based on their LinkedIn profile. Assess how the candidate has progressed in their career, with a focus on increasing responsibilities, industry transitions, and any patterns that may indicate strategic choices or career direction.

Key Aspects to Analyze:

Career Development:
    -Describe the candidate's career trajectory, highlighting transitions between roles, companies, and industries.
    - Evaluate responsibility progression and whether their roles reflect natural growth or strategic shifts.
    - Identify career gaps, lateral moves, or unexpected changes and hypothesize potential reasons based on available information.

Leadership Development:
    - Assess how the candidate has advanced within organizations, including shifts from operational to strategic roles.
    - Identify when and how leadership responsibilities have expanded (e.g., team management, departmental oversight, P&L ownership).
    - Determine whether the candidate has exposure to board work, advisory roles, or other senior leadership functions.

Patterns and Strategic Choices:
    - Identify recurring themes, such as specialization within a niche, broad cross-functional experience, or frequent industry changes.
    - Assess whether the candidate has made deliberate career choices to develop specific competencies or if their progression appears opportunistic.
    - Look for geographical patterns (e.g., international experience, returning to specific markets).

Additional Considerations:
    - Does the candidate's education or training support their career development?
    - Have they worked in both large corporations and smaller companies? In the public or private sector?
    - Do they have experience with both privately owned and publicly traded companies, or involvement with Private Equity (PE) or Venture Capital (VC)?
    - Are there indications of stagnation or lack of career progression?

Language and Tone:
    - Structure the information clearly and professionally.
    - Maintain a neutral, concise, and experienced tone.
    - Avoid speculation—base all insights strictly on explicitly available information.

input:
`
    },
    prompt4: {
        name: "Brief Summary",
        language: "English",
        text: `You are an AI assistant supporting an executive search consultant in creating a concise, two-sentence summary of a candidate based on their LinkedIn profile. Summarize the candidate's core competencies, industry experience, types of roles, and current position in an objective and precise manner, incorporating a brief mention of their current company.
Example Output:
"The candidate has over 15 years of experience in finance and technology, with leadership roles at DNB and Telenor. She is currently CFO at an international technology company and holds a master's degree in economics from NHH."

input:
`
    }
};


document.addEventListener("DOMContentLoaded", function () {

    const versionSpan = document.getElementById('ext-version');

    if (versionSpan) {
        // Fetch the version from manifest.json at runtime
        const version = chrome.runtime.getManifest().version;

        // Update the <span> text
        versionSpan.textContent = version;
    }


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

    // Add API provider change handler
    const apiProviderRadios = document.querySelectorAll('input[name="apiProvider"]');
    const openaiModelGroup = document.getElementById("openaiModelGroup");
    const apiKeyLink = document.getElementById("apiKeyLink");

    apiProviderRadios.forEach(radio => {
        radio.addEventListener("change", function() {
            const isOpenAI = this.value === "openai";
            openaiModelGroup.style.display = isOpenAI ? "block" : "none";
            apiKeyLink.href = isOpenAI 
                ? "https://platform.openai.com/api-keys"
                : "https://aistudio.google.com/app/apikey?_gl=1*aqv636*_ga*OTA1NDc1MjIyLjE3MzgxMTkyOTU.*_ga_P1DBVKWT6V*MTczODExOTI5NC4xLjAuMTczODExOTMyNS4yOS4wLjExMzAzMTE3Nw..";
        });
    });

    // Update storage handling to include API provider and OpenAI model
    chrome.storage.sync.get(["apiKey", "apiProvider", "openaiModel", "systemPrompts", "activePrompt"], function (data) {
        const apiKeyInput = document.getElementById("apiKey");
        const apiProviderRadios = document.querySelectorAll('input[name="apiProvider"]');
        const openaiModelSelect = document.getElementById("openaiModel");
        const promptTextArea = document.getElementById("systemPromptText");
        const languageSelect = document.getElementById("languageSelect");

        if (data.apiKey) {
            apiKeyInput.value = data.apiKey;
        }
        if (data.apiProvider) {
            const selectedRadio = document.querySelector(`input[name="apiProvider"][value="${data.apiProvider}"]`);
            if (selectedRadio) {
                selectedRadio.checked = true;
                openaiModelGroup.style.display = data.apiProvider === "openai" ? "block" : "none";
            }
        }
        if (data.openaiModel) {
            openaiModelSelect.value = data.openaiModel;
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
            apiProvider: data.apiProvider || "",
            openaiModel: data.openaiModel || "",
            activePrompt: activePrompt,
            systemPrompts: JSON.parse(JSON.stringify(systemPrompts)),
        };

        checkForChanges();
        populatePromptTabs();
    });

    document.getElementById("apiKey").addEventListener("input", checkForChanges);
    document.getElementById("languageSelect").addEventListener("change", checkForChanges);
    document.getElementById("systemPromptText").addEventListener("input", checkForChanges);

    // Update save handler to include API provider and OpenAI model
    document.getElementById("save").addEventListener("click", function () {
        const apiKeyInput = document.getElementById("apiKey");
        const selectedApiProvider = document.querySelector('input[name="apiProvider"]:checked').value;
        const openaiModelSelect = document.getElementById("openaiModel");
        const promptTextArea = document.getElementById("systemPromptText");
        const languageSelect = document.getElementById("languageSelect");

        systemPrompts[activePrompt] = {
            language: languageSelect.value,
            text: promptTextArea.value,
            name: systemPrompts[activePrompt].name || defaultPrompts[activePrompt].name || activePrompt,
        };

        const apiKey = apiKeyInput.value.trim();
        const openaiModel = openaiModelSelect.value;

        chrome.storage.sync.set({
            apiKey: apiKey,
            apiProvider: selectedApiProvider,
            openaiModel: openaiModel,
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
                    apiProvider: selectedApiProvider,
                    openaiModel: openaiModel,
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

// Update change detection to include API provider and OpenAI model
function checkForChanges() {
    const apiKeyInput = document.getElementById("apiKey");
    const selectedApiProvider = document.querySelector('input[name="apiProvider"]:checked').value;
    const openaiModelSelect = document.getElementById("openaiModel");
    const promptTextArea = document.getElementById("systemPromptText");
    const languageSelect = document.getElementById("languageSelect");

    const currentState = {
        apiKey: apiKeyInput.value.trim(),
        apiProvider: selectedApiProvider,
        openaiModel: openaiModelSelect.value,
        activePrompt: activePrompt,
        systemPrompts: JSON.parse(JSON.stringify(systemPrompts)),
    };

    const hasChanges = JSON.stringify(currentState) !== JSON.stringify(initialState);
    document.getElementById("save").disabled = !hasChanges;
}

function editTabName(tabButton) {
    const labelSpan = tabButton.querySelector(".prompt-label");
    if (!labelSpan) return;
    const currentName = labelSpan.textContent;
    
    const input = document.createElement("input");
    input.type = "text";
    input.value = currentName;
    input.className = "prompt-edit-input";
    tabButton.replaceChild(input, labelSpan);
    tabButton.classList.add('editing');
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
        tabButton.classList.remove('editing');
    }
    const key = tabButton.dataset.prompt;
    if (systemPrompts[key]) {
        systemPrompts[key].name = newName;
        checkForChanges();
    }
}

function attachEditIconListener(tabButton) {
    const editIcon = tabButton.querySelector(".edit-icon");
    if (editIcon) {
        editIcon.addEventListener("click", function (e) {
            e.stopPropagation();
            editTabName(tabButton);
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