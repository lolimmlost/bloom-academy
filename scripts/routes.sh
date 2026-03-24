#!/usr/bin/env bash
# Print all TanStack Router routes derived from the file-based routing structure.
# Usage: ./scripts/routes.sh

ROUTES_DIR="src/routes"

find "$ROUTES_DIR" -name '*.tsx' -not -name '__root.tsx' | \
  sed "s|^${ROUTES_DIR}||" | \
  sed 's|\.tsx$||' | \
  sed 's|/index$|/|' | \
  sed 's|\$\([^/]*\)|:\1|g' | \
  sort
