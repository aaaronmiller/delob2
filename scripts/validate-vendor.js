#!/usr/bin/env node

/**
 * Vendor validation script
 * 
 * Checks integrity of vendored systems:
 * 1. multi-agent-workflow exists and has LICENSE
 * 2. claude-code-proxy exists and has LICENSE
 */

const fs = require('fs');
const path = require('path');

console.log('Validating vendored systems...');

const checks = [
  {
    name: 'multi-agent-workflow',
    path: 'integrations/multi-agent-workflow',
    license: 'integrations/multi-agent-workflow/LICENSE'
  },
  {
    name: 'claude-code-proxy',
    path: 'integrations/claude-code-proxy',
    license: 'integrations/claude-code-proxy/LICENSE'
  }
];

let allValid = true;

for (const check of checks) {
  const exists = fs.existsSync(check.path);
  const hasLicense = fs.existsSync(check.license);
  
  if (!exists) {
    console.error(`✗ ${check.name}: Directory not found at ${check.path}`);
    allValid = false;
  } else if (!hasLicense) {
    console.error(`✗ ${check.name}: LICENSE file missing`);
    allValid = false;
  } else {
    console.log(`✓ ${check.name}: Valid`);
  }
}

if (!allValid) {
  console.error('\nVendor validation failed!');
  process.exit(1);
}

console.log('\n✓ All vendored systems valid');
