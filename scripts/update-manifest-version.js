const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const manifestJsonPath = path.join(__dirname, '..', 'manifest.json');
// or wherever your manifest actually lives

// 1) Read package.json
const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const newVersion = packageData.version;

// 2) Read manifest.json
const manifestData = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf-8'));

// 3) Overwrite manifest's version with package.json version
manifestData.version = newVersion;

// 4) Save manifest.json
fs.writeFileSync(manifestJsonPath, JSON.stringify(manifestData, null, 2));