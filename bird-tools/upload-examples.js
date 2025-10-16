// Upload Examples for Different Hosting Solutions
// Use these examples to implement the uploadToStaticDomain function

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Example 1: Upload to AWS S3 with custom domain
async function uploadToS3WithCustomDomain(filePath, domain) {
  const fileName = path.basename(filePath);
  const fileBuffer = fs.readFileSync(filePath);
  
  // Configure your S3 credentials
  const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
  const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
  const S3_BUCKET = process.env.S3_BUCKET;
  const S3_REGION = process.env.S3_REGION || 'us-east-1';
  
  // Upload to S3
  const s3Url = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/pdfs/${fileName}`;
  
  // You would use AWS SDK here, but for simplicity:
  console.log(`📤 Uploading to S3: ${s3Url}`);
  
  // Return the custom domain URL
  return {
    url: `${domain}/pdfs/${fileName}`,
    filename: fileName
  };
}

// Example 2: Upload to your web server via FTP/SFTP
async function uploadToWebServer(filePath, domain) {
  const fileName = path.basename(filePath);
  
  // Configure your server credentials
  const SERVER_HOST = process.env.SERVER_HOST;
  const SERVER_USER = process.env.SERVER_USER;
  const SERVER_PASS = process.env.SERVER_PASS;
  const SERVER_PATH = process.env.SERVER_PATH || '/public_html/pdfs/';
  
  console.log(`📤 Uploading to web server: ${SERVER_HOST}`);
  
  // You would use FTP/SFTP library here (like 'ssh2-sftp-client')
  // For now, simulate the upload
  
  return {
    url: `${domain}/pdfs/${fileName}`,
    filename: fileName
  };
}

// Example 3: Upload to Netlify/Vercel via API
async function uploadToNetlify(filePath, domain) {
  const fileName = path.basename(filePath);
  const fileBuffer = fs.readFileSync(filePath);
  
  // Configure Netlify credentials
  const NETLIFY_SITE_ID = process.env.NETLIFY_SITE_ID;
  const NETLIFY_ACCESS_TOKEN = process.env.NETLIFY_ACCESS_TOKEN;
  
  const formData = new FormData();
  formData.append('file', fileBuffer, {
    filename: fileName,
    contentType: 'application/pdf'
  });
  
  try {
    const response = await axios.post(
      `https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}/deploys`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${NETLIFY_ACCESS_TOKEN}`
        }
      }
    );
    
    return {
      url: `${domain}/pdfs/${fileName}`,
      filename: fileName
    };
  } catch (error) {
    throw new Error(`Netlify upload failed: ${error.message}`);
  }
}

// Example 4: Upload to GitHub Pages (via GitHub API)
async function uploadToGitHubPages(filePath, domain) {
  const fileName = path.basename(filePath);
  const fileBuffer = fs.readFileSync(filePath);
  
  // Configure GitHub credentials
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_REPO = process.env.GITHUB_REPO; // e.g., "username/repo"
  const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
  
  const content = fileBuffer.toString('base64');
  
  try {
    const response = await axios.put(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/pdfs/${fileName}`,
      {
        message: `Add PDF: ${fileName}`,
        content: content,
        branch: GITHUB_BRANCH
      },
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      url: `${domain}/pdfs/${fileName}`,
      filename: fileName
    };
  } catch (error) {
    throw new Error(`GitHub upload failed: ${error.message}`);
  }
}

// Example 5: Simple HTTP upload to your server
async function uploadViaHTTP(filePath, domain) {
  const fileName = path.basename(filePath);
  const fileBuffer = fs.readFileSync(filePath);
  
  // Configure your upload endpoint
  const UPLOAD_ENDPOINT = process.env.UPLOAD_ENDPOINT; // e.g., "https://yourdomain.com/upload"
  const UPLOAD_TOKEN = process.env.UPLOAD_TOKEN;
  
  const formData = new FormData();
  formData.append('file', fileBuffer, {
    filename: fileName,
    contentType: 'application/pdf'
  });
  formData.append('path', 'pdfs/');
  
  try {
    const response = await axios.post(UPLOAD_ENDPOINT, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${UPLOAD_TOKEN}`
      }
    });
    
    return {
      url: `${domain}/pdfs/${fileName}`,
      filename: fileName
    };
  } catch (error) {
    throw new Error(`HTTP upload failed: ${error.message}`);
  }
}

// Example 6: Use existing Bird media upload (if you have access)
async function uploadToBirdMedia(filePath, domain) {
  const fileName = path.basename(filePath);
  const fileBuffer = fs.readFileSync(filePath);
  
  const BIRD_API_KEY = process.env.BIRD_API_KEY;
  const BIRD_WORKSPACE_ID = process.env.BIRD_WORKSPACE_ID;
  const BIRD_CHANNEL_ID = process.env.BIRD_CHANNEL_ID;
  
  // Step 1: Get presigned upload URL
  const presignUrl = `https://api.bird.com/workspaces/${BIRD_WORKSPACE_ID}/channels/${BIRD_CHANNEL_ID}/presigned-upload`;
  const presignBody = { contentType: 'application/pdf' };
  
  try {
    const presignResponse = await axios.post(presignUrl, presignBody, {
      headers: {
        'Authorization': `AccessKey ${BIRD_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const { mediaUrl, uploadUrl, uploadFormData } = presignResponse.data;
    
    // Step 2: Upload to S3
    const formData = new FormData();
    Object.entries(uploadFormData).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append('file', fileBuffer, {
      filename: fileName,
      contentType: 'application/pdf'
    });
    
    await axios.post(uploadUrl, formData, {
      headers: formData.getHeaders()
    });
    
    // Return the media URL (this is Bird's hosted URL)
    return {
      url: mediaUrl,
      filename: fileName
    };
  } catch (error) {
    throw new Error(`Bird media upload failed: ${error.message}`);
  }
}

module.exports = {
  uploadToS3WithCustomDomain,
  uploadToWebServer,
  uploadToNetlify,
  uploadToGitHubPages,
  uploadViaHTTP,
  uploadToBirdMedia
};
