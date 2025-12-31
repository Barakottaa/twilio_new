#!/usr/bin/env node

/**
 * Process Lab Reports - Node.js replacement for Oracle Forms procedure
 * 
 * This script follows the exact same logic as the Oracle Forms procedure:
 * 1. Query reg_with_balance view for eligible registrations
 * 2. For each reg_key, get ALL group codes and mega codes
 * 3. Generate reports for each group/mega code
 * 4. Send WhatsApp with patient phone
 * 5. Update database to mark as processed
 */

const oracledb = require('oracledb');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Import configuration
const CONFIG = require('./config');

// Database connection pool
let pool;

// Process lock file to prevent multiple instances
const LOCK_FILE = path.join(CONFIG.paths.resultsFolder, '.process_lock');

// Processing state flag to prevent overlapping batches
let isProcessing = false;

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  
  // Console output
  console.log(logMessage);
  
  // File output
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Ensure log directory exists
    const logDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    // Create log file with current date (local time)
    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local timezone
    const logFile = path.join(logDir, `lab-reports_${today}.log`);
    
    // Append to log file
    fs.appendFileSync(logFile, logMessage + '\n');
  } catch (error) {
    // Don't fail if logging fails
    console.error('Log file write error:', error.message);
  }
}

/**
 * Kill stuck processes and clean up lock files
 */
function killStuckProcesses() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const lockContent = fs.readFileSync(LOCK_FILE, 'utf8');
      const lockData = JSON.parse(lockContent);
      const lockTime = new Date(lockData.timestamp);
      const now = new Date();
      
      // If lock is older than 5 minutes, kill the process and remove lock
      if (now - lockTime > 5 * 60 * 1000) {
        log(`Detected stuck process (PID: ${lockData.pid}, running for ${Math.round((now - lockTime) / 1000)}s)`, 'WARN');
        
        try {
          // Try to kill the process
          const { exec } = require('child_process');
          exec(`taskkill /PID ${lockData.pid} /F`, (error, stdout, stderr) => {
            if (error) {
              log(`Failed to kill process ${lockData.pid}: ${error.message}`, 'WARN');
            } else {
              log(`Successfully killed stuck process ${lockData.pid}`, 'INFO');
            }
          });
        } catch (killError) {
          log(`Error killing process: ${killError.message}`, 'WARN');
        }
        
        // Remove the lock file
        fs.unlinkSync(LOCK_FILE);
        log(`Removed stale lock file`, 'INFO');
        return true;
      } else {
        log(`Another instance is running (PID: ${lockData.pid}, started: ${lockData.timestamp})`, 'WARN');
        return false;
      }
    }
    return true;
  } catch (error) {
    log(`Error checking for stuck processes: ${error.message}`, 'WARN');
    // If we can't read the lock file, remove it
    try {
      if (fs.existsSync(LOCK_FILE)) {
        fs.unlinkSync(LOCK_FILE);
        log(`Removed corrupted lock file`, 'INFO');
      }
    } catch (removeError) {
      log(`Failed to remove corrupted lock file: ${removeError.message}`, 'WARN');
    }
    return true;
  }
}

/**
 * Process lock management to prevent multiple instances
 */
function acquireLock() {
  try {
    // First, check for and kill any stuck processes
    if (!killStuckProcesses()) {
      return false;
    }
    
    // Create lock file
    const lockData = {
      pid: process.pid,
      timestamp: new Date().toISOString(),
      hostname: require('os').hostname()
    };
    
    fs.writeFileSync(LOCK_FILE, JSON.stringify(lockData, null, 2));
    log(`Process lock acquired (PID: ${process.pid})`);
    return true;
    
  } catch (error) {
    log(`Failed to acquire process lock: ${error.message}`, 'ERROR');
    return false;
  }
}

function releaseLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
      log(`Process lock released (PID: ${process.pid})`);
    }
  } catch (error) {
    log(`Failed to release process lock: ${error.message}`, 'ERROR');
  }
}

