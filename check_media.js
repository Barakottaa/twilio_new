const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./database.sqlite');

db.get('SELECT media_url, media_data FROM messages WHERE message_type="media" ORDER BY created_at DESC LIMIT 1', (e, m) => {
  if (e) {
    console.log('Error:', e);
  } else {
    console.log('Media URL:', m.media_url);
    console.log('\nMedia Data:', m.media_data);
  }
  db.close();
});

