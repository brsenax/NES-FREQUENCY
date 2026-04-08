#!/bin/sh

# Prefer runtime API_URL; fallback to VITE_API_URL for Render build/runtime layouts.
if [ -z "$API_URL" ] && [ -n "$VITE_API_URL" ]; then
  API_URL="$VITE_API_URL"
fi

if [ -z "$API_URL" ]; then
  echo "[warn] API_URL is not set, using default backend host http://backend:8000"
  API_URL="http://backend:8000"
fi

echo "[info] Starting Nginx with API_URL=$API_URL"

envsubst '$PORT $API_URL' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
exec nginx -g 'daemon off;'
