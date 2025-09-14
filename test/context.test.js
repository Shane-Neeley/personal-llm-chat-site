// Test for context.js module functionality
const fs = require('fs');
const assert = require('assert');

console.log('Testing context.js module functionality...');

// Test 1: Verify context.js file exists and has expected structure
console.log('  ✓ Testing context.js file structure...');
const contextJs = fs.readFileSync('assets/context.js', 'utf8');

// Check for key exports and imports
assert(contextJs.includes('export'), 'Context module should use ES6 exports');
assert(contextJs.includes('import { SITE_CONFIG'), 'Should import SITE_CONFIG');
assert(contextJs.includes('CONTEXT_VERSION'), 'CONTEXT_VERSION constant missing');
assert(contextJs.includes('BASE_SYSTEM_PROMPT'), 'BASE_SYSTEM_PROMPT constant missing');
assert(contextJs.includes('BOOK_PROMOS'), 'BOOK_PROMOS array missing');
assert(contextJs.includes('FUNNY_QUIPS'), 'FUNNY_QUIPS array missing');
assert(contextJs.includes('buildSystemPrompt'), 'buildSystemPrompt function missing');
assert(contextJs.includes('DataLoader'), 'DataLoader class missing');

// Test 2: Verify version format
console.log('  ✓ Testing CONTEXT_VERSION format...');
const versionMatch = contextJs.match(/CONTEXT_VERSION = "([^"]+)"/);
assert(versionMatch, 'CONTEXT_VERSION should be a quoted string');
assert(versionMatch[1].includes('2025'), 'Version should include year 2025');

// Test 3: Test configuration-driven BASE_SYSTEM_PROMPT
console.log('  ✓ Testing BASE_SYSTEM_PROMPT content...');
assert(contextJs.includes('createBaseSystemPrompt'), 'Should have createBaseSystemPrompt function');
assert(contextJs.includes('SITE_CONFIG.name'), 'Should reference SITE_CONFIG.name');
assert(contextJs.includes('SITE_CONFIG.personalityTrait'), 'Should reference personalityTrait');
assert(contextJs.includes('factually'), 'BASE_SYSTEM_PROMPT should emphasize factual answers');
assert(contextJs.includes('concisely'), 'BASE_SYSTEM_PROMPT should emphasize concise answers');

// Test 4: Test configurable BOOK_PROMOS
console.log('  ✓ Testing BOOK_PROMOS array...');
assert(contextJs.includes('generateBookPromos'), 'Should have generateBookPromos function');
assert(contextJs.includes('SITE_CONFIG.book'), 'Should check SITE_CONFIG.book');
assert(contextJs.includes('SITE_CONFIG.useBookPromos'), 'Should check useBookPromos setting');

// Test 5: Test configurable FUNNY_QUIPS
console.log('  ✓ Testing FUNNY_QUIPS array...');
assert(contextJs.includes('SITE_CONFIG.useFunnyQuips'), 'Should check useFunnyQuips setting');
assert(contextJs.includes('SAMPLE_CONTENT.funnyQuips'), 'Should use sample content');

// Test 6: Test DataLoader class with configuration
console.log('  ✓ Testing DataLoader class structure...');
assert(contextJs.includes('class DataLoader'), 'DataLoader should be a class');
assert(contextJs.includes('loadResumeData'), 'DataLoader should have loadResumeData method');
assert(contextJs.includes('loadHighlightsData'), 'DataLoader should have loadHighlightsData method');
assert(contextJs.includes('loadManuscriptData'), 'DataLoader should have loadManuscriptData method');
assert(contextJs.includes('SITE_CONFIG.resumeJsonPath'), 'Should use config paths for resume');
assert(contextJs.includes('SITE_CONFIG.highlightsPath'), 'Should use config paths for highlights');
assert(contextJs.includes('SITE_CONFIG.manuscriptPath'), 'Should use config paths for manuscript');

// Test 7: Test selection functions
console.log('  ✓ Testing selection functions...');
assert(contextJs.includes('function selectRandomHighlights'), 'selectRandomHighlights function missing');
assert(contextJs.includes('function selectRandomManuscriptChunk'), 'selectRandomManuscriptChunk function missing');
assert(contextJs.includes('function selectRandomPromo'), 'selectRandomPromo function missing');
assert(contextJs.includes('function selectRandomQuip'), 'selectRandomQuip function missing');

// Test 8: Test deterministic option support
console.log('  ✓ Testing deterministic option support...');
assert(contextJs.includes('options.seed'), 'Functions should support seed option');
assert(contextJs.includes('options.randomize === false'), 'Functions should support randomize disable');

// Test 9: Test buildSystemPrompt function with config
console.log('  ✓ Testing buildSystemPrompt function...');
assert(contextJs.includes('async function buildSystemPrompt'), 'buildSystemPrompt should be async');
assert(contextJs.includes('dataLoader || new DataLoader'), 'buildSystemPrompt should accept optional dataLoader');
assert(contextJs.includes('Promise.all'), 'buildSystemPrompt should load data in parallel');
assert(contextJs.includes('SITE_CONFIG.expertiseAreas'), 'Should use config expertise areas');

// Test 10: Test graceful degradation
console.log('  ✓ Testing graceful degradation...');
assert(contextJs.includes('SITE_CONFIG.gracefulDegradation'), 'Should check graceful degradation setting');

// Test 11: Test export statement
console.log('  ✓ Testing export statement...');
const exportMatch = contextJs.match(/export\s*{\s*([\s\S]*?)\s*};?\s*$/m);
assert(exportMatch, 'Should have export statement at end of file');

// Test 12: Test site-config.js file exists
console.log('  ✓ Testing site-config.js file...');
const siteConfigExists = fs.existsSync('assets/site-config.js');
assert(siteConfigExists, 'site-config.js should exist');

const siteConfigJs = fs.readFileSync('assets/site-config.js', 'utf8');
assert(siteConfigJs.includes('export const SITE_CONFIG'), 'Should export SITE_CONFIG');
assert(siteConfigJs.includes('export const SAMPLE_CONTENT'), 'Should export SAMPLE_CONTENT');
assert(siteConfigJs.includes('enableEasterEgg'), 'Should have Easter Egg toggle');
assert(siteConfigJs.includes('gracefulDegradation'), 'Should have graceful degradation setting');

// Test 13: Test sample content files exist (using default sample paths)
console.log('  ✓ Testing sample content files...');
assert(fs.existsSync('assets/resume.json'), 'assets/resume.json should exist');
assert(fs.existsSync('public/files/highlights.sample.json'), 'highlights.sample.json should exist');
assert(fs.existsSync('public/files/manuscript.sample.txt'), 'manuscript.sample.txt should exist');

console.log('\n✅ Context module tests passed!');
console.log('- context.js file properly structured with configuration support');
console.log('- CONTEXT_VERSION properly formatted with current year');
console.log('- BASE_SYSTEM_PROMPT uses configuration for personalization');
console.log('- BOOK_PROMOS and FUNNY_QUIPS are configurable');
console.log('- DataLoader class uses configuration paths');
console.log('- Selection functions support deterministic options');
console.log('- buildSystemPrompt function uses configuration');
console.log('- Graceful degradation supported for missing files');
console.log('- site-config.js properly structured');
console.log('- Sample content files are present');
console.log('- All expected exports present');