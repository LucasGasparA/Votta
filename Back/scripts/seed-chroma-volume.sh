#!/usr/bin/env sh
set -eu

TARGET_DIR="${CHROMA_DIR:-/app/chroma_db}"
SEED_DIR="${CHROMA_SEED_DIR:-/app/chroma_seed}"

if [ -f "$TARGET_DIR/chroma.sqlite3" ]; then
  echo "Chroma DB already present at $TARGET_DIR"
  exit 0
fi

if [ ! -f "$SEED_DIR/chroma.sqlite3" ]; then
  echo "No Chroma seed found at $SEED_DIR; skipping seed copy"
  exit 0
fi

mkdir -p "$TARGET_DIR"
echo "Seeding Chroma DB from $SEED_DIR to $TARGET_DIR"
cp -a "$SEED_DIR/." "$TARGET_DIR/"
echo "Chroma DB seed copy completed"
