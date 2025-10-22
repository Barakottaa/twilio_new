#!/bin/bash

echo "🚀 Setting up PDF to Image Conversion Service..."
echo

echo "📦 Installing Node.js dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install Node.js dependencies"
    exit 1
fi

echo
echo "🔧 Checking for poppler-utils..."
if ! command -v pdftoppm &> /dev/null; then
    echo "⚠️ poppler-utils not found. Please install it:"
    echo
    echo "For Ubuntu/Debian:"
    echo "  sudo apt-get update"
    echo "  sudo apt-get install poppler-utils"
    echo
    echo "For macOS:"
    echo "  brew install poppler"
    echo
    echo "For CentOS/RHEL:"
    echo "  sudo yum install poppler-utils"
    echo
    echo "After installing poppler-utils, run this script again."
    exit 1
else
    echo "✅ poppler-utils found"
fi

echo
echo "📁 Creating directories..."
mkdir -p temp output
echo "✅ Directories created"

echo
echo "⚙️ Checking environment configuration..."
if [ ! -f ".env" ]; then
    echo "⚠️ .env file not found. Please create it with your Bird API credentials:"
    echo
    echo "BIRD_API_KEY=your_bird_api_key"
    echo "BIRD_WORKSPACE_ID=your_workspace_id"
    echo "BIRD_CHANNEL_ID=your_channel_id"
    echo "BIRD_WHATSAPP_NUMBER=your_whatsapp_number"
    echo
    echo "Copy env.example to .env and fill in your credentials."
    exit 1
else
    echo "✅ .env file found"
fi

echo
echo "🧪 Running tests..."
node test-pdf-conversion.js
if [ $? -ne 0 ]; then
    echo "❌ Tests failed. Please check your configuration."
    exit 1
fi

echo
echo "✅ Setup completed successfully!"
echo
echo "🚀 To start the service:"
echo "  npm start"
echo
echo "🧪 To run tests:"
echo "  node test-pdf-conversion.js"
echo
echo "📖 For more information, see PDF_CONVERSION_README.md"
echo
