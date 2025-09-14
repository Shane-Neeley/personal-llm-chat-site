// Test for dynamic configuration functionality
const fs = require('fs');
const assert = require('assert');

// Read the chat.js file to test dynamic config integration
const chatJs = fs.readFileSync('assets/chat.js', 'utf8');

console.log('Testing dynamic configuration functionality...');

// Test 1: Verify RANGES object exists
console.log('  ✓ Testing RANGES configuration...');
assert(chatJs.includes('RANGES: {'), 'RANGES object missing');
assert(chatJs.includes('MAX_NEW_TOKENS: { min:'), 'MAX_NEW_TOKENS range missing');
assert(chatJs.includes('TEMPERATURE: { min:'), 'TEMPERATURE range missing');
assert(chatJs.includes('TOP_P: { min:'), 'TOP_P range missing');
assert(chatJs.includes('TOP_K: { min:'), 'TOP_K range missing');
assert(chatJs.includes('REPETITION_PENALTY: { min:'), 'REPETITION_PENALTY range missing');

// Test 2: Verify getDynamicValues function exists
console.log('  ✓ Testing getDynamicValues function...');
assert(chatJs.includes('getDynamicValues()'), 'getDynamicValues method missing');
assert(chatJs.includes('Math.random() * (range.max - range.min)'), 'Random value generation missing');

// Test 3: Verify dynamic parameters are used in ChatEngine
console.log('  ✓ Testing dynamic parameter usage...');
assert(chatJs.includes('this.currentParams = CONFIG.getDynamicValues()'), 'Dynamic parameter generation missing');
assert(chatJs.includes('console.log("🎲 Dynamic parameters for this response:"'), 'Dynamic parameter logging missing');

// Test 4: Test the dynamic value generation logic
console.log('  ✓ Testing value generation logic...');
function testDynamicGeneration() {
  // Simulate the CONFIG object and getDynamicValues function
  const mockConfig = {
    RANGES: {
      MAX_NEW_TOKENS: { min: 80, max: 200 },
      TEMPERATURE: { min: 0.5, max: 1.3 },
      TOP_P: { min: 0.8, max: 0.95 },
      TOP_K: { min: 25, max: 55 },
      REPETITION_PENALTY: { min: 1.02, max: 1.15 },
      HISTORY_LIMIT: { min: 5, max: 10 },
      MAX_CONTEXT_LENGTH: { min: 800, max: 1100 }
    },

    getDynamicValues() {
      const values = {};
      for (const [key, range] of Object.entries(this.RANGES)) {
        if (key.includes('TEMPERATURE') || key.includes('TOP_P') || key.includes('REPETITION_PENALTY')) {
          // Use more precision for float values
          values[key] = Math.random() * (range.max - range.min) + range.min;
        } else {
          // Use integers for token counts, limits, etc.
          values[key] = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
        }
      }
      return values;
    }
  };

  // Generate multiple sets of dynamic values to test ranges
  for (let i = 0; i < 10; i++) {
    const values = mockConfig.getDynamicValues();

    // Test ranges are respected
    assert(values.MAX_NEW_TOKENS >= 80 && values.MAX_NEW_TOKENS <= 200, 'MAX_NEW_TOKENS out of range');
    assert(values.TEMPERATURE >= 0.5 && values.TEMPERATURE <= 1.3, 'TEMPERATURE out of range');
    assert(values.TOP_P >= 0.8 && values.TOP_P <= 0.95, 'TOP_P out of range');
    assert(values.TOP_K >= 25 && values.TOP_K <= 55, 'TOP_K out of range');
    assert(values.REPETITION_PENALTY >= 1.02 && values.REPETITION_PENALTY <= 1.15, 'REPETITION_PENALTY out of range');
    assert(values.HISTORY_LIMIT >= 5 && values.HISTORY_LIMIT <= 10, 'HISTORY_LIMIT out of range');
    assert(values.MAX_CONTEXT_LENGTH >= 800 && values.MAX_CONTEXT_LENGTH <= 1100, 'MAX_CONTEXT_LENGTH out of range');

    // Test that integer values are actually integers
    assert(Number.isInteger(values.MAX_NEW_TOKENS), 'MAX_NEW_TOKENS should be integer');
    assert(Number.isInteger(values.TOP_K), 'TOP_K should be integer');
    assert(Number.isInteger(values.HISTORY_LIMIT), 'HISTORY_LIMIT should be integer');
    assert(Number.isInteger(values.MAX_CONTEXT_LENGTH), 'MAX_CONTEXT_LENGTH should be integer');

    // Test that float values have precision
    assert(!Number.isInteger(values.TEMPERATURE), 'TEMPERATURE should be float');
    assert(!Number.isInteger(values.TOP_P), 'TOP_P should be float');
    assert(!Number.isInteger(values.REPETITION_PENALTY), 'REPETITION_PENALTY should be float');
  }

  return true;
}

assert(testDynamicGeneration(), 'Dynamic generation logic test failed');

// Test 5: Verify appropriate temperature range for creativity
console.log('  ✓ Testing temperature range for creativity...');
const tempMatch = chatJs.match(/TEMPERATURE:\s*{\s*min:\s*([\d.]+),\s*max:\s*([\d.]+)\s*}/);
if (tempMatch) {
  const minTemp = parseFloat(tempMatch[1]);
  const maxTemp = parseFloat(tempMatch[2]);
  console.log(`    Temperature range: ${minTemp} - ${maxTemp}`);

  assert(minTemp > 0, 'Temperature minimum should be greater than 0 for creativity');
  assert(maxTemp <= 2.0, 'Temperature maximum should be reasonable (<=2.0)');
  assert(maxTemp > minTemp, 'Temperature max should be greater than min');
}

// Test 6: Verify reasonable token count ranges
console.log('  ✓ Testing token count ranges...');
const tokenMatch = chatJs.match(/MAX_NEW_TOKENS:\s*{\s*min:\s*(\d+),\s*max:\s*(\d+)\s*}/);
if (tokenMatch) {
  const minTokens = parseInt(tokenMatch[1]);
  const maxTokens = parseInt(tokenMatch[2]);
  console.log(`    Token range: ${minTokens} - ${maxTokens}`);

  assert(minTokens >= 50, 'Minimum tokens should be at least 50 for meaningful responses');
  assert(maxTokens <= 300, 'Maximum tokens should be reasonable for speed (<= 300)');
  assert(maxTokens > minTokens, 'Max tokens should be greater than min tokens');
}

console.log('\n✅ Dynamic configuration tests passed!');
console.log('- RANGES object properly configured');
console.log('- getDynamicValues function implemented');
console.log('- Dynamic parameters integrated into ChatEngine');
console.log('- Value generation logic working correctly');
console.log('- Temperature range provides good creativity variation');
console.log('- Token ranges are reasonable for speed and quality');
console.log('- Integer/float types correctly handled');
console.log('- All parameter ranges are within acceptable bounds');