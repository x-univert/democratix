#!/bin/bash

set -e

echo "🔨 Building DEMOCRATIX Smart Contracts..."

# Build voter-registry
echo "📦 Building voter-registry..."
cd voter-registry
mxpy contract build
cd ..

# Build voting
echo "📦 Building voting..."
cd voting
mxpy contract build
cd ..

# Build results
echo "📦 Building results..."
cd results
mxpy contract build
cd ..

echo "✅ All contracts built successfully!"
