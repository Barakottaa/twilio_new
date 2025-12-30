# Troubleshooting DNS/Network Errors with Twilio

## Error: `getaddrinfo ENOTFOUND conversations.twilio.com`

This error indicates that your system cannot resolve the DNS name for Twilio's servers. This is a network-level issue, not a code issue.

## Quick Fixes

### 1. Check Internet Connection
- Verify you have an active internet connection
- Try accessing `https://conversations.twilio.com` in your browser

### 2. Test DNS Resolution
Open a command prompt and run:
```bash
nslookup conversations.twilio.com
```

If this fails, your DNS server cannot resolve Twilio's domain.

### 3. Try Different DNS Servers
If you're on Windows, you can change your DNS settings:

**Option A: Via Network Settings**
1. Open Network Settings
2. Go to your network adapter
3. Change DNS to:
   - Primary: `8.8.8.8` (Google DNS)
   - Secondary: `1.1.1.1` (Cloudflare DNS)

**Option B: Via Command Line (as Administrator)**
```bash
netsh interface ip set dns "Ethernet" static 8.8.8.8
netsh interface ip add dns "Ethernet" 1.1.1.1 index=2
```

Replace `"Ethernet"` with your network adapter name (check with `ipconfig`).

### 4. Corporate Proxy/Firewall
If you're behind a corporate firewall or proxy:

1. **Set Proxy Environment Variables:**
   ```bash
   set HTTPS_PROXY=http://proxy.company.com:8080
   set HTTP_PROXY=http://proxy.company.com:8080
   ```

2. **Or create a `.env.local` file:**
   ```
   HTTPS_PROXY=http://proxy.company.com:8080
   HTTP_PROXY=http://proxy.company.com:8080
   ```

3. **Install proxy agent (if needed):**
   ```bash
   npm install https-proxy-agent
   ```

### 5. Firewall Rules
Ensure your firewall allows outbound connections to:
- `*.twilio.com` (port 443)
- `conversations.twilio.com` (port 443)

### 6. Windows Hosts File
Check if `C:\Windows\System32\drivers\etc\hosts` has any entries blocking Twilio domains.

## Automatic Retry Logic

The application now includes automatic retry logic with exponential backoff:
- **3 retry attempts** for network errors
- **Exponential backoff**: 1s, 2s, 4s delays
- **Better error messages** with troubleshooting hints

## Testing Connection

After fixing DNS, restart your server and check the logs. You should see:
```
✅ Using cached conversations
```

Instead of:
```
❌ Error in listConversationsLite: Error: getaddrinfo ENOTFOUND conversations.twilio.com
```

## Still Having Issues?

1. **Check Twilio Status**: https://status.twilio.com
2. **Verify Credentials**: Ensure `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are correct in your `.env` file
3. **Test from Different Network**: Try running from a different network to isolate the issue
4. **Contact IT**: If on a corporate network, contact your IT department about firewall/proxy rules

## Environment Variables

Make sure your `.env` file has:
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
```

Optional (for proxy):
```
HTTPS_PROXY=http://proxy.example.com:8080
HTTP_PROXY=http://proxy.example.com:8080
```

