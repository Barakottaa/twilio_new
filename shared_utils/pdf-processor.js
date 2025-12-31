/**
 * Shared PDF Processor
 * Handles PDF conversion logic shared between services
 */

const fs = require("fs");
const path = require("path");
const convert = require("pdf-poppler");
const logger = require('./logger')('shared-pdf-processor');

class SharedPdfProcessor {
    constructor(config = {}) {
        this.baseDir = config.baseDir || process.env.PDF_BASE_DIR || "D:\\Results";
    }

    /**
     * Validate configuration
     */
    validateConfig() {
        try {
            if (!fs.existsSync(this.baseDir)) {
                return {
                    valid: false,
                    error: `Base directory does not exist: ${this.baseDir}`
                };
            }
            return { valid: true };
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }

    /**
     * Process PDF from folder and use callback to send images
     * @param {string} phoneNumber - Patient phone number
     * @param {function} sendImageCallback - Async function(phone, imagePath, imageName) returning {success, messageId, error}
     */
    async processPdf(phoneNumber, sendImageCallback) {
        try {
            logger.info(`🔄 Processing PDF from folder for phone: ${phoneNumber}`);

            const phone = phoneNumber.replace(/[^\d]/g, '');
            const phoneWithPlus = `+${phone}`;

            // Find all folders that match the phone number
            if (!fs.existsSync(this.baseDir)) {
                throw new Error(`Base directory not found: ${this.baseDir}`);
            }

            const allFolders = fs.readdirSync(this.baseDir);
            const matchingFolders = allFolders.filter(f => f.startsWith(phone) || f.startsWith(phoneWithPlus));

            logger.info(`🔍 Matching folders for ${phone}: ${matchingFolders.length} found`);

            if (matchingFolders.length === 0) {
                return {
                    success: false,
                    error: "Patient folder not found",
                    phoneNumber: phoneNumber
                };
            }

            // If multiple folders found, select the most recent one
            let folder;
            if (matchingFolders.length === 1) {
                folder = matchingFolders[0];
            } else {
                const folderStats = matchingFolders.map(folderName => {
                    const folderPath = path.join(this.baseDir, folderName);
                    const stats = fs.statSync(folderPath);
                    return {
                        name: folderName,
                        mtime: stats.mtime
                    };
                });

                folderStats.sort((a, b) => b.mtime - a.mtime);
                folder = folderStats[0].name;
            }

            const folderPath = path.join(this.baseDir, folder);
            const pdfFiles = fs.readdirSync(folderPath).filter(f => f.toLowerCase().endsWith('.pdf'));

            if (pdfFiles.length === 0) {
                return {
                    success: false,
                    error: "PDF file not found",
                    folder: folder
                };
            }

            const pdfPath = path.join(folderPath, pdfFiles[0]);
            logger.info(`📄 Found PDF: ${pdfFiles[0]}`);

            // Convert PDF to images
            const outputDir = path.join(folderPath, "images");

            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // Use pdf-poppler to convert
            await convert.convert(pdfPath, {
                out_dir: outputDir,
                out_prefix: "report", // Changed from Arabic text to English to avoid encoding issues in shared lib
                format: "jpeg"
            });

            const images = fs.readdirSync(outputDir)
                .filter(f => f.endsWith(".jpg"))
                .map(f => path.basename(f, '.jpg'));

            logger.info(`📸 Generated ${images.length} images`);

            // Send images back
            const sendResults = [];
            let successfulSends = 0;

            for (const imageName of images) {
                const imagePath = path.join(outputDir, imageName + '.jpg');
                try {
                    const sendResult = await sendImageCallback(phoneNumber, imagePath, imageName);
                    const success = sendResult && (sendResult.success || sendResult.sent);

                    if (success) successfulSends++;

                    sendResults.push({
                        image: imageName,
                        sent: success,
                        messageId: sendResult?.messageId || sendResult?.messageSid,
                        error: sendResult?.error
                    });
                } catch (err) {
                    logger.error(`❌ Failed to send image ${imageName}: ${err.message}`);
                    sendResults.push({
                        image: imageName,
                        sent: false,
                        error: err.message
                    });
                }
            }

            return {
                success: true,
                message: `PDF converted to ${images.length} images and sent ${successfulSends} to ${phoneNumber}`,
                images: images,
                folder: folder,
                pdfFile: pdfFiles[0],
                imagesSent: successfulSends,
                contact: phoneNumber,
                sendResults: sendResults
            };

        } catch (error) {
            logger.error("❌ Error processing from folder:", error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Cleanup old files
     */
    async cleanupOldFiles(hours = 24) {
        try {
            const now = Date.now();
            const maxAge = hours * 60 * 60 * 1000;

            if (!fs.existsSync(this.baseDir)) return;

            const folders = fs.readdirSync(this.baseDir);

            for (const folder of folders) {
                const folderPath = path.join(this.baseDir, folder);
                try {
                    const stats = fs.statSync(folderPath);

                    if (stats.isDirectory() && (now - stats.mtime.getTime()) > maxAge) {
                        // Check if folder has images subdirectory
                        const imagesPath = path.join(folderPath, 'images');
                        if (fs.existsSync(imagesPath)) {
                            logger.info(`🧹 Cleaning up old folder: ${folder}`);
                            fs.rmSync(folderPath, { recursive: true, force: true });
                        }
                    }
                } catch (e) {
                    // Ignore access errors
                }
            }
        } catch (error) {
            logger.error('❌ Cleanup failed:', error.message);
        }
    }
}

module.exports = SharedPdfProcessor;
