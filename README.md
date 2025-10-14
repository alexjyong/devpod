<br>
<a href="https://www.devpod.sh">
  <picture width="500">
    <source media="(prefers-color-scheme: dark)" srcset="docs/static/media/devpod_dark.png">
    <img alt="DevPod wordmark" width="500" src="docs/static/media/devpod.png">
  </picture>
</a>

### **[Website](https://www.devpod.sh)** • **[Quickstart](https://www.devpod.sh/docs/getting-started/install)** • **[Documentation](https://www.devpod.sh/docs/what-is-devpod)** • **[Blog](https://loft.sh/blog)** • **[𝕏 (Twitter)](https://x.com/loft_sh)** • **[Slack](https://slack.loft.sh/)**

[![Join us on Slack!](docs/static/media/slack.svg)](https://slack.loft.sh/) [![Open in DevPod!](https://devpod.sh/assets/open-in-devpod.svg)](https://devpod.sh/open#https://github.com/loft-sh/devpod)

**[We are hiring!](https://www.loft.sh/careers) Come build the future of remote development environments with us.**

DevPod is a client-only tool to create reproducible developer environments based on a [devcontainer.json](https://containers.dev/) on any backend. Each developer environment runs in a container and is specified through a [devcontainer.json](https://containers.dev/). Through DevPod providers, these environments can be created on any backend, such as the local computer, a Kubernetes cluster, any reachable remote machine, or in a VM in the cloud.

![Codespaces](docs/static/media/codespaces-but.png)

You can think of DevPod as the glue that connects your local IDE to a machine where you want to develop. So depending on the requirements of your project, you can either create a workspace locally on the computer, on a beefy cloud machine with many GPUs, or a spare remote computer. Within DevPod, every workspace is managed the same way, which also makes it easy to switch between workspaces that might be hosted somewhere else.

![DevPod Flow](docs/static/media/devpod-flow.gif)

## Quickstart

Download DevPod Desktop:
- [MacOS Silicon/ARM](https://github.com/loft-sh/devpod/releases/latest/download/DevPod_macos_aarch64.dmg)
- [MacOS Intel/AMD](https://github.com/loft-sh/devpod/releases/latest/download/DevPod_macos_x64.dmg)
- [Windows](https://github.com/loft-sh/devpod/releases/latest/download/DevPod_windows_x64_en-US.msi)
- [Linux AppImage](https://github.com/loft-sh/devpod/releases/latest/download/DevPod_linux_amd64.AppImage)

Take a look at the [DevPod Docs](https://devpod.sh/docs/getting-started/install) for more information.

## Why DevPod?

DevPod reuses the open [DevContainer standard](https://containers.dev/) (used by GitHub Codespaces and VSCode DevContainers) to create a consistent developer experience no matter what backend you want to use.

Compared to hosted services such as Github Codespaces, JetBrains Spaces, or Google Cloud Workstations, DevPod has the following advantages:
* **Cost savings**: DevPod is usually around 5-10 times cheaper than existing services with comparable feature sets because it uses bare virtual machines in any cloud and shuts down unused virtual machines automatically.
* **No vendor lock-in**: Choose whatever cloud provider suits you best, be it the cheapest one or the most powerful, DevPod supports all cloud providers. If you are tired of using a provider, change it with a single command.
* **Local development**: You get the same developer experience also locally, so you don't need to rely on a cloud provider at all.
* **Cross IDE support**: VSCode and the full JetBrains suite is supported, all others can be connected through simple ssh.
* **Client-only**: No need to install a server backend, DevPod runs only on your computer.
* **Open-Source**: DevPod is 100% open-source and extensible. A provider doesn't exist? Just create your own.
* **Rich feature set**: DevPod already supports prebuilds, auto inactivity shutdown, git & docker credentials sync, and many more features to come.
* **Desktop App**: DevPod comes with an easy-to-use desktop application that abstracts all the complexity away. If you want to build your own integration, DevPod offers a feature-rich CLI as well.

## Building DevPod Secrets

DevPod Secrets is a fork of DevPod that adds secret management capabilities. You can build it yourself on macOS (and other platforms).

### Prerequisites

**All Platforms:**
- Go 1.21.8 or later
- Node.js 18+ (LTS recommended)
- Yarn package manager

**macOS Specific:**
- Xcode Command Line Tools: `xcode-select --install`
- Rust toolchain: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`

**Linux Specific:**
- Build essentials: `sudo apt-get install build-essential`
- System dependencies: `sudo apt-get install libgtk-3-dev libwebkit2gtk-4.0-dev libayatana-appindicator3-dev librsvg2-dev`

**Windows Specific:**
- Visual Studio Build Tools or Visual Studio Community
- Windows SDK

### Building on macOS

1. **Clone the repository:**
   ```bash
   git clone https://github.com/alexjyong/devpod.git
   cd devpod
   ```

2. **Set up Rust targets:**
   ```bash
   # For Apple Silicon Macs
   rustup target add aarch64-apple-darwin
   
   # For Intel Macs  
   rustup target add x86_64-apple-darwin
   ```

3. **Install Node.js dependencies:**
   ```bash
   cd desktop
   yarn install
   cd ..
   ```

4. **Build the CLI binaries:**
   ```bash
   # For Apple Silicon (M1/M2/M3)
   GOOS=darwin GOARCH=arm64 CGO_ENABLED=0 go build -ldflags "-s -w" -o desktop/src-tauri/bin/devpod-secrets-cli-aarch64-apple-darwin
   
   # For Intel Macs
   GOOS=darwin GOARCH=amd64 CGO_ENABLED=0 go build -ldflags "-s -w" -o desktop/src-tauri/bin/devpod-secrets-cli-x86_64-apple-darwin
   
   # Build Linux binaries for agent injection (required)
   GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags "-s -w" -o desktop/src-tauri/bin/devpod-secrets-cli-linux-amd64
   GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -ldflags "-s -w" -o desktop/src-tauri/bin/devpod-secrets-cli-linux-arm64
   ```

5. **Create the expected binary name:**
   ```bash
   # Copy the appropriate binary for your architecture
   # For Apple Silicon:
   cp desktop/src-tauri/bin/devpod-secrets-cli-aarch64-apple-darwin desktop/src-tauri/bin/devpod-secrets-cli
   
   # For Intel:
   cp desktop/src-tauri/bin/devpod-secrets-cli-x86_64-apple-darwin desktop/src-tauri/bin/devpod-secrets-cli
   ```

6. **Build the desktop app:**
   ```bash
   cd desktop
   
   # For development (faster, unsigned)
   yarn tauri build --debug
   
   # For production (slower, optimized)
   yarn tauri build
   ```

7. **Find your built app:**
   ```bash
   # Debug builds
   open desktop/src-tauri/target/debug/bundle/macos/
   
   # Release builds  
   open desktop/src-tauri/target/release/bundle/macos/
   ```

### Quick Build Script (macOS)

Create a `build-macos.sh` script for convenience:

```bash
#!/bin/bash
set -e

echo "🔨 Building DevPod Secrets for macOS..."

# Detect architecture
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
    RUST_TARGET="aarch64-apple-darwin"
    GO_ARCH="arm64"
else
    RUST_TARGET="x86_64-apple-darwin"
    GO_ARCH="amd64"
fi

echo "📋 Architecture: $ARCH (targeting $RUST_TARGET)"

# Build CLI binaries
echo "🏗️  Building CLI binaries..."
GOOS=darwin GOARCH=$GO_ARCH CGO_ENABLED=0 go build -ldflags "-s -w" -o "desktop/src-tauri/bin/devpod-secrets-cli-$RUST_TARGET"
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags "-s -w" -o "desktop/src-tauri/bin/devpod-secrets-cli-linux-amd64"
GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -ldflags "-s -w" -o "desktop/src-tauri/bin/devpod-secrets-cli-linux-arm64"

# Create expected binary name
cp "desktop/src-tauri/bin/devpod-secrets-cli-$RUST_TARGET" "desktop/src-tauri/bin/devpod-secrets-cli"

# Install dependencies and build
echo "📦 Installing dependencies..."
cd desktop && yarn install

echo "🚀 Building desktop app..."
yarn tauri build --debug

echo "✅ Build complete! Check desktop/src-tauri/target/debug/bundle/macos/"
```

Make it executable: `chmod +x build-macos.sh` and run: `./build-macos.sh`

### Building for Other Platforms

**Linux:**
```bash
# Install system dependencies first
sudo apt-get update
sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.0-dev libayatana-appindicator3-dev librsvg2-dev

# Follow similar steps as macOS, but target x86_64-unknown-linux-gnu
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags "-s -w" -o desktop/src-tauri/bin/devpod-secrets-cli-x86_64-unknown-linux-gnu
cp desktop/src-tauri/bin/devpod-secrets-cli-x86_64-unknown-linux-gnu desktop/src-tauri/bin/devpod-secrets-cli

cd desktop && yarn install && yarn tauri build
```

**Windows:**
```cmd
REM Build CLI
set GOOS=windows
set GOARCH=amd64
go build -ldflags "-s -w" -o desktop\src-tauri\bin\devpod-secrets-cli-x86_64-pc-windows-msvc.exe
copy desktop\src-tauri\bin\devpod-secrets-cli-x86_64-pc-windows-msvc.exe desktop\src-tauri\bin\devpod-secrets-cli.exe

REM Build app
cd desktop
yarn install
yarn tauri build
```

### Development Mode

For faster development iterations:

```bash
cd desktop
yarn tauri dev
```

This starts the app in development mode with hot reloading for the frontend, but you'll still need to rebuild the CLI if you make Go changes.

### Troubleshooting

**Common Issues:**

- **"rustup: command not found"**: Install Rust from https://rustup.rs/
- **"yarn: command not found"**: Install via `npm install -g yarn`
- **Build fails on macOS**: Make sure Xcode Command Line Tools are installed
- **Linux build fails**: Ensure all system dependencies are installed
- **Binary not found**: Check that CLI binary names match what Tauri expects

**Getting Help:**

For build issues specific to DevPod Secrets, check the [Issues](https://github.com/alexjyong/devpod/issues) or create a new one.
