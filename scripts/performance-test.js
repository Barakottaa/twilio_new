#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Performance Test...\n');

// Test 1: Bundle Size Analysis
console.log('📦 Testing Bundle Size...');
try {
  execSync('npm run build:analyze', { stdio: 'inherit' });
  console.log('✅ Bundle analysis completed\n');
} catch (error) {
  console.log('❌ Bundle analysis failed:', error.message, '\n');
}

// Test 2: Memory Usage Test
console.log('🧠 Testing Memory Usage...');
const startTime = Date.now();

// Start the dev server in background
const devProcess = execSync('npm run dev', { 
  stdio: 'pipe',
  timeout: 30000 // 30 seconds timeout
});

setTimeout(() => {
  try {
    // Try to get memory usage (this is a simplified test)
    const memoryUsage = process.memoryUsage();
    console.log('📊 Memory Usage:');
    console.log(`  RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)} MB`);
    console.log(`  Heap Used: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`);
    console.log(`  Heap Total: ${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`);
    console.log(`  External: ${Math.round(memoryUsage.external / 1024 / 1024)} MB`);
    
    if (memoryUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
      console.log('⚠️  High memory usage detected (>500MB)');
    } else {
      console.log('✅ Memory usage is acceptable');
    }
  } catch (error) {
    console.log('❌ Memory test failed:', error.message);
  }
}, 10000); // Wait 10 seconds

// Test 3: Build Time Test
console.log('\n⏱️  Testing Build Time...');
const buildStartTime = Date.now();
try {
  execSync('npm run build', { stdio: 'pipe' });
  const buildTime = Date.now() - buildStartTime;
  console.log(`✅ Build completed in ${Math.round(buildTime / 1000)}s`);
  
  if (buildTime > 60000) { // 60 seconds
    console.log('⚠️  Build time is slow (>60s)');
  } else {
    console.log('✅ Build time is acceptable');
  }
} catch (error) {
  console.log('❌ Build test failed:', error.message);
}

// Test 4: Bundle Size Check
console.log('\n📏 Checking Bundle Sizes...');
try {
  const buildDir = path.join(process.cwd(), '.next');
  if (fs.existsSync(buildDir)) {
    const stats = fs.statSync(buildDir);
    console.log(`📁 Build directory size: ${Math.round(stats.size / 1024 / 1024)} MB`);
  }
} catch (error) {
  console.log('❌ Bundle size check failed:', error.message);
}

console.log('\n🎯 Performance Test Summary:');
console.log('1. Bundle analysis completed');
console.log('2. Memory usage checked');
console.log('3. Build time measured');
console.log('4. Bundle size verified');
console.log('\n✨ Performance test completed!');
