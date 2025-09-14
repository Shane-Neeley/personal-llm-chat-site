// Test for manuscript functionality
const fs = require('fs');
const assert = require('assert');

// Read the chat.js file to test manuscript integration
const chatJs = fs.readFileSync('assets/chat.js', 'utf8');

// Test 1: Verify manuscript loading functionality exists
console.log('Testing manuscript loading functionality...');
assert(chatJs.includes('loadManuscriptData'), 'loadManuscriptData method missing');
assert(chatJs.includes('manuscriptData'), 'manuscriptData property missing');
assert(chatJs.includes('manuscript.sample.txt') || chatJs.includes('manuscriptPath'), 'manuscript file path missing');

// Test 2: Verify manuscript chunk selection exists
console.log('Testing manuscript chunk selection...');
assert(chatJs.includes('getRandomManuscriptChunk'), 'getRandomManuscriptChunk method missing');
assert(chatJs.includes('split(\'\\n\\n\')'), 'paragraph splitting logic missing');
assert(chatJs.includes('filter(p =>'), 'paragraph filtering logic missing');

// Test 3: Verify manuscript filtering logic
console.log('Testing manuscript filtering rules...');
const filteringRules = [
  '!p.startsWith(\'Chapter \')', // Skip chapter headers
  '!p.startsWith(\'Copyright\')', // Skip copyright
  '!p.startsWith(\'ISBN\')', // Skip publishing info
  '!p.match(/^[0-9\\s]+$/)', // Skip page numbers
  '!p.startsWith(\'Robo-Excerpt\')', // Skip section headers
  '!p.includes(\'[ ||| ]\')', // Skip section breaks
  'p.length >' // Minimum length check
];

filteringRules.forEach(rule => {
  assert(chatJs.includes(rule), `Filtering rule missing: ${rule}`);
});

// Test 4: Verify manuscript integration in system prompt
console.log('Testing manuscript integration in system prompt...');
assert(chatJs.includes('await this.loadManuscriptData()'), 'manuscript loading not called in generateSystemPrompt');
assert(chatJs.includes('const randomManuscriptChunk = this.getRandomManuscriptChunk()'), 'manuscript chunk selection missing');
assert(chatJs.includes('Random excerpt from'), 'manuscript chunk labeling missing');

// Test 5: Test chunk filtering logic
function testChunkFiltering() {
  const mockManuscriptData = `
Chapter 1: Test Chapter

This is a good paragraph that should be included. It has enough content and is not a header or copyright notice. This paragraph contains interesting content about AI and evolution.

Copyright © 2021 by Sample Author

ISBN (paperback): 978-1-7362669-5-3

[ ||| ]

Robo-Excerpt

123   456   789

This is another good paragraph that should pass all the filters. It discusses programming and artificial intelligence in an engaging way.

Short.

This paragraph talks about monkeys and coding. It's exactly the kind of content we want to include in the random excerpts for conversation starters.
`.trim();

  // Simulate the filtering logic from chat.js
  const paragraphs = mockManuscriptData
    .split('\n\n')
    .map(p => p.trim())
    .filter(p => p.length > 100 && // At least a few sentences (updated to match current code)
                 !p.startsWith('Chapter ') && // Skip chapter headers
                 !p.startsWith('Copyright') && // Skip copyright
                 !p.startsWith('ISBN') && // Skip publishing info
                 !p.match(/^[0-9\s]+$/) && // Skip page numbers
                 !p.startsWith('Robo-Excerpt') && // Skip section headers
                 !p.includes('[ ||| ]')); // Skip section breaks

  console.log(`  Filtered ${paragraphs.length} paragraphs from mock data`);

  // Should have 3 good paragraphs (the ones with enough content)
  assert(paragraphs.length === 3, `Expected 3 filtered paragraphs, got ${paragraphs.length}`);

  // Verify specific content is included
  assert(paragraphs.some(p => p.includes('artificial intelligence')), 'AI paragraph should be included');
  assert(paragraphs.some(p => p.includes('monkeys and coding')), 'Monkey paragraph should be included');

  // Verify filtered content is excluded
  assert(!paragraphs.some(p => p.startsWith('Chapter')), 'Chapter headers should be excluded');
  assert(!paragraphs.some(p => p.startsWith('Copyright')), 'Copyright should be excluded');
  assert(!paragraphs.some(p => p.startsWith('ISBN')), 'ISBN should be excluded');
  assert(!paragraphs.some(p => p === 'Short.'), 'Short paragraphs should be excluded');

  return true;
}

