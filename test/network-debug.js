// network-debug.js - Simple network test to check for common errors
// Run with: node test/network-debug.js

const { spawn } = require('child_process');
const { promises: fs } = require('fs');
const path = require('path');

class NetworkDebugger {
  constructor() {
    this.server = null;
    this.results = [];
  }

  async startServer() {
    console.log('🚀 Starting live-server...');

    return new Promise((resolve) => {
      this.server = spawn('npx', ['live-server', '--port=8002', '--no-browser', '--quiet'], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.server.stdout.on('data', (data) => {
        if (data.toString().includes('Serving')) {
          console.log('✅ Server started on http://localhost:8002');
        }
      });

      // Give server time to start
      setTimeout(resolve, 2000);
    });
  }

  async stopServer() {
    if (this.server) {
      this.server.kill();
      console.log('🛑 Server stopped');
    }
  }

  async checkUrl(url, description) {
    return new Promise((resolve) => {
      const curl = spawn('curl', [
        '-s', '-I', // Silent, head only
        '-w', '%{http_code}\\n', // Write HTTP status
        url
      ]);

      let output = '';
      curl.stdout.on('data', (data) => {
        output += data.toString();
      });

      curl.on('close', (code) => {
        const lines = output.trim().split('\\n');
        const httpCode = lines[lines.length - 1];

        this.results.push({
          url,
          description,
          httpCode: parseInt(httpCode),
          success: httpCode.startsWith('2'),
          curlExitCode: code
        });

        resolve();
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        curl.kill();
        this.results.push({
          url,
          description,
          httpCode: 0,
          success: false,
          curlExitCode: 'timeout',
          error: 'Request timeout'
        });
        resolve();
      }, 5000);
    });
  }

  async scanFileSystem() {
    console.log('📁 Scanning file system for referenced resources...');

    const filesToCheck = [
      { path: '/assets/chat.css', desc: 'Chat component styles' },
      { path: '/assets/chat.js', desc: 'Chat component JavaScript' },
      { path: '/assets/context.js', desc: 'Context module' },
      { path: '/assets/resume.json', desc: 'Resume data' },
      { path: '/public/files/highlights.sample.json', desc: 'Book highlights data' },
      { path: '/public/files/manuscript.sample.txt', desc: 'Book manuscript' },
      { path: '/public/files/resume.sample.pdf', desc: 'Resume PDF' }
    ];

    console.log('🔍 Testing resource availability...');

    for (const file of filesToCheck) {
      await this.checkUrl(`http://localhost:8002/${file.path.replace(/^\//, '')}`, file.desc);
    }
  }

  async testTransformersJs() {
    console.log('🤖 Testing Transformers.js CDN...');

    const cdnUrls = [
      {
        url: 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2/package.json',
        desc: 'Transformers.js CDN availability'
      }
    ];

    for (const item of cdnUrls) {
      await this.checkUrl(item.url, item.desc);
    }
  }

  generateReport() {
    console.log('\\n' + '='.repeat(80));
    console.log('📊 NETWORK DEBUG REPORT');
    console.log('='.repeat(80));

    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);

    console.log(`\\n✅ SUCCESSFUL REQUESTS (${successful.length}):`);
    successful.forEach(r => {
      console.log(`  ${r.httpCode}: ${r.description} - ${r.url}`);
    });

    console.log(`\\n❌ FAILED REQUESTS (${failed.length}):`);
    failed.forEach(r => {
      const status = r.httpCode === 0 ? 'TIMEOUT' : r.httpCode;
      console.log(`  ${status}: ${r.description} - ${r.url}`);
      if (r.error) console.log(`    Error: ${r.error}`);
    });

    console.log(`\\n🔧 OPTIMIZATION OPPORTUNITIES:`);

    const notFound = failed.filter(r => r.httpCode === 404);
    if (notFound.length > 0) {
      console.log(`  🚫 Remove 404 requests (${notFound.length} found):`);
      notFound.forEach(r => {
        console.log(`    - ${r.url} (${r.description})`);
      });
    }

    const timeouts = failed.filter(r => r.httpCode === 0);
    if (timeouts.length > 0) {
      console.log(`  ⏰ Timeout requests to investigate (${timeouts.length} found):`);
      timeouts.forEach(r => {
        console.log(`    - ${r.url} (${r.description})`);
      });
    }

    // Check for duplicate paths
    const paths = this.results.map(r => new URL(r.url).pathname);
    const duplicates = paths.filter((path, index) => paths.indexOf(path) !== index);
    if (duplicates.length > 0) {
      console.log(`  📄 Potential duplicate requests:`);
      [...new Set(duplicates)].forEach(path => {
        console.log(`    - ${path}`);
      });
    }

    console.log('\\n' + '='.repeat(80));
  }

  async run() {
    try {
      await this.startServer();
      await this.scanFileSystem();
      await this.testTransformersJs();
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
  const tester = new NetworkDebugger();
  tester.run().catch(console.error);
}

module.exports = NetworkDebugger;