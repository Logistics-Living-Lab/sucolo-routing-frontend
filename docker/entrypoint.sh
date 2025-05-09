#!/usr/bin/env bash
echo "Initializing container..."
mkdir -p $HTML_DIR/assets/

# Recreate config on each start
rm -f $HTML_DIR/assets/config.json
echo "Setting config..."
envsubst < /tmp/config.template.json > $HTML_DIR/assets/config.json

echo "Starting nginx..."

nginx -g "daemon off;"
