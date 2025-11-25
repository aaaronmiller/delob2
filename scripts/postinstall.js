#!/usr/bin/env node

/**
 * Post-install script
 * 
 * Runs after npm install to:
 * 1. Copy template files
 * 2. Apply proxy patch (file_logger.py)
 */

const fs = require('fs');
const path = require('path');

console.log('Running Delobotomize post-install...');

// This script runs in the context of npm installation
// For now, it's a placeholder

console.log('✓ Post-install complete');
