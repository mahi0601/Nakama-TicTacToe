#!/bin/bash

echo "🎮 Tic-Tac-Toe Multiplayer Setup Script"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Setup Server
echo "📦 Installing server dependencies..."
cd server
npm install
if [ $? -eq 0 ]; then
    echo "✅ Server dependencies installed"
else
    echo "❌ Failed to install server dependencies"
    exit 1
fi
cd ..

echo ""

# Setup Mobile
echo "📱 Installing mobile app dependencies..."
cd mobile
npm install
if [ $? -eq 0 ]; then
    echo "✅ Mobile app dependencies installed"
else
    echo "❌ Failed to install mobile app dependencies"
    exit 1
fi
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Find your computer's IP address:"
echo "   - Windows: ipconfig"
echo "   - Mac/Linux: ifconfig | grep 'inet '"
echo ""
echo "2. Update mobile/App.tsx line 16 with your IP:"
echo "   const SERVER_URL = 'ws://YOUR_IP:3000';"
echo ""
echo "3. Start the server:"
echo "   cd server && npm start"
echo ""
echo "4. In another terminal, start mobile app:"
echo "   cd mobile && npm start"
echo ""
echo "5. Open Expo Go on your phone and scan QR code"
echo ""
echo "📖 For more details, see QUICKSTART.md"
echo ""

