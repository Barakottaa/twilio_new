const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

// Configuration
const CONFIG = {
  baseDir: "D:\\Results",
  port: process.env.PORT || 3002 // Default to 3002, can be overridden by PM2 env
};

app.post("/pdf-to-image", async (req, res) => {
  try {
    const { patient_number, message } = req.body;
    
    console.log(`🔄 Processing request for phone: ${patient_number}`);
    console.log(`📝 Message: ${message}`);

    const phone = patient_number.replace("+", "");
    console.log(`🔄 Processing PDF to image conversion for phone: ${phone}`);

    // Find folder by phone prefix (with or without +)
    const folders = fs.readdirSync(CONFIG.baseDir);
    console.log(`📁 Available folders: ${folders.slice(0, 5).join(', ')}...`);
    
    const folder = folders.find(f => f.startsWith(phone) || f.startsWith(`+${phone}`));
    
    if (!folder) {
      console.log(`❌ Folder not found for phone: ${phone}`);
      return res.status(404).json({ error: "Patient folder not found" });
    }

    console.log(`📁 Found folder: ${folder}`);

    // Find any PDF file in the folder
    const folderPath = path.join(CONFIG.baseDir, folder);
    const pdfFiles = fs.readdirSync(folderPath).filter(f => f.toLowerCase().endsWith('.pdf'));
    
    if (pdfFiles.length === 0) {
      console.log(`❌ No PDF files found in folder: ${folderPath}`);
      return res.status(404).json({ error: "PDF file not found" });
    }
    
    const pdfPath = path.join(folderPath, pdfFiles[0]);
    console.log(`📄 Found PDF: ${pdfFiles[0]}`);

    // Now convert PDF to images
    console.log(`🔄 Converting PDF to images...`);
    
    try {
      const convert = require("pdf-poppler");
      
      // Create images directory
      const outputDir = path.join(folderPath, "images");
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`📁 Created images directory: ${outputDir}`);
      }

      // Convert PDF to images
      await convert.convert(pdfPath, {
        out_dir: outputDir,
        out_prefix: "page",
        format: "jpeg"
      });

      console.log(`✅ PDF converted to images in: ${outputDir}`);

      // Get all generated images
      const images = fs.readdirSync(outputDir)
        .filter(f => f.endsWith(".jpg"))
        .map(f => path.basename(f)); // Changed to basename for webhook

      console.log(`📸 Generated ${images.length} images`);

      res.json({ 
        success: true, 
        message: `PDF converted to ${images.length} images`,
        images: images,
        folder: folder,
        pdfFile: pdfFiles[0]
      });

    } catch (conversionError) {
      console.error(`❌ PDF conversion error:`, conversionError);
      res.status(500).json({ 
        error: `PDF conversion failed: ${conversionError.message}`,
        folder: folder,
        pdfFile: pdfFiles[0]
      });
    }

  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "pdf-to-image-service" });
});

app.listen(CONFIG.port, () => {
  console.log(`🚀 PDF-to-Image service running on port ${CONFIG.port}`);
  console.log(`📁 Base directory: ${CONFIG.baseDir}`);
});