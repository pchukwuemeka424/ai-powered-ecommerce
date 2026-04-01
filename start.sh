#!/bin/sh
set -e

# Start backend (Fastify API on PORT, default 4000)
cd /app/backend
node dist/server.js &
BACKEND_PID=$!

# Start frontend (Next.js on port 3000)
cd /app/frontend/standalone/apps/frontend
PORT=3000 HOSTNAME=0.0.0.0 node server.js &
FRONTEND_PID=$!

# If either process exits, bring down the container
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGTERM SIGINT

wait -n $BACKEND_PID $FRONTEND_PID
EXIT_CODE=$?
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
exit $EXIT_CODE
