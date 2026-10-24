## Current SitWell implementation

Rust HTTP device communication and SQLite persistence are implemented. Start with [docs/SQLITE-STORAGE.md](docs/SQLITE-STORAGE.md) for setup and storage tests, and [docs/RUST-DEVICE-CONNECTION.md](docs/RUST-DEVICE-CONNECTION.md) for hardware checks.

# SitWell

## Prerequisites

Install the following before starting:

### Node.js
Recommended: v20+

Check version:

```bash
node -v
npm -v
```

### Rust

Install from:

https://www.rust-lang.org/tools/install

Verify:

```bash
rustc --version
cargo --version
```

### Tauri Prerequisites

Follow the official guide:

https://tauri.app/start/prerequisites/

### Git

```bash
git --version
```

## Installation

Clone the repository:

```bash
git clone https://github.com/your-org/sitwell.git
cd sitwell
```

Install dependencies:

```bash
npm install
```

Run the application:

```bash
npm run tauri dev
```

Build for production:

```bash
npm run tauri build
```

## Project Docs

- [docs/CHANGELOG.md](docs/CHANGELOG.md): what has been built so far
- [docs/INTEGRATION.md](docs/INTEGRATION.md): how to connect the ESP32-C3, BLE Lamp and database; JSON payload contract

In `npm run tauri dev`, use the **Device simulator** button (bottom-right) to test all states without hardware.
