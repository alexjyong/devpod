#!/usr/bin/env bash

set -e

BUILD_DIR="${BUILDDIR:=test}"
SRC_DIR="${SRCDIR:=.}"

# Create directory if it doesn't exist
if [ ! -d $BUILD_DIR ]
then
    mkdir ./$BUILD_DIR
fi

CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags "-s -w" -o $BUILD_DIR/devpod-secrets-cli-linux-amd64 $SRC_DIR
CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -ldflags "-s -w" -o $BUILD_DIR/devpod-secrets-cli-linux-arm64 $SRC_DIR
CGO_ENABLED=0 GOOS=darwin GOARCH=arm64 go build -ldflags "-s -w" -o $BUILD_DIR/devpod-secrets-cli-darwin-arm64 $SRC_DIR
CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 go build -ldflags "-s -w" -o $BUILD_DIR/devpod-secrets-cli-darwin-amd64 $SRC_DIR

chmod +x $BUILD_DIR/devpod-secrets-cli-linux-amd64
chmod +x $BUILD_DIR/devpod-secrets-cli-linux-arm64
chmod +x $BUILD_DIR/devpod-secrets-cli-darwin-arm64
chmod +x $BUILD_DIR/devpod-secrets-cli-darwin-amd64
mkdir -p /tmp/devpod-secrets-cache
cp $BUILD_DIR/devpod-secrets-cli-linux-amd64 /tmp/devpod-secrets-cache/devpod-secrets-cli-linux-amd64
cp $BUILD_DIR/devpod-secrets-cli-linux-arm64 /tmp/devpod-secrets-cache/devpod-secrets-cli-linux-arm64