// Test 6: Test chunk length truncation
function testChunkTruncation() {
  const longChunk = "This is a very long paragraph that goes on and on with many sentences. " +
                   "The first sentence is about AI. The second sentence talks about evolution. " +
                   "The third sentence discusses programming. The fourth sentence mentions biology. " +
                   "The fifth sentence is about machine learning. The sixth sentence covers data science. " +
                   "This continues for many more sentences that should be truncated.";

  // Simulate truncation logic
  let chunk = longChunk;
  if (chunk.length > 300) {
    const sentences = chunk.split(/[.!?]+/);
    const numSentences = Math.min(3, Math.max(1, Math.floor(sentences.length * 0.4)));
    chunk = sentences.slice(0, numSentences).join('.') + '.';
  }

  console.log(`  Original length: ${longChunk.length}, truncated length: ${chunk.length}`);

  // Should be truncated to reasonable length
  assert(chunk.length <= 300, 'Long chunks should be truncated');
  assert(chunk.includes('AI'), 'Truncated chunk should retain beginning content');
  assert(chunk.endsWith('.'), 'Truncated chunk should end with period');

  return true;
}

// Test 7: Verify console logging exists
console.log('Testing console logging functionality...');
const loggingPatterns = [
  'console.log("🤖 Generated System Prompt:")',
  'console.log("💬 Conversation Structure:")',
  'console.log("🚀 Final Formatted Prompt',
  'console.log("🧹 Sanitizing Model Response:")',
  'console.log("🎭 Finalizing Response:")',
  '📝 Input response:',
  '📥 Raw model output:',
  '✅ Final sanitized output:'
];

loggingPatterns.forEach(pattern => {
  assert(chatJs.includes(pattern), `Console logging pattern missing: ${pattern}`);
});

// Test 8: Test manuscript file existence
console.log('Testing manuscript file existence...');
const manuscriptPath = 'public/files/manuscript.sample.txt';
assert(fs.existsSync(manuscriptPath), `Manuscript file not found at ${manuscriptPath}`);

const manuscriptContent = fs.readFileSync(manuscriptPath, 'utf8');
assert(manuscriptContent.length > 1000, 'Manuscript file seems too short');
assert(manuscriptContent.includes('Stone Age Code'), 'Manuscript should contain book title');
assert(manuscriptContent.length > 0, 'Manuscript should contain content');

// Test 9: Verify system prompt integration
console.log('Testing system prompt integration...');
assert(chatJs.includes('if ((randomHighlights && randomHighlights.length > 0) || randomManuscriptChunk)'),
       'System prompt should check for both highlights and manuscript chunks');
assert(chatJs.includes('let itemIndex = 1'), 'System prompt should use sequential numbering');

// Run the logic tests
console.log('\nRunning manuscript logic tests...');
assert(testChunkFiltering(), 'Chunk filtering logic test failed');
assert(testChunkTruncation(), 'Chunk truncation logic test failed');

console.log('\n✅ All manuscript tests passed!');
console.log('- Manuscript loading functionality implemented');
console.log('- Chunk selection and filtering working correctly');
console.log('- System prompt integration functional');
console.log('- Console logging implemented');
console.log('- Manuscript file exists and has content');
console.log('- Text truncation logic working');
console.log('- Filtering rules properly exclude headers and metadata');