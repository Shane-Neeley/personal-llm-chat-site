// browser-debug.js - Browser test to monitor network calls and errors
// Run with: node test/browser-debug.js

const { spawn } = require('child_process');
const fs = require('fs').promises;

class BrowserDebugger {
  constructor() {
    this.server = null;
    this.networkCalls = [];
    this.errors = [];
    this.startTime = Date.now();
  }

  async startServer() {
    console.log('🚀 Starting live-server...');

    return new Promise((resolve, reject) => {
      this.server = spawn('npx', ['live-server', '--port=8001', '--no-browser', '--quiet'], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.server.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Serving')) {
          console.log('✅ Server started');
          setTimeout(resolve, 1000); // Give server time to fully start
        }
      });

      this.server.stderr.on('data', (data) => {
        console.log('Server error:', data.toString());
      });

      this.server.on('error', reject);

      // Timeout fallback
      setTimeout(() => resolve(), 3000);
    });
  }

  async stopServer() {
    if (this.server) {
      this.server.kill();
      console.log('🛑 Server stopped');
    }
  }

  async runPuppeteerTest() {
    console.log('🔍 Starting browser test...');

    // Use dynamic import to avoid requiring puppeteer as dependency
    let puppeteer;
    try {
      puppeteer = require('puppeteer');
    } catch (e) {
      console.log('📦 Puppeteer not found, installing temporarily...');
      await new Promise((resolve, reject) => {
        const install = spawn('npm', ['install', '--no-save', 'puppeteer'], { stdio: 'inherit' });
        install.on('close', (code) => code === 0 ? resolve() : reject());
      });
      puppeteer = require('puppeteer');
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Track network requests
    page.on('request', (request) => {
      this.networkCalls.push({
        url: request.url(),
        method: request.method(),
        type: request.resourceType(),
        timestamp: Date.now() - this.startTime
      });
    });

    // Track failed requests
    page.on('requestfailed', (request) => {
      this.errors.push({
        type: 'network',
        url: request.url(),
        error: request.failure().errorText,
        timestamp: Date.now() - this.startTime
      });
    });

    // Track response errors
    page.on('response', (response) => {
      if (!response.ok()) {
        this.errors.push({
          type: 'http',
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          timestamp: Date.now() - this.startTime
        });
      }
    });

    // Track console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.errors.push({
          type: 'console',
          message: msg.text(),
          timestamp: Date.now() - this.startTime
        });
      }
    });

    // Track JavaScript errors
    page.on('pageerror', (error) => {
      this.errors.push({
        type: 'javascript',
        message: error.message,
        stack: error.stack,
        timestamp: Date.now() - this.startTime
      });
    });

    console.log('🌐 Loading page...');
    await page.goto('http://localhost:8001', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait for AI chat component to load
    console.log('⏳ Waiting for AI chat component...');
    try {
      await page.waitForSelector('ai-chat', { timeout: 10000 });
      console.log('✅ AI chat component loaded');
    } catch (e) {
      console.log('⚠️ AI chat component not found within timeout');
    }

    // Give everything time to load and make network calls
    console.log('⏳ Monitoring network activity...');
    await page.waitForTimeout(5000);

    await browser.close();
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 BROWSER DEBUG REPORT');
    console.log('='.repeat(80));

    // Network calls summary
    console.log(`\n🌐 NETWORK CALLS (${this.networkCalls.length} total):`);

    const callsByType = {};
    const callsByDomain = {};

    this.networkCalls.forEach(call => {
      // Count by type
      callsByType[call.type] = (callsByType[call.type] || 0) + 1;

      // Count by domain
      const domain = new URL(call.url).hostname || 'localhost';
      callsByDomain[domain] = (callsByDomain[domain] || 0) + 1;

      // Log individual calls
      console.log(`  ${call.timestamp}ms: ${call.method} ${call.type} ${call.url}`);
    });

    console.log(`\n📈 Calls by type:`, callsByType);
    console.log(`🏠 Calls by domain:`, callsByDomain);

    // Errors summary
    console.log(`\n❌ ERRORS (${this.errors.length} total):`);
    this.errors.forEach(error => {
      console.log(`  ${error.timestamp}ms: [${error.type.toUpperCase()}] ${error.url || error.message}`);
      if (error.status) console.log(`    Status: ${error.status} ${error.statusText}`);
      if (error.error) console.log(`    Error: ${error.error}`);
    });

    // Optimization suggestions
    console.log(`\n🔧 OPTIMIZATION OPPORTUNITIES:`);

    const duplicateUrls = {};
    this.networkCalls.forEach(call => {
      duplicateUrls[call.url] = (duplicateUrls[call.url] || 0) + 1;
    });

    const duplicates = Object.entries(duplicateUrls).filter(([url, count]) => count > 1);
    if (duplicates.length > 0) {
      console.log(`  📄 Duplicate requests found:`);
      duplicates.forEach(([url, count]) => {
        console.log(`    ${count}x: ${url}`);
      });
    }

    const errorUrls = this.errors.filter(e => e.url).map(e => e.url);
    if (errorUrls.length > 0) {
      console.log(`  🚫 Failed requests to optimize:`);
      [...new Set(errorUrls)].forEach(url => {
        console.log(`    ${url}`);
      });
    }

    console.log('\n' + '='.repeat(80));
  }

  async run() {
    try {
      await this.startServer();
      await this.runPuppeteerTest();
      this.generateReport();
    } catch (error) {
      console.error('❌ Test failed:', error);
    } finally {
      await this.stopServer();
    }
  }
}

// Run the test
if (require.main === module) {
  const tester = new BrowserDebugger();
  tester.run().catch(console.error);
}

module.exports = BrowserDebugger;