#!/usr/bin/env bash
set -euo pipefail

# Load environment from .env.local and run the seed script
ENV_FILE=.env.local
if [ ! -f "$ENV_FILE" ]; then
  echo "${ENV_FILE} not found. Create a .env.local with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

echo "Loading environment from $ENV_FILE"

while IFS= read -r line || [ -n "$line" ]; do
  # skip comments and empty lines
  if [[ -z "$line" || ${line:0:1} == '#' ]]; then
    continue
  fi
  # Only export simple KEY=VALUE lines (won't evaluate commands)
  if [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
    key=${line%%=*}
    val=${line#*=}
    # strip surrounding quotes if present
    if [[ ${val:0:1} == '"' && ${val: -1} == '"' ]]; then
      val=${val:1:-1}
    elif [[ ${val:0:1} == "'" && ${val: -1} == "'" ]]; then
      val=${val:1:-1}
    fi
    export "$key"="$val"
  fi
done < "$ENV_FILE"

echo "Running seed script with SUPABASE_URL=${SUPABASE_URL:-<not-set>}"

node scripts/seed.js
