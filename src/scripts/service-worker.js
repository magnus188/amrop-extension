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

// service-worker.js

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SEND_PROMPT') {
        chrome.storage.sync.get(['apiKey', 'apiProvider', 'openaiModel', 'language', 'systemPrompts', 'activePrompt'], async (data) => {
            const { apiKey, apiProvider, openaiModel, systemPrompts, activePrompt } = data;

            if (!systemPrompts) {
                chrome.storage.sync.set({
                    systemPrompts: defaultPrompts,
                    activePrompt: "prompt1"
                });
            }

            promptInstruction = systemPrompts[activePrompt].text
            language = systemPrompts[activePrompt].language

            if (!apiKey) {
                sendResponse({ error: 'No API key provided. Add one in settings.' });
                return;
            }

            try {
                if (message.resp.experiences.length == 0) {
                    throw new Error("Could not find any LinkedIn profile.");
                }

                let result;
                if (apiProvider === 'openai') {
                    result = await fetchOpenAI(message.resp, apiKey, promptInstruction, language, openaiModel);
                } else {
                    result = await fetchGemini(message.resp, apiKey, promptInstruction, language);
                }
                sendResponse({ result });
            } catch (error) {
                sendResponse({ error: error.message });
            }
        });
        return true;
    }
});

/**
 * Calls OpenAI's API to get AI-generated text.
 * @param {Object} profileData - The LinkedIn profile data
 * @param {string} openaiApiKey - The API key for accessing OpenAI
 * @param {string} promptInstruction - The system prompt instruction
 * @param {string} language - The desired output language
 * @param {string} model - The OpenAI model to use
 * @returns {string} - The text generated by OpenAI
 */
async function fetchOpenAI(profileData, openaiApiKey, promptInstruction, language, model) {
    const endpoint = 'https://api.openai.com/v1/chat/completions';

    // Convert the profileData object to a JSON string
    const profileJson = JSON.stringify(profileData, null, 2);

    // Combine instruction and profile data
    const combinedPrompt = `${promptInstruction}\n${profileJson}\n\n All output must be written in ${language}!`;

    // Build the request body as per OpenAI's requirements
    const requestBody = {
        model: model,
        messages: [
            {
                role: "system",
                content: promptInstruction
            },
            {
                role: "user",
                content: `${profileJson}\n\n All output must be written in ${language}!`
            }
        ],
        temperature: 0.7
    };

    // Make the POST request to OpenAI's API
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify(requestBody)
    });

    // Check if the response status is not OK (200-299)
    if (!response.ok) {
        let errorMsg = 'Unknown error from OpenAI API.';
        try {
            const errorData = await response.json();
            if (errorData.error && errorData.error.message) {
                errorMsg = errorData.error.message;
            }
        } catch (_ignore) {
            // If response is not JSON, retain the default error message
        }
        throw new Error(errorMsg);
    }

    // Parse the JSON response
    const data = await response.json();

    // Validate the presence of choices and extract the text
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        throw new Error('OpenAI response did not include any choices.');
    }

    const firstChoice = data.choices[0];

    if (!firstChoice.message || !firstChoice.message.content) {
        throw new Error('OpenAI response did not include any content.');
    }

    return firstChoice.message.content.trim();
}

/**
 * Calls Google Gemini's generateContent endpoint to get AI-generated text.
 * @param {string} prompt         - The user prompt (e.g., "Explain how AI works").
 * @param {string} geminiApiKey   - The API key for accessing Gemini.
 * @returns {string}              - The text generated by Gemini.
 */
async function fetchGemini(profileData, geminiApiKey, promptInstruction, language) {
    // Construct the endpoint with the API key as a query parameter
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

    // Convert the profileData object to a JSON string
    const profileJson = JSON.stringify(profileData, null, 2); // Pretty-print for readability

    // Combine instruction and profile data
    const combinedPrompt = `${promptInstruction}\n${profileJson}\n\n All output must be written in ${language}!`;

    // Build the request body as per Gemini's requirements
    const requestBody = {
        contents: [
            {
                parts: [
                    { text: combinedPrompt }
                ]
            }
        ]
    };

    // Make the POST request to Gemini's generateContent endpoint
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
            // If Gemini requires additional headers (e.g., Authorization), include them here
            // Example:
            // 'Authorization': `Bearer ${yourOAuthToken}`
        },
        body: JSON.stringify(requestBody)
    });

    // Check if the response status is not OK (200-299)
    if (!response.ok) {
        let errorMsg = 'Unknown error from Gemini API.';
        try {
            const errorData = await response.json();
            if (errorData.error && errorData.error.message) {
                errorMsg = errorData.error.message;
            }
        } catch (_ignore) {
            // If response is not JSON, retain the default error message
        }
        throw new Error(errorMsg);
    }

    // Parse the JSON response
    const data = await response.json();

    // Validate the presence of candidates and extract the text
    if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
        throw new Error('Gemini response did not include any candidates.');
    }

    const firstCandidate = data.candidates[0];

    if (!firstCandidate.content || !firstCandidate.content.parts || firstCandidate.content.parts.length === 0) {
        throw new Error('Gemini response did not include any content parts.');
    }

    // Concatenate all text parts into a single string
    const generatedText = firstCandidate.content.parts.map(part => part.text).join('\n').trim();

    return generatedText;
}