#!/bin/bash

# Download Powers of Tau file for DEMOCRATIX circuits

set -e  # Exit on error

echo "======================================"
echo "  Download Powers of Tau (Phase 1)"
echo "======================================"
echo ""

cd build 2>/dev/null || mkdir -p build && cd build

PTAU_FILE="powersOfTau28_hez_final_20.ptau"
PTAU_URL="https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_20.ptau"

# Check if file already exists
if [ -f "$PTAU_FILE" ]; then
    echo "✅ Powers of Tau file already exists: $PTAU_FILE"
    echo "   Size: $(du -h $PTAU_FILE | cut -f1)"
    echo ""
    read -p "Download again? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping download."
        exit 0
    fi
    rm -f "$PTAU_FILE"
fi

echo "📥 Downloading Powers of Tau (Phase 1)..."
echo "   Source: $PTAU_URL"
echo "   Target: $PTAU_FILE"
echo ""
echo "   This file is ~570 MB - please wait..."
echo ""

# Try wget first, fallback to curl
if command -v wget &> /dev/null; then
    wget --progress=bar:force "$PTAU_URL" -O "$PTAU_FILE"
elif command -v curl &> /dev/null; then
    curl -# -L "$PTAU_URL" -o "$PTAU_FILE"
else
    echo "❌ Error: neither wget nor curl found!"
    echo "Please install wget or curl to download the file."
    echo ""
    echo "Manual download:"
    echo "  $PTAU_URL"
    exit 1
fi

# Verify file was downloaded
if [ -f "$PTAU_FILE" ]; then
    FILE_SIZE=$(stat -f%z "$PTAU_FILE" 2>/dev/null || stat -c%s "$PTAU_FILE" 2>/dev/null)
    if [ $FILE_SIZE -lt 500000000 ]; then
        echo "❌ Error: Downloaded file seems incomplete (size: $FILE_SIZE bytes)"
        exit 1
    fi

    echo ""
    echo "======================================"
    echo "  ✅ Download complete!"
    echo "======================================"
    echo ""
    echo "File: $PTAU_FILE"
    echo "Size: $(du -h $PTAU_FILE | cut -f1)"
    echo ""
    echo "Next step: Run ./setup-all.sh"
    echo ""
else
    echo "❌ Error: Download failed!"
    exit 1
fi
