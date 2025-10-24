const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3004;

// Enable CORS for all routes
app.use(cors());

// Serve the specific PDF file
app.get('/pdf', (req, res) => {
  const pdfPath = 'D:\\Results\\+201000209206_393552\\BL-20251022.pdf';
  
  // Check if file exists
  const fs = require('fs');
  if (!fs.existsSync(pdfPath)) {
    return res.status(404).json({ 
      error: 'PDF file not found',
      path: pdfPath 
    });
  }
  
  // Set appropriate headers for PDF
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="BL-20251022.pdf"');
  
  // Send the file
  res.sendFile(pdfPath);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'pdf-server',
    pdf: 'BL-20251022.pdf'
  });
});

// Root endpoint with instructions
app.get('/', (req, res) => {
  res.json({
    message: 'PDF Server is running',
    endpoints: {
      pdf: '/pdf',
      health: '/health'
    },
    instructions: 'Access your PDF at: /pdf'
  });
});

app.listen(PORT, () => {
  console.log(`📄 PDF server running on port ${PORT}`);
  console.log(`📁 Serving PDF: BL-20251022.pdf`);
  console.log(`🌐 Access PDF via: http://localhost:${PORT}/pdf`);
});
