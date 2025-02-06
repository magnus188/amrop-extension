// tests/e2e/popup.spec.js
import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// We create a file:// URL to load the popup directly from disk
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const popupPath = path.resolve(__dirname, '../../popup/popup.html');
// On Windows you'll need to ensure correct file:// path format
// But this should generally work in Node contexts

test.describe('Popup UI tests', () => {

    // 1. Check if the popup loads and elements are visible
    test('should show the generate button and icons', async ({ page }) => {
        await page.goto(`file://${popupPath}`);

        // Expect the "Generate" button to be visible
        const generateButton = page.locator('#scrapeButton');
        await expect(generateButton).toBeVisible();
        await expect(generateButton).toHaveText(/Generate/i);

        // Check the nav icons
        const copyIcon = page.locator('#copy');
        await expect(copyIcon).toBeVisible();

        const settingsIcon = page.locator('#settings');
        await expect(settingsIcon).toBeVisible();
    });

    // 2. Check the loader behavior after clicking the button
    test('should display loader after clicking the "Generate" button', async ({ page }) => {
        await page.goto(`file://${popupPath}`);

        const generateButton = page.locator('#scrapeButton');
        const loader = page.locator('.loader');

        // Initially loader should have opacity = 0 (hidden)
        await expect(loader).toHaveCSS('opacity', '0');

        // Click the generate button
        await generateButton.click();

        // The button text should become transparent, loader’s opacity to 1
        await expect(generateButton).toHaveClass(/loading/);
        await expect(loader).not.toHaveCSS('opacity', '0'); // e.g. expecting '1' or more

    });
});