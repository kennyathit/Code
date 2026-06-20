#!/usr/bin/env bash
# Launcher for macOS / Linux. Installs deps + database on first run,
# then starts the platform and opens it in your browser.
set -e
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Install the LTS version from https://nodejs.org then run this again."
  exit 1
fi

[ -d node_modules ] || { echo "Installing dependencies..."; npm install; }
[ -f prisma/dev.db ] || { echo "Setting up the database from config.yaml..."; npm run setup; }

# open the browser a few seconds after the server starts
(
  sleep 4
  (command -v open >/dev/null && open http://localhost:3000) \
    || (command -v xdg-open >/dev/null && xdg-open http://localhost:3000) \
    || true
) >/dev/null 2>&1 &

echo "Opening http://localhost:3000 ..."
npm run dev
