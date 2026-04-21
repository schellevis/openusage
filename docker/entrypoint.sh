#!/bin/sh
set -eu

cat > /usr/share/nginx/html/runtime-config.js <<EOF
window.__OPENUSAGE_CONFIG__ = {
  apiBaseUrl: "${OPENUSAGE_API_BASE_URL}"
}
EOF
