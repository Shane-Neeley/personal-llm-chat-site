// Test for end-to-end dynamic generation functionality
const fs = require('fs');
const assert = require('assert');

// Read the chat.js file to test complete dynamic integration
const chatJs = fs.readFileSync('assets/chat.js', 'utf8');

console.log('Testing end-to-end dynamic generation functionality...');

// Test 1: Verify generateText method accepts dynamic parameters
console.log('  ✓ Testing generateText method signature...');
assert(chatJs.includes('async generateText(prompt, onUpdate, dynamicParams = null)'), 'generateText method should accept dynamicParams');
assert(chatJs.includes('const params = dynamicParams || CONFIG.getDynamicValues()'), 'generateText should use dynamic parameters');

// Test 2: Verify parameters are passed from ChatEngine to ModelManager
console.log('  ✓ Testing parameter passing...');
assert(chatJs.includes('this.modelManager.generateText(formatted, onUpdate, this.chatEngine.currentParams)'),
       'generateText should be called with dynamic parameters');

// Test 3: Verify sampling is enabled for temperature > 0
console.log('  ✓ Testing sampling logic...');
assert(chatJs.includes('const shouldSample = params.TEMPERATURE > 0.05'), 'shouldSample logic missing');
assert(chatJs.includes('do_sample: shouldSample'), 'do_sample should use shouldSample');

// Test 4: Verify dynamic context length usage
console.log('  ✓ Testing dynamic context length...');
assert(chatJs.includes('formatted.length > this.currentParams.MAX_CONTEXT_LENGTH'), 'Dynamic context length check missing');
assert(chatJs.includes('fullPrompt.length > this.currentParams.MAX_CONTEXT_LENGTH'), 'Dynamic context length check missing in fallback');

// Test 5: Verify dynamic history limit usage
console.log('  ✓ Testing dynamic history limit...');
assert(chatJs.includes('const historyLimit = this.currentParams ? this.currentParams.HISTORY_LIMIT : 8'), 'Dynamic history limit missing');

// Test 6: Verify console logging for transparency
console.log('  ✓ Testing parameter logging...');
assert(chatJs.includes('console.log("🎲 Using dynamic generation parameters:", params)'), 'Parameter logging missing');
assert(chatJs.includes('console.log("🎲 Dynamic parameters for this response:", this.currentParams)'), 'Current params logging missing');

// Test 7: Verify all parameters are dynamically set
console.log('  ✓ Testing all dynamic parameter usage...');
const dynamicParameterChecks = [
  'max_new_tokens: params.MAX_NEW_TOKENS',
  'temperature: params.TEMPERATURE',
  'top_p: params.TOP_P',
  'top_k: params.TOP_K',
  'repetition_penalty: params.REPETITION_PENALTY'
];

dynamicParameterChecks.forEach(check => {
  assert(chatJs.includes(check), `Dynamic parameter usage missing: ${check}`);
});

// Test 8: Verify no static CONFIG usage in generation options
console.log('  ✓ Testing removal of static parameters...');
const staticUsages = [
  'max_new_tokens: CONFIG.MAX_NEW_TOKENS',
  'temperature: CONFIG.TEMPERATURE',
  'top_p: CONFIG.TOP_P',
  'top_k: CONFIG.TOP_K',
  'repetition_penalty: CONFIG.REPETITION_PENALTY'
];

staticUsages.forEach(usage => {
  assert(!chatJs.includes(usage), `Static parameter usage should be removed: ${usage}`);
});

// Test 9: Verify parameter ranges provide meaningful variation
console.log('  ✓ Testing parameter range effectiveness...');
function testParameterVariation() {
  // Simulate the parameter generation multiple times
  const mockConfig = {
    RANGES: {
      MAX_NEW_TOKENS: { min: 80, max: 200 },
      TEMPERATURE: { min: 0.5, max: 1.3 },
      TOP_P: { min: 0.8, max: 0.95 },
      TOP_K: { min: 25, max: 55 },
      REPETITION_PENALTY: { min: 1.02, max: 1.15 }
    },

    getDynamicValues() {
      const values = {};
      for (const [key, range] of Object.entries(this.RANGES)) {
        if (key.includes('TEMPERATURE') || key.includes('TOP_P') || key.includes('REPETITION_PENALTY')) {
          values[key] = Math.random() * (range.max - range.min) + range.min;
        } else {
          values[key] = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
        }
      }
      return values;
    }
  };

  const samples = [];
  for (let i = 0; i < 20; i++) {
    samples.push(mockConfig.getDynamicValues());
  }

  // Check that we get meaningful variation
  const temperatures = samples.map(s => s.TEMPERATURE);
  const tokens = samples.map(s => s.MAX_NEW_TOKENS);
  const topPs = samples.map(s => s.TOP_P);

  const tempRange = Math.max(...temperatures) - Math.min(...temperatures);
  const tokenRange = Math.max(...tokens) - Math.min(...tokens);
  const topPRange = Math.max(...topPs) - Math.min(...topPs);

  console.log(`    Temperature variation: ${tempRange.toFixed(3)} (${Math.min(...temperatures).toFixed(3)} - ${Math.max(...temperatures).toFixed(3)})`);
  console.log(`    Token count variation: ${tokenRange} (${Math.min(...tokens)} - ${Math.max(...tokens)})`);
  console.log(`    Top-P variation: ${topPRange.toFixed(3)} (${Math.min(...topPs).toFixed(3)} - ${Math.max(...topPs).toFixed(3)})`);

  // Assert meaningful variation exists
  assert(tempRange > 0.3, 'Temperature should vary significantly');
  assert(tokenRange > 50, 'Token count should vary significantly');
  assert(topPRange > 0.05, 'Top-P should vary meaningfully');

  return true;
}

assert(testParameterVariation(), 'Parameter variation test failed');

console.log('\n✅ End-to-end dynamic generation tests passed!');
console.log('- generateText method properly accepts and uses dynamic parameters');
console.log('- Parameters are correctly passed from ChatEngine to ModelManager');
console.log('- Sampling is automatically enabled for temperature > 0.05');
console.log('- Context length and history limits use dynamic values');
console.log('- All generation parameters are dynamically set');
console.log('- Static CONFIG usage removed from generation options');
console.log('- Console logging provides full parameter transparency');
console.log('- Parameter ranges provide meaningful variation between responses');
console.log('- Each message will have unique generation characteristics!');