const fs = require('fs');
const path = require('path');
const getLogger = require('./logger');
const SharedPdfProcessor = require('./pdf-processor');

async function verify() {
    console.log('🧪 Starting verification of Shared Utils...\n');
    let errors = 0;

    // 1. Verify Logger
    console.log('1️⃣  Testing Logger...');
    try {
        const logger = getLogger('test-service');
        const testMessage = `Verification run at ${new Date().toISOString()}`;
        logger.info(testMessage);

        // Give it a moment to flush to disk
        await new Promise(resolve => setTimeout(resolve, 1000));

        const date = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
        const logDir = path.join(__dirname, '../logs');
        // Find the log file (handling daily rotate naming)
        const files = fs.readdirSync(logDir);
        const logFile = files.find(f => f.includes(date) && f.includes('combined'));

        if (logFile) {
            const content = fs.readFileSync(path.join(logDir, logFile), 'utf8');
            if (content.includes(testMessage)) {
                console.log('✅ Logger wrote to file successfully.');
            } else {
                console.error('❌ Logger created file but message was not found.');
                errors++;
            }
        } else {
            console.error(`❌ Log file for today (${date}) not found in ${logDir}.`);
            errors++;
        }
    } catch (err) {
        console.error('❌ Logger test failed:', err.message);
        errors++;
    }

    // 2. Verify PDF Processor Config
    console.log('\n2️⃣  Testing PDF Processor Configuration...');
    try {
        // Test with invalid config
        const badProcessor = new SharedPdfProcessor({ baseDir: './non-existent' });
        const badConfig = badProcessor.validateConfig();
        if (badConfig.valid === false) {
            console.log('✅ Correctly identified invalid config.');
        } else {
            console.error('❌ Failed to detect invalid config.');
            errors++;
        }

        // Test with default (assuming D:\Results exists or whatever is in env)
        const processor = new SharedPdfProcessor();
        const config = processor.validateConfig();
        if (config.valid) {
            console.log(`✅ Default config is valid (BaseDir: ${processor.baseDir})`);
        } else {
            console.log(`⚠️ Default config invalid (BaseDir: ${processor.baseDir}). This is expected if specific folder doesn't exist on this machine.`);
            // Not counting as error as user environment might vary
        }

    } catch (err) {
        console.error('❌ PDF Processor test failed:', err.message);
        errors++;
    }

    console.log('\n----------------------------------------');
    if (errors === 0) {
        console.log('🎉 Verification PASSED: Shared utilities are working correctly.');
    } else {
        console.log(`🚨 Verification FAILED with ${errors} errors.`);
        process.exit(1);
    }
}

verify();
