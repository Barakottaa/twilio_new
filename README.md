# Twilio WhatsApp Chat Application

A modern, real-time WhatsApp chat application built with Next.js and Twilio Conversations API.

## 🚀 Features

- **Real-time Messaging**: Live WhatsApp chat integration via Twilio
- **Agent Management**: Multi-agent support with role-based permissions
- **Contact Management**: Automatic contact detection and management
- **Modern UI**: Responsive interface with Tailwind CSS
- **Docker Support**: Easy deployment with Docker
- **Database**: SQLite with Prisma ORM

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+ 
- npm 8+
- Twilio Account (optional)

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd twilio_new
npm install
```

2. **Configure environment:**
```bash
cp env.example .env.local
```

3. **Set up database:**
```bash
npm run db:init
```

4. **Start development server:**
```bash
npm run dev
```

5. **Access the application:**
- Open http://localhost:3000
- Login with default credentials: `admin` / `admin`

## 🔧 Configuration

### Environment Variables

Create `.env.local` file:

```bash
# Database (SQLite is default)
DATABASE_TYPE=sqlite
SQLITE_DB_PATH=./database.sqlite

# Twilio (Optional - for WhatsApp integration)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
WEBHOOK_URL=https://your-domain.com/api/twilio/webhook

# Application
NODE_ENV=development
PORT=3000
```

### Twilio WhatsApp Setup

1. **Configure Twilio Console:**
   - Go to Twilio Console → Messaging → WhatsApp
   - Set webhook URL: `https://your-domain.com/api/twilio/webhook`
   - Set HTTP method: `POST`

2. **Test the integration:**
   - Send a WhatsApp message to your Twilio number
   - Check the application for incoming messages

## 🐳 Docker Deployment

### Quick Deploy

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Production Deploy

```bash
# Use production configuration
docker-compose -f docker-compose.prod.yml up -d
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   │   └── twilio/        # Twilio webhook (simplified)
│   ├── agents/            # Agent management
│   ├── contacts/          # Contact management
│   └── settings/          # Application settings
├── components/            # React components
│   ├── chat/             # Chat interface
│   └── ui/               # UI components
├── lib/                  # Utilities and services
└── types/                # TypeScript definitions
```

## 🔗 API Endpoints

### Webhook
- `POST /api/twilio/webhook` - Main Twilio webhook (handles all events)

### Conversations
- `GET /api/twilio/conversations` - List conversations
- `POST /api/twilio/conversations/[id]/message` - Send message
- `POST /api/twilio/conversations/[id]/assign` - Assign conversation
- `DELETE /api/twilio/conversations/[id]/delete` - Delete conversation

### Agents & Contacts
- `GET /api/agents` - List agents
- `POST /api/agents` - Create agent
- `GET /api/contacts` - List contacts
- `POST /api/contacts` - Create contact

## 🎯 Key Features

### Simplified Architecture
- **Single Webhook**: One endpoint handles all Twilio events
- **Clean Code**: Removed redundant and non-working code
- **Easy Maintenance**: Streamlined codebase for better maintainability

### Real-time Features
- Live message updates via Server-Sent Events (SSE)
- Automatic contact detection from WhatsApp
- Media message support (images, videos, documents)

### Security
- Twilio signature validation
- Session-based authentication
- Role-based access control

## 🚨 Troubleshooting

### Common Issues

1. **Webhook not receiving calls:**
   - Verify webhook URL is accessible
   - Check Twilio console for delivery status
   - Ensure HTTPS is used for webhook URL

2. **Database issues:**
   - Check file permissions for SQLite database
   - Run `npm run db:init` to reinitialize

3. **Login issues:**
   - Clear browser cookies
   - Check server logs for errors

### Health Checks

```bash
# Application health
curl http://localhost:3000/api/auth/me

# Webhook test
curl http://localhost:3000/api/twilio/webhook
```

## 📞 Support

For issues or questions:
1. Check server logs for error messages
2. Verify environment configuration
3. Test with default SQLite database first

## 🔄 Updates

The application has been simplified for better maintainability:
- ✅ Consolidated webhook endpoints
- ✅ Removed redundant code
- ✅ Streamlined architecture
- ✅ Cleaner documentation

---

**Built with Next.js, Twilio, and ❤️**