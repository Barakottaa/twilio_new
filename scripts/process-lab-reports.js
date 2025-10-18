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

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`);
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

// Get eligible registrations (equivalent to c_reg cursor)
async function getEligibleRegistrations() {
  const connection = await pool.getConnection();
  try {
    const query = `
      SELECT DISTINCT reg_key
      FROM LDM.reg_with_balance
      WHERE branch_code = :branchCode
      AND worklist_printed = :worklistPrinted
      ORDER BY reg_key
    `;
    
    const result = await connection.execute(query, [CONFIG.processing.branchCode, 2]);
    return result.rows.map(row => row.REG_KEY);
  } finally {
    await connection.close();
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
    // Build the exact command string
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
      timeout: 60000
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
async function waitForPDFs(expectedCount = 1, timeoutSeconds = 60) {
  log(`Waiting for ${expectedCount} PDF(s) to be generated...`);
  
  let elapsed = 0;
  let lastSize = 0;
  let stableCount = 0;
  
  while (elapsed < timeoutSeconds) {
    try {
      const files = fs.readdirSync(CONFIG.paths.resultsFolder)
        .filter(file => file.endsWith('.pdf'));
      
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
async function mergePDFs() {
  return new Promise((resolve, reject) => {
    const files = fs.readdirSync(CONFIG.paths.resultsFolder)
      .filter(file => file.endsWith('.pdf'))
      .map(file => path.join(CONFIG.paths.resultsFolder, file));
    
    if (files.length === 0) {
      reject(new Error('No PDF files found to merge'));
      return;
    }
    
    if (files.length === 1) {
      // Only one file, just rename it
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const mergedName = `BL-${timestamp}.pdf`;
      const mergedPath = path.join(CONFIG.paths.resultsFolder, mergedName);
      
      fs.copyFileSync(files[0], mergedPath);
      fs.unlinkSync(files[0]);
      log(`Single PDF renamed to: ${mergedName}`);
      resolve(mergedPath);
      return;
    }
    
    // Multiple files, merge with Ghostscript
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const mergedName = `BL-${timestamp}.pdf`;
    const mergedPath = path.join(CONFIG.paths.resultsFolder, mergedName);
    
    const gsPath = 'C:\\Program Files\\gs\\gs10.06.0\\bin\\gswin64.exe';
    const args = [
      '-dBATCH', '-dNOPAUSE', '-q',
      '-sDEVICE=pdfwrite',
      `-sOutputFile="${mergedPath}"`
    ].concat(files.map(file => `"${file}"`));
    
    const cmd = `"${gsPath}" ${args.join(' ')}`;
    
    log(`Merging ${files.length} PDFs into: ${mergedName}`);
    
    exec(cmd, { 
      shell: 'cmd.exe'
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
  const connection = await pool.getConnection();
  try {
    const query = `
      UPDATE reg
      SET worklist_printed = 1
      WHERE reg_key = :regKey
    `;
    
    await connection.execute(query, [regKey]);
    await connection.commit();
    log(`Marked registration ${regKey} as processed`);
  } finally {
    await connection.close();
  }
}

// Process a single registration (equivalent to the main loop in Oracle Forms)
async function processRegistration(regKey) {
  try {
    log(`Processing registration: ${regKey}`);
    
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
    
    // 3. Wait for all PDFs to be generated
    const expectedCount = groupCodes.length + megaCodes.length;
    log(`Expected ${expectedCount} PDF files (${groupCodes.length} group + ${megaCodes.length} mega)`);
    
    const generatedFiles = await waitForPDFs(expectedCount, 120);
    
    if (generatedFiles.length === 0) {
      throw new Error('No PDFs were generated');
    }
    
    // 4. Merge PDFs
    const mergedPath = await mergePDFs();
    log(`PDFs merged successfully: ${mergedPath}`);
    
    // 5. Send WhatsApp to test phone number
    const testPhone = '+201016666348';
    log(`Sending WhatsApp to test phone: ${testPhone}`);
    
    try {
      await sendWhatsAppTemplate(testPhone, mergedPath);
    } catch (error) {
      log(`WhatsApp sending failed: ${error.message}`, 'WARN');
      // Continue processing even if WhatsApp fails
    }
    
    // 6. Update database to mark as processed
    await updateRegistrationStatus(regKey);
    
    log(`Registration ${regKey} processed successfully`);
    
  } catch (error) {
    log(`Failed to process registration ${regKey}: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Main function (equivalent to the main procedure)
async function main() {
  try {
    log('Starting lab reports processing...');
    
    // Initialize database
    await initializeDatabase();
    
    // 0. Delete old PDFs ONCE at the start (equivalent to HOST command)
    cleanupOldPDFs();
    
    // For testing, let's process reg_key 393008 specifically
    const testRegKey = '393008';
    log(`Testing with reg_key: ${testRegKey}`);
    
    // Check if this reg_key exists in reg_with_balance
    const connection = await oracledb.getConnection();
    try {
      const checkQuery = `
        SELECT COUNT(*) as count, branch_code, worklist_printed
        FROM LDM.reg_with_balance
        WHERE reg_key = :regKey
        GROUP BY branch_code, worklist_printed
      `;
      
      const result = await connection.execute(checkQuery, [testRegKey]);
      log(`Reg key ${testRegKey} status:`, result.rows);
      
      if (result.rows.length > 0) {
        const registrations = [testRegKey];
        log(`Processing test reg_key: ${testRegKey}`);
        
        // Process the test registration
        for (const regKey of registrations) {
          try {
            await processRegistration(regKey);
          } catch (error) {
            log(`Error processing registration ${regKey}: ${error.message}`, 'ERROR');
          }
        }
      } else {
        log(`Reg key ${testRegKey} not found in reg_with_balance view`);
      }
    } finally {
      await connection.close();
    }
    
    log('Processing completed');
    
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'ERROR');
    process.exit(1);
  } finally {
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