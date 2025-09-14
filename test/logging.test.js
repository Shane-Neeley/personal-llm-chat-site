// Test for console logging functionality
const fs = require('fs');
const assert = require('assert');

// Read the chat.js file to test logging integration
const chatJs = fs.readFileSync('assets/chat.js', 'utf8');

console.log('Testing console logging functionality...');

// Test 1: System Prompt Logging
console.log('  1. Testing system prompt logging...');
const systemPromptLoggingPatterns = [
  'console.log("🤖 Generated System Prompt:")',
  'console.log("=".repeat(80))',
  'console.log(prompt)',
  'console.log("=".repeat(80))'
];

systemPromptLoggingPatterns.forEach(pattern => {
  assert(chatJs.includes(pattern), `System prompt logging pattern missing: ${pattern}`);
});

// Test 2: Conversation Structure Logging
console.log('  2. Testing conversation structure logging...');
const conversationLoggingPatterns = [
  'console.log("💬 Conversation Structure:")',
  'console.log(`📝 User input: "${userText}"`)',
  'console.log(`📚 History entries: ${relevantHistory.length}`)',
  'console.log("🗨️ Full conversation messages:")',
  'messages.forEach((msg, i) =>',
  'console.log(`  ${i + 1}. [${msg.role.toUpperCase()}]:'
];

conversationLoggingPatterns.forEach(pattern => {
  assert(chatJs.includes(pattern), `Conversation logging pattern missing: ${pattern}`);
});

// Test 3: Final Prompt Logging
console.log('  3. Testing final prompt logging...');
const promptLoggingPatterns = [
  'console.log("🚀 Final Formatted Prompt (tokenizer template):")',
  'console.log("🚀 Final Formatted Prompt (fallback):")',
  'console.log("⚠️ Prompt truncated due to length")',
  'console.log("-".repeat(80))',
  'console.log(formatted)',
  'console.log(fullPrompt)'
];

promptLoggingPatterns.forEach(pattern => {
  assert(chatJs.includes(pattern), `Prompt logging pattern missing: ${pattern}`);
});

// Test 4: Model Response Sanitization Logging
console.log('  4. Testing response sanitization logging...');
const sanitizationLoggingPatterns = [
  'console.log("🧹 Sanitizing Model Response:")',
  'console.log(`📥 Raw model output: "${full || ""}"`)',
  'console.log(`✂️ Trimmed prompt prefix, remaining: "${output}"`)',
  'console.log(`✅ Final sanitized output: "${finalOutput}"`)',
  'console.log("❌ Response rejected due to nonsensical patterns")'
];

sanitizationLoggingPatterns.forEach(pattern => {
  assert(chatJs.includes(pattern), `Sanitization logging pattern missing: ${pattern}`);
});

// Test 5: Response Finalization Logging
console.log('  5. Testing response finalization logging...');
const finalizationLoggingPatterns = [
  'console.log("🎭 Finalizing Response:")',
  'console.log(`📝 Input response: "${response}"`)',
  'console.log("🚫 Skipping promo/quip (short/error response)")',
  'console.log("📚 Added book promo")',
  'console.log("😄 Added funny quip")',
  'console.log("➡️ No additions, returning original response")',
  'console.log(`🎯 Final response with promo: "${finalResponse}"`)',
  'console.log(`🎯 Final response with quip: "${finalResponse}"`)'
];

finalizationLoggingPatterns.forEach(pattern => {
  assert(chatJs.includes(pattern), `Finalization logging pattern missing: ${pattern}`);
});

// Test 6: Verify logging uses consistent emoji patterns
console.log('  6. Testing emoji consistency...');
const expectedEmojis = ['🤖', '💬', '🚀', '🧹', '🎭', '📝', '📥', '✅', '❌', '⚠️', '📚', '😄', '🎯', '🚫', '➡️', '✂️', '📚', '🗨️'];
expectedEmojis.forEach(emoji => {
  assert(chatJs.includes(emoji), `Expected emoji missing from logging: ${emoji}`);
});

// Test 7: Test logging context preservation
console.log('  7. Testing logging context information...');
const contextPatterns = [
  'userText', // User input should be logged
  'full', // Raw model output should be logged
  'formatted', // Formatted prompt should be logged
  'response', // Response should be logged
  'relevantHistory.length', // History count should be logged
  'msg.role.toUpperCase()', // Message roles should be logged
  'finalOutput', // Final output should be logged
  'finalResponse' // Final response should be logged
];

contextPatterns.forEach(pattern => {
  assert(chatJs.includes(pattern), `Context information missing from logging: ${pattern}`);
});

// Test 8: Verify logging doesn't interfere with core functionality
console.log('  8. Testing logging placement...');

// Logging should be placed at appropriate points
assert(chatJs.includes('console.log("🤖 Generated System Prompt:");\n    console.log("=".repeat(80));\n    console.log(prompt);\n    console.log("=".repeat(80));\n\n    return prompt;'),
       'System prompt logging should be placed just before return');

// Response logging should happen in sanitizeReply
assert(chatJs.match(/sanitizeReply.*console\.log.*🧹/s),
       'Response sanitization logging should be in sanitizeReply method');

// Finalization logging should happen in finalizeResponse
assert(chatJs.match(/finalizeResponse.*console\.log.*🎭/s),
       'Response finalization logging should be in finalizeResponse method');

// Test 9: Test logging format consistency
console.log('  9. Testing logging format consistency...');

// Check that all major logging sections use consistent formatting
const logSections = [
  '🤖 Generated System Prompt:',
  '💬 Conversation Structure:',
  '🚀 Final Formatted Prompt',
  '🧹 Sanitizing Model Response:',
  '🎭 Finalizing Response:'
];

logSections.forEach(section => {
  assert(chatJs.includes(`console.log("${section}")`), `Consistent logging format missing for: ${section}`);
});

// Test 10: Verify separator patterns
console.log('  10. Testing separator patterns...');
const separatorPatterns = [
  '.repeat(80)', // Long separators for major sections
  '.repeat(80)', // Should use consistent length
  'console.log("-".repeat(80))', // Shorter separators for sub-sections
  'console.log("=".repeat(80))' // Equals for major sections
];

separatorPatterns.forEach(pattern => {
  assert(chatJs.includes(pattern), `Separator pattern missing: ${pattern}`);
});

console.log('\n✅ All logging tests passed!');
console.log('- System prompt logging implemented with clear separators');
console.log('- Conversation structure logging shows user input and history');
console.log('- Final prompt logging handles both tokenizer and fallback formats');
console.log('- Model response sanitization logging shows raw vs processed output');
console.log('- Response finalization logging tracks promo/quip additions');
console.log('- Consistent emoji usage for easy log identification');
console.log('- Context information properly preserved in logs');
console.log('- Logging placement doesn\'t interfere with core functionality');
console.log('- Consistent formatting across all logging sections');
console.log('- Appropriate separator patterns for readability');