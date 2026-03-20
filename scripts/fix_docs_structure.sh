#!/bin/bash

set -e

echo "Starting docs structure cleanup..."

ROOT_DIR="$(pwd)"

DOCS_DIR="$ROOT_DIR/docs"
SCRIPTS_DIR="$ROOT_DIR/scripts"

# Ensure scripts directory exists
mkdir -p "$SCRIPTS_DIR"

echo "Moving fix_docs_structure.sh to scripts folder..."

if [ -f "$DOCS_DIR/fix_docs_structure.sh" ]; then
    mv "$DOCS_DIR/fix_docs_structure.sh" "$SCRIPTS_DIR/"
fi

# Remove duplicate database folder
if [ -d "$DOCS_DIR/database" ]; then
    echo "Removing duplicate docs/database folder..."
    rm -rf "$DOCS_DIR/database"
fi

# Ensure archive exists
mkdir -p "$DOCS_DIR/archive"

# Ensure numbered folders exist
mkdir -p "$DOCS_DIR/01-product"
mkdir -p "$DOCS_DIR/02-architecture"
mkdir -p "$DOCS_DIR/03-database"
mkdir -p "$DOCS_DIR/04-development"
mkdir -p "$DOCS_DIR/05-operations"
mkdir -p "$DOCS_DIR/06-reference"

echo "Verifying structure..."

tree "$DOCS_DIR" 2>/dev/null || ls -R "$DOCS_DIR"

echo ""
echo "Docs structure successfully cleaned."
echo "Database source of truth: docs/03-database"
echo "Scripts location: scripts/"