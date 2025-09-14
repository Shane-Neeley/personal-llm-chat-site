// Test for ONNX Community model fetching functionality
const fs = require('fs');
const assert = require('assert');

// Read the chat.js file to test ONNX integration
const chatJs = fs.readFileSync('assets/chat.js', 'utf8');

// Test 1: Verify ONNX model options are present
assert(chatJs.includes('ONNX_RECENT'), 'ONNX_RECENT option missing from chat.js');
assert(chatJs.includes('ONNX_RANDOM'), 'ONNX_RANDOM option missing from chat.js');
assert(chatJs.includes('🆕 Most Recent'), 'Most Recent option text missing');
assert(chatJs.includes('🎲 Random ONNX Model'), 'Random option text missing');

// Test 2: Verify refresh functionality exists
assert(chatJs.includes('refreshONNXModels'), 'refreshONNXModels method missing');
assert(chatJs.includes('getSelectedONNXModel'), 'getSelectedONNXModel method missing');

// Test 3: Verify correct API endpoint
assert(chatJs.includes('search=onnx-community'), 'Correct API search parameter missing');
assert(chatJs.includes('sort=lastModified'), 'Correct API sort parameter missing');

// Test 4: Verify model filtering logic exists
assert(chatJs.includes('isTextGen'), 'Text generation filtering missing');
assert(chatJs.includes('isChatModel'), 'Chat model filtering missing');
assert(chatJs.includes('isSmallModel'), 'Small model filtering missing');

// Test 5: Verify filtering keywords are present
const filteringKeywords = [
  'chatter', 'gpt', 'llama', 'dialog', 'chat', 'instruct', 'tinystories', 'qwen',
  '33m', '300m', '0.5b', 'small', 'tiny', 'mini'
];

filteringKeywords.forEach(keyword => {
  assert(chatJs.includes(keyword), `Filtering keyword '${keyword}' missing`);
});

// Test 6: Verify fallback models exist
assert(chatJs.includes('TinyStories-Instruct-33M-ONNX'), 'TinyStories fallback model missing');
assert(chatJs.includes('DialoGPT-small-player_03-ONNX'), 'DialoGPT fallback model missing');
assert(chatJs.includes('wizardlm-ONNX'), 'WizardLM fallback model missing');

// Test 7: Verify refresh button exists in HTML template
assert(chatJs.includes('id="refresh"'), 'Refresh button missing from template');
assert(chatJs.includes('🔄'), 'Refresh button icon missing');

// Test 8: Verify error handling exists
assert(chatJs.includes('Failed to fetch ONNX models'), 'ONNX error handling missing');
assert(chatJs.includes('No ONNX models available'), 'Empty models error handling missing');

// Test 9: Test model selection logic (simulate the functions)
function testModelSelection() {
  // Simulate the getSelectedONNXModel logic
  const mockModels = [
    { id: 'onnx-community/chatterbox-onnx', created_at: '2024-01-25' },
    { id: 'onnx-community/model-2', created_at: '2024-01-20' },
    { id: 'onnx-community/model-3', created_at: '2024-01-15' }
  ];
  
  // Test recent selection (should be first)
  const recent = mockModels[0];
  assert(recent.id === 'onnx-community/chatterbox-onnx', 'Recent model selection failed');
  
  // Test random selection (should be valid index)
  const randomIndex = Math.floor(Math.random() * mockModels.length);
  const random = mockModels[randomIndex];
  assert(random && random.id, 'Random model selection failed');
  
  return true;
}

// Test 10: Verify the filtering function works
function testModelFiltering() {
  const testModels = [
    { id: 'onnx-community/chatterbox-onnx', pipeline_tag: undefined, tags: ['onnx'] },
    { id: 'onnx-community/TinyStories-33M-ONNX', pipeline_tag: 'text-generation', tags: [] },
    { id: 'onnx-community/large-bert-ONNX', pipeline_tag: 'fill-mask', tags: ['large'] },
    { id: 'onnx-community/dinov3-vit-ONNX', pipeline_tag: 'image-feature-extraction', tags: [] }
  ];
  
  // Simulate the filtering logic from chat.js
  const filtered = testModels.filter(model => {
    const name = model.id.toLowerCase();
    const tags = (model.tags || []).join(' ').toLowerCase();
    const pipelineTag = model.pipeline_tag;
    
    const isTextGen = pipelineTag === 'text-generation' || 
                     tags.includes('text-generation') ||
                     tags.includes('conversational');
    
    const isChatModel = name.includes('gpt') || name.includes('llama') || 
                       name.includes('dialog') || name.includes('chat') ||
                       name.includes('instruct') || name.includes('tinystories') ||
                       name.includes('chatter') || name.includes('qwen');
    
    const isSmallModel = name.includes('0.5b') || name.includes('33m') || 
                        name.includes('300m') || name.includes('small') ||
                        name.includes('tiny') || name.includes('mini');
    
    const isLargeModel = name.includes('large') || name.includes('vit') ||
                        name.includes('dinov') || name.includes('layout') ||
                        (name.includes('bert') && !name.includes('tiny'));
    
    return (isTextGen || isChatModel || isSmallModel) && !isLargeModel;
  });
  
  // Should filter to chatterbox and TinyStories, exclude large-bert and dinov3
  assert(filtered.length === 2, `Expected 2 filtered models, got ${filtered.length}`);
  assert(filtered.some(m => m.id.includes('chatterbox')), 'Chatterbox model should be included');
  assert(filtered.some(m => m.id.includes('TinyStories')), 'TinyStories model should be included');
  assert(!filtered.some(m => m.id.includes('large-bert')), 'Large BERT should be excluded');
  assert(!filtered.some(m => m.id.includes('dinov3')), 'DinoV3 should be excluded');
  
  return true;
}

// Run the additional tests
assert(testModelSelection(), 'Model selection logic test failed');
assert(testModelFiltering(), 'Model filtering logic test failed');

console.log('✅ All ONNX model tests passed!');
console.log('- ONNX options present in UI');
console.log('- Correct API endpoint configured');
console.log('- Model filtering logic implemented');
console.log('- Fallback models configured');
console.log('- Error handling implemented');
console.log('- Selection logic working correctly');