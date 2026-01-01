const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
console.log('Opening database:', dbPath);

const db = new Database(dbPath);

const messages = db.prepare(`
  SELECT 
    id, 
    media_url, 
    chat_service_sid, 
    created_at,
    twilio_message_sid 
  FROM messages 
  WHERE media_url IS NOT NULL AND (chat_service_sid IS NULL OR chat_service_sid = '')
  ORDER BY created_at DESC 
  LIMIT 10
`).all();

const fs = require('fs');
let output = '';
console.log('Found', messages.length, 'messages with media:');
messages.forEach(msg => {
    output += '---\n';
    output += `ID: ${msg.id}\n`;
    output += `Created: ${msg.created_at}\n`;
    output += `Media URL: ${msg.media_url}\n`;
    output += `Chat Service SID: ${msg.chat_service_sid}\n`;
    output += `Twilio Message SID: ${msg.twilio_message_sid}\n`;
});

fs.writeFileSync('db_dump.txt', output);
console.log('Dump written to db_dump.txt');
