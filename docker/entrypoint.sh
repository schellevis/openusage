#!/bin/sh
set -eu

escaped_api_base_url=$(
  printf '%s' "${OPENUSAGE_API_BASE_URL}" \
    | sed ':a;N;$!ba;s/\\/\\\\/g;s/"/\\"/g;s/\r/\\r/g;s/\n/\\n/g' \
    | sed 's/[&|]/\\&/g'
)
sed "s|\${OPENUSAGE_API_BASE_URL}|${escaped_api_base_url}|g" \
  /etc/openusage/runtime-config.template.js \
  > /usr/share/nginx/html/runtime-config.js
