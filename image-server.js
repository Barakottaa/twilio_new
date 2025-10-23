const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3003;

// Enable CORS for all routes
app.use(cors());

// Serve static files from the Results directory
app.use('/images', express.static('D:\\Results'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'image-server' });
});

app.listen(PORT, () => {
  console.log(`🖼️ Image server running on port ${PORT}`);
  console.log(`📁 Serving images from: D:\\Results`);
  console.log(`🌐 Access images via: http://localhost:${PORT}/images/...`);
});
