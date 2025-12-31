const fs = require('fs');
const path = require('path');
const getLogger = require('../logger');

// Mock winston to avoid actual file writing during test? 
// Or we can just let it write to a specific test folder.
// For integration testing, writing to a temp folder is better.

describe('Logger Utility', () => {
    const testLogDir = path.join(__dirname, '../../logs');

    test('should create a logger instance', () => {
        const logger = getLogger('test-suite');
        expect(logger).toBeDefined();
        expect(logger.info).toBeDefined();
        expect(logger.error).toBeDefined();
    });

    test('should write to log file', async () => {
        const logger = getLogger('test-suite');
        const uniqueMsg = `TEST-${Date.now()}`;

        logger.info(uniqueMsg);

        // Wait for potential async flush
        await new Promise(r => setTimeout(r, 1500));

        // Find today's log
        const date = new Date().toLocaleDateString('en-CA');
        const files = fs.readdirSync(testLogDir);
        const logFile = files.find(f => f.includes(date) && f.includes('combined'));

        expect(logFile).toBeDefined();

        if (logFile) {
            const content = fs.readFileSync(path.join(testLogDir, logFile), 'utf8');
            expect(content).toContain(uniqueMsg);
        }
    });
});
