const fs = require('fs');
const path = require('path');
const SharedPdfProcessor = require('../pdf-processor');

// Mock dependencies
jest.mock('pdf-poppler', () => ({
    convert: jest.fn().mockResolvedValue('MOCK_CONVERSION_SUCCESS')
}));

jest.mock('../logger', () => {
    return () => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn()
    });
});

describe('SharedPdfProcessor', () => {
    const TEST_DIR = path.join(__dirname, 'test-results');

    beforeAll(() => {
        // Setup test directory structure
        if (!fs.existsSync(TEST_DIR)) fs.mkdirSync(TEST_DIR);

        // Create a mock patient folder
        const patientFolder = path.join(TEST_DIR, '0123456789');
        if (!fs.existsSync(patientFolder)) fs.mkdirSync(patientFolder);

        // Create a dummy PDF
        fs.writeFileSync(path.join(patientFolder, 'test.pdf'), 'dummy content');

        // Mock image generation (simulate what pdf-poppler would output)
        const imagesDir = path.join(patientFolder, 'images');
        if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir);
        fs.writeFileSync(path.join(imagesDir, 'page-1.jpg'), 'dummy image');
    });

    afterAll(() => {
        // Cleanup
        fs.rmSync(TEST_DIR, { recursive: true, force: true });
    });

    test('validateConfig should return valid for existing dir', () => {
        const processor = new SharedPdfProcessor({ baseDir: TEST_DIR });
        const config = processor.validateConfig();
        expect(config.valid).toBe(true);
    });

    test('validateConfig should return invalid for non-existing dir', () => {
        const processor = new SharedPdfProcessor({ baseDir: '/non-existent/path' });
        const config = processor.validateConfig();
        expect(config.valid).toBe(false);
    });

    test('processPdf should find folder and call callback', async () => {
        const processor = new SharedPdfProcessor({ baseDir: TEST_DIR });

        const sendCallback = jest.fn().mockResolvedValue({
            success: true,
            messageId: 'MSG_123'
        });

        const result = await processor.processPdf('0123456789', sendCallback);

        expect(result.success).toBe(true);
        expect(result.images).toContain('page-1');
        expect(sendCallback).toHaveBeenCalled();
    });
});
