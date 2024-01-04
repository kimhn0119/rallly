#!/bin/sh
set -e
npx   prisma generate
npx build
# Deploy migration using direct database connection (no connection pool)
DATABASE_URL=$DIRECT_DATABASE_URL yarn db:deploy
