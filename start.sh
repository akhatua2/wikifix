#!/bin/bash

# Start the server in the background
echo "Starting server on port 8001..."
cd backend
uvicorn main:app --host localhost --port 8001 --reload &
SERVER_PID=$!

# Start the frontend in the background
echo "Starting frontend on port 3000..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

# Function to handle script termination
cleanup() {
    echo "Shutting down applications..."
    kill $SERVER_PID
    kill $FRONTEND_PID
    exit 0
}

# Set up trap to catch termination signal
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait $SERVER_PID $FRONTEND_PID
