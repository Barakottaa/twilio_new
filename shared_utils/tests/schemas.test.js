const { validateBirdRequest, TwilioWebhookSchema, ProcessPdfSchema } = require('../schemas');

describe('Input Validation Schemas', () => {

    describe('Bird Webhook', () => {
        test('should validate Format 1 (Direct)', () => {
            const payload = {
                sender: { contact: { identifierValue: '12345' } },
                body: { text: { text: 'test message' } }
            };
            const result = validateBirdRequest(payload);
            expect(result.success).toBe(true);
            expect(result.phoneNumber).toBe('12345');
        });

        test('should validate Format 2 (Nested Object)', () => {
            const payload = {
                payload: {
                    sender: { contact: { identifierValue: '12345' } },
                    body: { text: { text: 'test message' } }
                }
            };
            const result = validateBirdRequest(payload);
            expect(result.success).toBe(true);
            expect(result.phoneNumber).toBe('12345');
        });

        test('should fail if no phone number', () => {
            const payload = { body: { text: { text: 'test' } } };
            const result = validateBirdRequest(payload);
            expect(result.success).toBe(false);
        });
    });

    describe('Twilio Webhook', () => {
        test('should validate standard request', () => {
            const payload = { From: 'whatsapp:+123', Body: 'hello' };
            const result = TwilioWebhookSchema.safeParse(payload);
            expect(result.success).toBe(true);
        });

        test('should fail if completely empty', () => {
            const result = TwilioWebhookSchema.safeParse({});
            expect(result.success).toBe(false);
        });
    });

    describe('Process PDF Request', () => {
        test('should validate valid phone number', () => {
            const result = ProcessPdfSchema.safeParse({ phoneNumber: '12345' });
            expect(result.success).toBe(true);
        });

        test('should fail short phone number', () => {
            const result = ProcessPdfSchema.safeParse({ phoneNumber: '12' });
            expect(result.success).toBe(false);
        });
    });
});
