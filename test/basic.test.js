const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('index.html', 'utf8');
assert(html.includes('<meta name="viewport"'), 'viewport meta tag missing');
assert(html.includes('<ai-chat></ai-chat>'), 'ai-chat component missing');

const js = fs.readFileSync('assets/chat.js', 'utf8');
// Check that chat.js contains the expected chat functionality
assert(js.includes('class AIChat'), 'AIChat class should be present');

// Check CSS file for responsive design
const css = fs.readFileSync('assets/chat.css', 'utf8');
assert(/flex-wrap:\s*wrap/.test(css), 'chat styles should wrap for small screens');

// Run context module tests (new feature)
console.log('\nRunning context module tests...');
require('./context.test.js');

// Run manuscript functionality tests (new feature)
console.log('\nRunning manuscript functionality tests...');
require('./simple-manuscript.test.js');

console.log('\n🎉 Basic tests passed!');
