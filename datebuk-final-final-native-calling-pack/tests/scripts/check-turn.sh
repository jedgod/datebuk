#!/usr/bin/env bash
set -euo pipefail

HOST="${1:-turn.datebuk.example}"
PORT="${2:-3478}"

echo "Checking ${HOST}:${PORT}"

if command -v nc >/dev/null 2>&1; then
  nc -vz "$HOST" "$PORT"
else
  echo "Install netcat for TCP checks."
fi

echo "For authenticated relay validation:"
echo "turnutils_uclient -u '<temp-user>' -w '<temp-password>' -p ${PORT} ${HOST}"
