const { z } = require('zod');

// Schema for the 'process-pdf-folder' endpoint
const ProcessPdfSchema = z.object({
    phoneNumber: z.string().min(5, "Phone number is too short")
});

// Twilio Webhook Schema
// Twilio sends data as form-urlencoded, but Express parses it to body.
// We accept either strict structure or partials depending on what we strictly need.
const TwilioWebhookSchema = z.object({
    From: z.string().optional(),
    Body: z.string().optional(),
    MessageSid: z.string().optional(),
    FromCountry: z.string().optional()
}).refine(data => data.From || data.FromCountry, {
    message: "Either 'From' or 'FromCountry' must be present"
});

// Bird Webhook Schema
// Complex because of multiple formats supported in legacy code
const BirdWebhookSchema = z.object({
    // Format 1
    sender: z.object({
        contact: z.object({
            identifierValue: z.string().optional()
        }).optional()
    }).optional(),

    body: z.object({
        text: z.object({
            text: z.string().optional()
        }).optional()
    }).optional(),

    // Format 2 & 3 (nested in payload)
    payload: z.object({
        sender: z.object({
            contact: z.union([
                // Format 2: object
                z.object({ identifierValue: z.string().optional() }),
                // Format 3: array
                z.array(z.object({ identifierValue: z.string().optional() }))
            ]).optional()
        }).optional(),

        body: z.object({
            text: z.object({
                text: z.string().optional()
            }).optional()
        }).optional()
    }).optional()
});

/**
 * Helper to validate Bird Request and extract data
 * Encapsulates the logic from listener.js
 */
const validateBirdRequest = (body) => {
    const result = BirdWebhookSchema.safeParse(body);
    if (!result.success) return { success: false, error: result.error };

    const data = result.data;
    let phoneNumber, message;

    // Extraction logic matching legacy listener
    if (data.sender?.contact?.identifierValue) {
        phoneNumber = data.sender.contact.identifierValue;
        message = data.body?.text?.text;
    } else if (data.payload?.sender?.contact) {
        const contact = data.payload.sender.contact;
        if (Array.isArray(contact)) {
            phoneNumber = contact[0]?.identifierValue;
        } else {
            phoneNumber = contact.identifierValue;
        }
        message = data.payload.body?.text?.text;
    }

    if (!phoneNumber) {
        return { success: false, error: 'No phone number found in request structure' };
    }

    return { success: true, phoneNumber, message };
};

module.exports = {
    ProcessPdfSchema,
    TwilioWebhookSchema,
    validateBirdRequest
};
