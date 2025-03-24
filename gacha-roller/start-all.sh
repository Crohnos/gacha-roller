#!/bin/bash

# Start Gacha Roller components

echo "Starting Gacha Roller components..."

# Start the backend server
echo "Starting backend server..."
cd "$(dirname "$0")" || exit
BACKEND_PID=""
bun run index.ts &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait a moment for the backend to initialize
sleep 2

# Start the web application
echo "Starting web application..."
cd ../gacha-web || exit
WEB_PID=""
bun run dev &
WEB_PID=$!
echo "Web app started with PID: $WEB_PID"

# Start the Discord bot
echo "Starting Discord bot..."
cd ../gacha-bot || exit
BOT_PID=""
bun run index.ts &
BOT_PID=$!
echo "Discord bot started with PID: $BOT_PID"

echo "All components started!"
echo "Press Ctrl+C to stop all components"

# Handle stopping all processes on script termination
trap 'echo "Stopping all components..."; kill $BACKEND_PID $WEB_PID $BOT_PID 2>/dev/null; exit' INT TERM

# Keep the script running
wait