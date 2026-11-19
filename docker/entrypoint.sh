#!/bin/sh
set -e

if [ -z "$JWT_SECRET" ]; then
  echo "ERROR: falta la variable JWT_SECRET (generá una con: openssl rand -hex 32)" >&2
  exit 1
fi

node docker/init-db.mjs
cd packages/server
exec node --import tsx src/index.ts
