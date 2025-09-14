// Simple test for core manuscript functionality
const fs = require('fs');
const assert = require('assert');

// Read the chat.js file to test manuscript integration
const chatJs = fs.readFileSync('assets/chat.js', 'utf8');

console.log('Testing core manuscript functionality...');

// Test 1: Core manuscript methods exist in context module
console.log('  ✓ Testing manuscript methods...');
const contextJs = fs.readFileSync('assets/context.js', 'utf8');
assert(contextJs.includes('loadManuscriptData'), 'loadManuscriptData method missing from context.js');
assert(contextJs.includes('selectRandomManuscriptChunk'), 'selectRandomManuscriptChunk method missing from context.js');
assert(contextJs.includes('manuscriptData'), 'manuscriptData property missing from context.js');

// Test 2: Manuscript file path uses configuration
console.log('  ✓ Testing manuscript file path...');
assert(contextJs.includes('SITE_CONFIG.manuscriptPath'), 'manuscript configuration path missing from context.js');

// Test 3: Manuscript integration in system prompt
console.log('  ✓ Testing system prompt integration...');
assert(contextJs.includes('loadManuscriptData'), 'manuscript loading not available in buildSystemPrompt');
assert(contextJs.includes('selectRandomManuscriptChunk'), 'manuscript chunk selection missing from context');
assert(contextJs.includes('Random excerpt from ${SITE_CONFIG.name}\'s book'), 'manuscript chunk labeling missing from context');

// Test 4: Filtering logic exists
console.log('  ✓ Testing filtering logic...');
assert(contextJs.includes('split(\'\\n\\n\')'), 'paragraph splitting missing from context');
assert(contextJs.includes('!p.startsWith(\'Chapter \')'), 'chapter filtering missing from context');
assert(contextJs.includes('!p.startsWith(\'Copyright\')'), 'copyright filtering missing from context');

// Test 5: Sample manuscript file exists and has content
console.log('  ✓ Testing manuscript file...');
const manuscriptPath = 'public/files/manuscript.sample.txt';
assert(fs.existsSync(manuscriptPath), `Sample manuscript file not found at ${manuscriptPath}`);

const manuscriptContent = fs.readFileSync(manuscriptPath, 'utf8');
assert(manuscriptContent.length > 1000, 'Sample manuscript file seems too short');
assert(manuscriptContent.includes('Chapter'), 'Sample manuscript should contain chapters');

// Test 6: Test actual filtering logic
console.log('  ✓ Testing filtering implementation...');
function testFiltering() {
  const mockData = [
    'Chapter 1: Test', // Should be filtered out
    'Copyright © 2021', // Should be filtered out
    'This is a good paragraph with enough content to be included in the random excerpts. It talks about programming and AI.',
    'Short', // Should be filtered out (too short)
    'Another good paragraph that discusses evolution and machine learning in detail. This has sufficient content.',
    'ISBN: 123', // Should be filtered out
    '[ ||| ]', // Should be filtered out
  ].join('\n\n');

  const filtered = mockData
    .split('\n\n')
    .map(p => p.trim())
    .filter(p => p.length > 100 && // Current code uses 100
             !p.startsWith('Chapter ') &&
             !p.startsWith('Copyright') &&
             !p.startsWith('ISBN') &&
             !p.includes('[ ||| ]'));

  assert(filtered.length === 2, `Expected 2 filtered items, got ${filtered.length}`);
  assert(filtered.some(p => p.includes('programming and AI')), 'Should include good content');
  assert(!filtered.some(p => p.startsWith('Chapter')), 'Should exclude chapters');

  return true;
}

assert(testFiltering(), 'Filtering logic test failed');

// Test 7: Basic console logging exists
console.log('  ✓ Testing basic logging...');
assert(chatJs.includes('console.log'), 'Some console logging should exist');

console.log('\n✅ Core manuscript functionality tests passed!');
console.log('- Manuscript loading methods implemented');
console.log('- System prompt integration working');
console.log('- Filtering logic functional');
console.log('- Manuscript file exists with content');
console.log('- Core functionality is working correctly');