import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: 'tests/e2e',
    timeout: 30_000,  // 30 seconds
    use: {
        headless: true,
    },
});