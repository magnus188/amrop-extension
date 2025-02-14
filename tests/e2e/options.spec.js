// tests/e2e/options.spec.js
import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const optionsPath = path.resolve(__dirname, '../../src/options/options.html');

test.describe('Options UI tests', () => {

    test('should show API key input, language dropdown', async ({ page }) => {
        await page.goto(`file://${optionsPath}`);

        // 1) Gemini API Key input
        const apiKeyInput = page.locator('#apiKey');
        await expect(apiKeyInput).toBeVisible();
        await expect(apiKeyInput).toHaveAttribute('placeholder', 'Enter your Gemini API Key');

        // 2) Language dropdown
        const languageSelect = page.locator('#languageSelect');
        await expect(languageSelect).toBeVisible();
        await expect(languageSelect).toHaveValue('English');
    });

    test('should switch prompt tabs and show correct text area', async ({ page }) => {
        await page.addInitScript(() => {
            // Only define chrome if not already defined (to avoid clobbering real extension)
            if (!window.chrome) {
                window.chrome = {};
            }
            if (!window.chrome.storage) {
                window.chrome.storage = {};
            }
            if (!window.chrome.storage.sync) {
                window.chrome.storage.sync = {
                    get(keys, callback) {
                        // Provide empty default or your desired mock data
                        callback && callback({});
                    },
                    set(items, callback) {
                        callback && callback();
                    },
                };
            }

            if (!window.chrome.runtime) {
                window.chrome.runtime = {};
            }

            // Mock getManifest to avoid a crash when main.js calls chrome.runtime.getManifest().version
            if (!window.chrome.runtime.getManifest) {
                window.chrome.runtime.getManifest = () => ({ version: '1.0.0-test' });
            }

            Object.defineProperty(window.chrome.runtime, 'lastError', {
                get() {
                    // Return null to indicate no error
                    return null;
                }
            });
        });

        await page.goto(`file://${optionsPath}`);


        const promptTabs = page.locator('.prompt-tab');
        const prompt1Button = promptTabs.nth(0);
        const prompt2Button = promptTabs.nth(1);
        const prompt3Button = promptTabs.nth(2);

        // The main textarea
        const promptTextarea = page.locator('#systemPromptText');

        // Click each tab and verify it gets .active
        await prompt1Button.click();
        
        await expect(prompt1Button).toHaveClass(/active/);
        await expect(prompt2Button).not.toHaveClass(/active/);
        await expect(prompt3Button).not.toHaveClass(/active/);

        // Possibly check the text in the #systemPromptText if you have default prompt text
        // e.g. await expect(promptTextarea).toHaveValue('Default prompt 1...');

        await prompt2Button.click();
        await expect(prompt2Button).toHaveClass(/active/);

        await expect(prompt1Button).not.toHaveClass(/active/);
        await expect(prompt3Button).not.toHaveClass(/active/);

        
        await prompt3Button.click();
        await expect(prompt3Button).toHaveClass(/active/);

        await expect(prompt1Button).not.toHaveClass(/active/);
        await expect(prompt2Button).not.toHaveClass(/active/);

    });


    test('should show snackbar after clicking Save', async ({ page }) => {

        await page.addInitScript(() => {
            // Only define chrome if not already defined (to avoid clobbering real extension)
            if (!window.chrome) {
                window.chrome = {};
            }
            if (!window.chrome.storage) {
                window.chrome.storage = {};
            }
            if (!window.chrome.storage.sync) {
                window.chrome.storage.sync = {
                    get(keys, callback) {
                        // Provide empty default or your desired mock data
                        callback && callback({});
                    },
                    set(items, callback) {
                        callback && callback();
                    },
                };
            }

            if (!window.chrome.runtime) {
                window.chrome.runtime = {};
            }

            // Mock getManifest to avoid a crash when main.js calls chrome.runtime.getManifest().version
            if (!window.chrome.runtime.getManifest) {
                window.chrome.runtime.getManifest = () => ({ version: '1.0.0-test' });
            }

            Object.defineProperty(window.chrome.runtime, 'lastError', {
                get() {
                    // Return null to indicate no error
                    return null;
                }
            });
        });

        await page.goto(`file://${optionsPath}`);

        const saveButton = page.locator('#save');
        const snackbar = page.locator('#snackbar');
        const promptTextarea = page.locator('#systemPromptText');

        await expect(snackbar).toHaveCSS('visibility', 'hidden');

        promptTextarea.fill('Some changes')

        // Click Save
        await saveButton.click();

        // Expect the snackbar to become visible
        await expect(snackbar).toHaveClass(/show/);

        // The default CSS anim may hide it again after 3s
        // Optionally wait for it to vanish:
        await expect(snackbar).toHaveCSS('visibility', 'hidden', { timeout: 4000 });
    });
});