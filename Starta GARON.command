#!/bin/bash
set -eu
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Installera Node.js 24 eller senare från nodejs.org och öppna sedan filen igen."
  read -r -p "Tryck Retur för att avsluta. " _garon_reply
  exit 1
fi
node -e 'if (Number(process.versions.node.split(".")[0]) < 24) { console.error("GARON kräver Node.js 24 eller senare."); process.exit(1); }'
_garon_hash=$(node -e 'const fs=require("node:fs"),crypto=require("node:crypto");process.stdout.write(crypto.createHash("sha256").update(fs.readFileSync("package-lock.json")).digest("hex"))')
_garon_saved=""
if [ -f node_modules/.garon-lockhash ]; then _garon_saved=$(cat node_modules/.garon-lockhash); fi
if [ ! -d node_modules ] || [ "$_garon_hash" != "$_garon_saved" ]; then
  if [ -d node_modules ]; then
    mv node_modules "node_modules-backup-$(date +%Y%m%d-%H%M%S)"
    echo "Äldre paket har flyttats till en säkerhetskopia. Dina data påverkas inte."
  fi
  npm ci
  printf '%s' "$_garon_hash" > node_modules/.garon-lockhash
fi
npm run build
echo "GARON startar. Låt terminalen vara öppen. Stoppa med Ctrl+C."
GARON_OPEN_BROWSER=1 npm start