// Initialize database connection
async function initializeDatabase() {
  try {
    // Set Oracle Instant Client environment
    process.env.ORACLE_HOME = 'D:\\instantclient_11_2';
    process.env.TNS_ADMIN = 'D:\\instantclient_11_2\\network\\admin';
    process.env.PATH = process.env.PATH + ';D:\\instantclient_11_2';
    
    // Initialize Oracle client
    try {
      oracledb.initOracleClient({ libDir: 'D:\\instantclient_11_2' });
      log('Oracle Instant Client initialized in Thick mode');
    } catch (error) {
      if (error.message.includes('ORA-24315')) {
        log('Oracle client already initialized');
      } else {
        log(`Oracle client initialization warning: ${error.message}`, 'WARN');
      }
    }
    
    oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
    oracledb.autoCommit = true;
    
    pool = await oracledb.createPool({
      user: CONFIG.database.user,
      password: CONFIG.database.password,
      connectString: CONFIG.database.connectString,
      poolMin: 1,
      poolMax: 5,
      poolIncrement: 1
    });
    log('Database connection pool created successfully');
  } catch (error) {
    log(`Database initialization failed: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Clean up old PDFs (equivalent to HOST command in Oracle Forms)
function cleanupOldPDFs() {
  try {
    const files = fs.readdirSync(CONFIG.paths.resultsFolder)
      .filter(file => file.endsWith('.pdf'));
    
    files.forEach(file => {
      const filePath = path.join(CONFIG.paths.resultsFolder, file);
      fs.unlinkSync(filePath);
    });
    
    log(`Cleaned up ${files.length} old PDF files from D:\\Results`);
  } catch (error) {
    log(`Cleanup failed: ${error.message}`, 'WARN');
  }
}


// Get group codes for a reg_key (equivalent to c_grp cursor)
async function getGroupCodes(regKey) {
  const connection = await pool.getConnection();
  try {
    const query = `
      SELECT DISTINCT group_code
      FROM LDM.reg_with_balance
      WHERE reg_key = :regKey
      AND test_type IN (1,2)
      ORDER BY group_code
    `;
    
    const result = await connection.execute(query, [regKey]);
    return result.rows.map(row => row.GROUP_CODE);
  } finally {
    await connection.close();
  }
}

// Get mega codes for a reg_key (equivalent to c_mega cursor)
async function getMegaCodes(regKey) {
  const connection = await pool.getConnection();
  try {
    const query = `
      SELECT DISTINCT test_code
      FROM LDM.reg_with_balance
      WHERE reg_key = :regKey
      AND test_type = 3
      ORDER BY test_code
    `;
    
    const result = await connection.execute(query, [regKey]);
    return result.rows.map(row => row.TEST_CODE);
  } finally {
    await connection.close();
  }
}

// Get mega report type (equivalent to SELECT from mega_profiles)
async function getMegaReportType(megaCode) {
  const connection = await pool.getConnection();
  try {
    const query = `
      SELECT rep_type
      FROM mega_profiles
      WHERE mega_code = :megaCode
    `;
    
    const result = await connection.execute(query, [megaCode]);
    return result.rows.length > 0 ? result.rows[0].REP_TYPE : null;
  } finally {
    await connection.close();
  }
}

// Get patient phone (equivalent to SELECT from reg table)
async function getPatientPhone(regKey) {
  const connection = await pool.getConnection();
  try {
    const query = `
      SELECT patient_no
      FROM reg
      WHERE reg_key = :regKey
    `;
    
    const result = await connection.execute(query, [regKey]);
    return result.rows.length > 0 ? result.rows[0].PATIENT_NO : null;
  } finally {
    await connection.close();
  }
}

// Generate PDF report using Oracle Reports (equivalent to RUN_PRODUCT)
async function generateReport(reportPath, parameters) {
  return new Promise((resolve, reject) => {
    // Build the exact command string - always generate in main folder
    let cmd = `C:\\orant\\BIN\\RWRUN60.EXE report="${reportPath}" userid=${CONFIG.database.user}/${CONFIG.database.password}@${CONFIG.database.connectString} destype=PRINTER desname=PDF paramform=NO BATCH=YES`;
    
    // Add parameters
    Object.entries(parameters).forEach(([key, value]) => {
      cmd += ` ${key}=${value}`;
    });
    
    log(`Generating report: ${reportPath} with parameters: ${JSON.stringify(parameters)}`);
    
    // Set Oracle environment variables for rwrun60
    const env = {
      ...process.env,
      ORACLE_HOME: "C:\\orant",
      TNS_ADMIN: "C:\\orant\\NETWORK\\ADMIN",
      PATH: "C:\\orant\\BIN;" + process.env.PATH
    };
    
    exec(cmd, { 
      shell: 'cmd.exe',
      env: env,
      timeout: 60000,
      windowsHide: true
    }, (error, stdout, stderr) => {
      if (error) {
        if (error.code === 3) {
          // Oracle Reports often returns exit code 3 even on success
          log(`Report generation completed (exit code 3 is normal for Oracle Reports)`);
          resolve('Report generated');
        } else {
          log(`Report generation failed: ${error.message}`, 'ERROR');
          reject(new Error(`Report generation failed: ${error.message}`));
        }
      } else {
        log(`Report generated successfully`);
        resolve(stdout);
      }
    });
  });
}

// Wait for PDFs to be generated
async function waitForPDFs(expectedCount = 1, timeoutSeconds = 60, startTime = Date.now()) {
  log(`Waiting for ${expectedCount} PDF(s) to be generated...`);
  
  let elapsed = 0;
  let lastSize = 0;
  let stableCount = 0;
  
  while (elapsed < timeoutSeconds) {
    try {
      const files = fs.readdirSync(CONFIG.paths.resultsFolder)
        .filter(file => {
          if (!file.endsWith('.pdf')) return false;
          const filePath = path.join(CONFIG.paths.resultsFolder, file);
          const stats = fs.statSync(filePath);
          // Only count PDFs created after our start time (within last 5 minutes to be safe)
          return stats.mtime.getTime() > (startTime - 300000);
        });
      
      const currentCount = files.length;
      const currentSize = files.reduce((total, file) => {
        const filePath = path.join(CONFIG.paths.resultsFolder, file);
        return total + fs.statSync(filePath).size;
      }, 0);
      
      log(`PDF check: count=${currentCount}, size=${currentSize}, elapsed=${elapsed}s`);
      
      if (currentCount >= expectedCount && currentSize === lastSize && currentSize > 0) {
        stableCount++;
        if (stableCount >= 1) { // Only need 1 stable check since files are small
          log(`PDFs ready: ${currentCount} files, ${currentSize} bytes total`);
          return files;
        }
      } else {
        stableCount = 0;
      }
      
      lastSize = currentSize;
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Check every 1 second
      elapsed += 1;
      
    } catch (error) {
      log(`Error checking PDFs: ${error.message}`, 'WARN');
      await new Promise(resolve => setTimeout(resolve, 2000));
      elapsed += 2;
    }
  }
  
  log(`Timeout waiting for PDFs after ${timeoutSeconds} seconds`, 'WARN');
  return [];
}

// Merge PDFs using Ghostscript
async function mergePDFs(sourceDir = CONFIG.paths.resultsFolder) {
  return new Promise((resolve, reject) => {
    const files = fs.readdirSync(sourceDir)
      .filter(file => file.endsWith('.pdf'))
      .map(file => path.join(sourceDir, file));
    
    if (files.length === 0) {
      reject(new Error('No PDF files found to merge'));
      return;
    }
    
    if (files.length === 1) {
      // Only one file, just rename it
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const mergedName = `BL-${timestamp}.pdf`;
      const mergedPath = path.join(sourceDir, mergedName);
      
      fs.copyFileSync(files[0], mergedPath);
      fs.unlinkSync(files[0]);
      log(`Single PDF renamed to: ${mergedName}`);
      resolve(mergedPath);
      return;
    }
    
    // Multiple files, merge with Ghostscript
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const mergedName = `BL-${timestamp}.pdf`;
    const mergedPath = path.join(sourceDir, mergedName);
    
    const gsPath = 'C:\\Program Files\\gs\\gs10.06.0\\bin\\gswin64.exe';
    const args = [
      '-dBATCH', '-dNOPAUSE', '-q',
      '-sDEVICE=pdfwrite',
      `-sOutputFile="${mergedPath}"`
    ].concat(files.map(file => `"${file}"`));
    
    const cmd = `"${gsPath}" ${args.join(' ')}`;
    
    log(`Merging ${files.length} PDFs into: ${mergedName}`);
    
    exec(cmd, { 
      shell: 'cmd.exe',
      windowsHide: true
    }, (error, stdout, stderr) => {
      if (error) {
        log(`PDF merge failed: ${error.message}`, 'ERROR');
        reject(new Error(`PDF merge failed: ${error.message}`));
      } else {
        log(`PDFs merged successfully: ${mergedName}`);
        
        // Clean up original files after successful merge
        files.forEach(file => {
          if (file !== mergedPath) {
            fs.unlinkSync(file);
          }
        });
        
        log(`Cleaned up ${files.length - 1} original PDF files, kept merged file: ${mergedName}`);
        resolve(mergedPath);
      }
    });
  });
}

// Send WhatsApp template (equivalent to HOST command calling send_whatsapp.bat)
async function sendWhatsAppTemplate(phone, pdfPath) {
  try {
    log(`Sending WhatsApp template to ${phone} with PDF: ${pdfPath}`);
    
    // Step 1: Get presigned upload URL from Bird
    log('Getting presigned upload URL from Bird...');
    const presignResponse = await axios.post(
      `https://api.bird.com/workspaces/${CONFIG.bird.workspaceId}/channels/${CONFIG.bird.channelId}/presigned-upload`,
      {
        contentType: 'application/pdf'
      },
      {
        headers: {
          'Authorization': `AccessKey ${CONFIG.bird.accessKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const { uploadUrl, mediaUrl, uploadFormData } = presignResponse.data;
    
    // Step 2: Upload PDF to S3
    log('Uploading PDF to Bird S3...');
    const FormData = require('form-data');
    const formData = new FormData();
    
    // Add form fields
    Object.entries(uploadFormData).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    // Add file
    const fileStream = fs.createReadStream(pdfPath);
    formData.append('file', fileStream, {
      filename: path.basename(pdfPath),
      contentType: 'application/pdf'
    });
    
    await axios.post(uploadUrl, formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 60000
    });
    
    log('PDF uploaded to Bird successfully');
    
    // Step 3: Send WhatsApp template
    log('Sending WhatsApp template...');
    const templateData = {
      receiver: {
        contacts: [{
          identifierKey: 'phonenumber',
          identifierValue: phone
        }]
      },
      template: {
        projectId: CONFIG.bird.templateProjectId,
        version: CONFIG.bird.templateVersion,
        locale: 'ar',
        parameters: [{
          type: 'string',
          key: 'url',
          value: mediaUrl
        }]
      }
    };
    
    const response = await axios.post(
      `https://api.bird.com/workspaces/${CONFIG.bird.workspaceId}/channels/${CONFIG.bird.channelId}/messages`,
      templateData,
      {
        headers: {
          'Authorization': `AccessKey ${CONFIG.bird.accessKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    log(`WhatsApp template sent successfully to ${phone}. Message ID: ${response.data.id}`);
    return response.data;
    
  } catch (error) {
    log(`Error sending WhatsApp template: ${error.message}`, 'ERROR');
    if (error.response) {
      log(`Error response status: ${error.response.status}`, 'ERROR');
      log(`Error response data: ${JSON.stringify(error.response.data, null, 2)}`, 'ERROR');
    }
    throw error;
  }
}

// Format phone number (equivalent to phone formatting logic in Oracle Forms)
function formatPhoneNumber(patientNo) {
  if (!patientNo) return null;
  
  if (patientNo.startsWith('0')) {
    return '+20' + patientNo.substring(1);
  } else if (patientNo.startsWith('+')) {
    return patientNo;
  } else {
    return '+20' + patientNo;
  }
}

// Update registration status (equivalent to UPDATE reg SET worklist_printed = 1)
async function updateRegistrationStatus(regKey) {
  log(`Starting database update for reg_key: ${regKey}`);
  
  // Use a direct connection instead of pool to avoid pool issues
  let connection;
  try {
    log(`Creating direct database connection for reg_key: ${regKey}`);
    connection = await oracledb.getConnection({
      user: CONFIG.database.user,
      password: CONFIG.database.password,
      connectString: CONFIG.database.connectString
    });
    
    log(`Direct connection acquired for reg_key: ${regKey}`);
    
    // Set auto-commit to true to avoid transaction issues
    connection.autoCommit = true;
    
    const query = `
      UPDATE reg
      SET worklist_printed = 1
      WHERE reg_key = :regKey
    `;
    
    log(`Executing update query for reg_key: ${regKey}`);
    const result = await connection.execute(query, [regKey]);
    log(`Update query executed, rows affected: ${result.rowsAffected}`);
    
    // No need to commit since autoCommit is true
    log(`Marked registration ${regKey} as processed`);
    
  } catch (error) {
    log(`Database update failed for reg_key ${regKey}: ${error.message}`, 'ERROR');
    log(`Error details: ${JSON.stringify(error, null, 2)}`, 'ERROR');
    throw error;
  } finally {
    if (connection) {
      try {
        log(`Closing direct database connection for reg_key: ${regKey}`);
        await connection.close();
        log(`Database connection closed successfully for reg_key: ${regKey}`);
      } catch (closeError) {
        log(`Error closing database connection: ${closeError.message}`, 'WARN');
      }
    }
  }
}

// Process a single registration (equivalent to the main loop in Oracle Forms)
async function processRegistration(regKey) {
  try {
    log(`Processing registration: ${regKey}`);
    
    // 0. Clean main folder before generating reports for this REG_KEY
    cleanupOldPDFs();
    
    // 1. Generate group reports (test_type 1/2) - equivalent to c_grp loop
    const groupCodes = await getGroupCodes(regKey);
    log(`Found ${groupCodes.length} group codes: ${groupCodes.join(', ')}`);
    
    for (const groupCode of groupCodes) {
      await generateReport(
        path.join(CONFIG.paths.reportsPath, 'new_test.rep'),
        {
          MY_REG_KEY: regKey,
          MY_GROUP_CODE: groupCode,
          PRINTED_BY: 'Baraka'
        }
      );
    }
    
    // 2. Generate mega reports (test_type 3) - equivalent to c_mega loop
    const megaCodes = await getMegaCodes(regKey);
    log(`Found ${megaCodes.length} mega codes: ${megaCodes.join(', ')}`);
    
    for (const megaCode of megaCodes) {
      const repType = await getMegaReportType(megaCode);
      if (repType) {
        await generateReport(
          path.join(CONFIG.paths.reportsPath, `${repType}.rep`),
          {
            MY_REG_KEY: regKey,
            MEGA_CODE: megaCode,
            PRINTED_BY: 'Baraka'
          }
        );
      } else {
        log(`No report type found for mega code: ${megaCode}`, 'WARN');
      }
    }
    
    // 3. Wait for all PDFs to be generated in main folder
    const expectedCount = groupCodes.length + megaCodes.length;
    log(`Expected ${expectedCount} PDF files (${groupCodes.length} group + ${megaCodes.length} mega)`);
    
    // Add a small delay to ensure Oracle Reports has finished writing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const generatedFiles = await waitForPDFs(expectedCount, 30, Date.now()); // Reduced timeout to 30 seconds
    
    if (generatedFiles.length === 0) {
      log(`No PDFs found, checking main folder contents...`, 'WARN');
      const allFiles = fs.readdirSync(CONFIG.paths.resultsFolder);
      log(`Main folder contains: ${allFiles.join(', ')}`, 'WARN');
      throw new Error('No PDFs were generated');
    }
    
    log(`Found ${generatedFiles.length} PDF files: ${generatedFiles.join(', ')}`);
    
    // 4. Get patient phone and create patient folder
    const patientPhone = await getPatientPhone(regKey);
    if (patientPhone) {
      const phoneE164 = formatPhoneNumber(patientPhone);
      log(`Patient phone: ${patientPhone} -> ${phoneE164}`);
      
      if (phoneE164) {
        // Create patient-specific folder with reg_key
        const patientFolder = path.join(CONFIG.paths.resultsFolder, `${phoneE164}_${regKey}`);
        if (!fs.existsSync(patientFolder)) {
          fs.mkdirSync(patientFolder, { recursive: true });
          log(`Created patient folder: ${patientFolder}`);
        }
        
        // Move all generated PDFs to patient folder for merging
        const patientPdfFiles = [];
        generatedFiles.forEach(file => {
          const sourcePath = path.join(CONFIG.paths.resultsFolder, file);
          const destPath = path.join(patientFolder, file);
          fs.copyFileSync(sourcePath, destPath);
          patientPdfFiles.push(destPath);
        });
        log(`Moved ${generatedFiles.length} PDF files to patient folder`);
        
        // Merge PDFs in patient folder
        const mergedPath = await mergePDFs(patientFolder);
        log(`PDFs merged successfully: ${mergedPath}`);
        
        // Delete original PDFs from main folder
        generatedFiles.forEach(file => {
          fs.unlinkSync(path.join(CONFIG.paths.resultsFolder, file));
        });
        log(`Deleted ${generatedFiles.length} original PDF files from main folder`);
        
        try {
          await sendWhatsAppTemplate(phoneE164, mergedPath);
        } catch (error) {
          log(`WhatsApp sending failed: ${error.message}`, 'WARN');
          // Continue processing even if WhatsApp fails
        }
      } else {
        log(`Invalid phone number format: ${patientPhone}`, 'WARN');
      }
    } else {
      log(`No patient phone found for reg_key: ${regKey}, skipping WhatsApp`, 'WARN');
    }
    
    // 5. Update database to mark as processed
    log(`About to update database for reg_key: ${regKey}`);
    
    // Test database connection first
    try {
      log(`Testing database connection before update...`);
      const testConnection = await oracledb.getConnection({
        user: CONFIG.database.user,
        password: CONFIG.database.password,
        connectString: CONFIG.database.connectString
      });
      await testConnection.close();
      log(`Database connection test successful`);
    } catch (testError) {
      log(`Database connection test failed: ${testError.message}`, 'ERROR');
      throw testError;
    }
    
    await Promise.race([
      updateRegistrationStatus(regKey),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database update timeout after 30 seconds')), 30000)
      )
    ]);
    
    log(`Registration ${regKey} processed successfully`);
    
  } catch (error) {
    log(`Failed to process registration ${regKey}: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Process a single batch of registrations
async function processBatch() {
  // Check if already processing
  if (isProcessing) {
    log('Batch processing already in progress, skipping this cycle', 'WARN');
    return 0;
  }
  
  try {
    isProcessing = true;
    log('Starting batch processing...');
    
    // Get all unprocessed registrations from all branches (worklist_printed = 2)
    const connection = await oracledb.getConnection();
    try {
      const registrationsQuery = `
        SELECT DISTINCT reg_key 
        FROM LDM.reg_with_balance 
        WHERE worklist_printed = 2
        ORDER BY reg_key
      `;
      
      const result = await connection.execute(registrationsQuery);
      const registrations = result.rows.map(row => row.REG_KEY);
      
      log(`Found ${registrations.length} unprocessed registrations: ${registrations.join(', ')}`);
      
      if (registrations.length === 0) {
        log('No unprocessed registrations found in this batch');
        return 0;
      }
      
      // Process each registration
      let processedCount = 0;
      for (const regKey of registrations) {
        log(`\n=== Processing Registration: ${regKey} ===`);
        try {
          await processRegistration(regKey);
          log(`=== Completed Registration: ${regKey} ===\n`);
          processedCount++;
        } catch (error) {
          log(`Error processing registration ${regKey}: ${error.message}`, 'ERROR');
          // Continue with next registration even if one fails
        }
      }
      
      log(`Batch processing completed. Processed ${processedCount} registrations.`);
      return processedCount;
      
    } finally {
      await connection.close();
    }
    
  } catch (error) {
    log(`Batch processing error: ${error.message}`, 'ERROR');
    throw error;
  } finally {
    isProcessing = false;
  }
}

// Main function - runs continuously with 2-minute intervals
async function main() {
  try {
    log('Starting lab reports processor (continuous mode)...');
    
    // Check for process lock to prevent multiple instances
    if (!acquireLock()) {
      log('Another instance is already running. Exiting.', 'WARN');
      process.exit(0);
    }
    
    // Initialize database
    await initializeDatabase();
    
    // Main processing loop
    while (true) {
      try {
        const processedCount = await processBatch();
        
        if (processedCount === 0) {
          log('No records to process. Waiting 2 minutes before next check...');
        } else {
          log('Waiting 2 minutes before next batch...');
        }
        
        // Wait 2 minutes (120 seconds) before next batch
        await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000));
        
      } catch (error) {
        log(`Error in processing loop: ${error.message}`, 'ERROR');
        log('Waiting 2 minutes before retry...');
        await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000));
      }
    }
    
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'ERROR');
    process.exit(1);
  } finally {
    // Always release the process lock
    releaseLock();
    
    if (pool) {
      await pool.close();
      log('Database connection pool closed');
    }
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    log(`Unhandled error: ${error.message}`, 'ERROR');
    process.exit(1);
  });
}

module.exports = {
  processRegistration,
  generateReport,
  mergePDFs,
  initializeDatabase
};