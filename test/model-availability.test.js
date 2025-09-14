const fs = require('fs');
const assert = require('assert');

// 1. Read chat.js and extract the MODELS array
const chatJsContent = fs.readFileSync('assets/chat.js', 'utf8');
const modelsRegex = new RegExp("const MODELS = (\\s*\[[\\s\\S]*?\]);");
const match = chatJsContent.match(modelsRegex);

assert(match && match[1], 'Test failed: Could not find the MODELS array in assets/chat.js. Please check the regex.');

const modelsArrayString = match[1];
let models = [];
try {
  // Using a function constructor for safer evaluation than direct eval()
  models = new Function(`return ${modelsArrayString}`)();
  assert(Array.isArray(models) && models.length > 0, 'Test failed: MODELS array is empty or invalid.');
} catch (e) {
  assert.fail(`Test failed: Could not parse the MODELS array from chat.js. Error: ${e.message}`);
}

// 2. Define the test function
async function checkModelAvailability() {
  console.log('--- Checking Hugging Face Model Availability ---\n');
  const promises = models.map(async (model) => {
    const url = `https://huggingface.co/${model.id}/resolve/main/config.json`;
    try {
      // Use a HEAD request to check for existence without downloading the full file
      const response = await fetch(url, { method: 'HEAD' });
      assert.ok(response.ok, `[FAILED] ${model.id} - Not found or access denied (Status: ${response.status})`);
      console.log(`[OK] ${model.id}`);
      return { id: model.id, status: 'OK' };
    } catch (error) {
      console.error(`[ERROR] ${model.id} - Request failed: ${error.message}`);
      // Re-throw to fail the test
      throw error;
    }
  });

  try {
    await Promise.all(promises);
    console.log('\n✅ All models are available on the Hugging Face Hub.');
  } catch (error) {
    console.error('\n❌ One or more models failed the availability check.');
    // Exit with a non-zero code to indicate test failure, which is good for CI/CD pipelines
    process.exit(1);
  }
}

// 3. Run the test
checkModelAvailability();
