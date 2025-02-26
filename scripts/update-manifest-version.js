import fs from 'fs';
import path from 'path';

// You can still use path.join, but need the URL approach in ESM
import { fileURLToPath } from 'url';

// If you need __dirname or __filename equivalents:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1) Read package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const newVersion = packageData.version;

// 2) Read manifest.json
// const manifestJsonPath = path.join(__dirname, '..', 'src', 'manifest.json'); // or wherever manifest is
const manifestJsonPath = path.join(__dirname, 'manifest.json'); // or wherever manifest is
const manifestData = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf8'));

// 3) Overwrite manifest version
manifestData.version = newVersion;

// 4) Write updated manifest
fs.writeFileSync(manifestJsonPath, JSON.stringify(manifestData, null, 2));
console.log(`Synced manifest.json to version ${newVersion}`);