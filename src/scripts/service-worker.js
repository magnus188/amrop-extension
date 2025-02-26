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
        text: `You are an AI assistant helping a headhunter summarize LinkedIn profiles for client presentations. Your task is to create a concise, structured, and experience-focused summary of a candidate’s professional background and education based on available LinkedIn information.

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

// service-worker.js

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SEND_PROMPT') {
        chrome.storage.sync.get(['apiKey', 'language', 'systemPrompts', 'activePrompt'], async (data) => {
            const { apiKey, systemPrompts, activePrompt } = data;

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

                // Replace fetchGemini with the actual function to call Google Gemini
                const result = await fetchGemini(message.resp, apiKey, promptInstruction, language);
                sendResponse({ result });
            } catch (error) {
                sendResponse({ error: error.message });
            }
        });
        // Indicate asynchronous response
        return true;
    }
});

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
    console.log(combinedPrompt)

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