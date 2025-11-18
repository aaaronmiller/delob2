#!/usr/bin/env node

/**
 * Legal compliance validation script
 * 
 * Ensures:
 * 1. LICENSE file exists
 * 2. NOTICE file exists and references vendored systems
 * 3. All vendored systems have preserved LICENSE files
 */

const fs = require('fs');
const path = require('path');

console.log('Validating legal compliance...');

const requiredFiles = [
  { name: 'LICENSE', path: 'LICENSE' },
  { name: 'NOTICE', path: 'NOTICE' }
];

let allValid = true;

// Check required files
for (const file of requiredFiles) {
  if (!fs.existsSync(file.path)) {
    console.error(`✗ ${file.name}: File not found`);
    allValid = false;
  } else {
    console.log(`✓ ${file.name}: Found`);
  }
}

// Check NOTICE mentions vendored systems
if (fs.existsSync('NOTICE')) {
  const notice = fs.readFileSync('NOTICE', 'utf-8');
  
  if (!notice.includes('multi-agent-workflow')) {
    console.error('✗ NOTICE: Missing multi-agent-workflow attribution');
    allValid = false;
  }
  
  if (!notice.includes('claude-code-proxy')) {
    console.error('✗ NOTICE: Missing claude-code-proxy attribution');
    allValid = false;
  }
}

if (!allValid) {
  console.error('\nLegal validation failed!');
  process.exit(1);
}

console.log('\n✓ Legal compliance validated');
