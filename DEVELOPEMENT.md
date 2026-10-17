# Git Development Guide

## Branch Strategy

This repository follows a Git Flow-inspired workflow.

### Protected Branches

| Branch | Purpose |
|----------|----------|
| `main` | Stable, production-ready code |
| `dev` | Active development branch |

Never commit directly to `main`.

---

## First-Time Setup

Clone the repository:

```bash
git clone https://github.com/your-org/sitwell.git
cd sitwell
```

Fetch all remote branches:

```bash
git fetch --all
```

Create a local tracking branch for `dev`:

```bash
git checkout -b dev origin/dev
```

Verify branches:

```bash
git branch -a
```

Expected output:

```text
* dev
  main
  remotes/origin/dev
  remotes/origin/main
```

---

## Development Workflow

Before starting work:

```bash
git checkout dev
git pull origin dev
```

Create a feature branch:

```bash
git checkout -b feature/esp32-monitor
```

Examples:

```text
feature/esp32-monitor
feature/posture-analytics
feature/dashboard-ui
feature/settings-page
```

---

## Making Changes

After implementing your changes:

```bash
git add .
git commit -m "Added ESP32 connection status indicator"
```

Push only to your feature branch:

```bash
git push -u origin feature/esp32-monitor
```

---

## Creating a Pull Request

When your feature is complete:

1. Push your feature branch.
2. Open GitHub.
3. Create a Pull Request:
   - Source: `feature/your-feature`
   - Target: `dev`

```text
feature/*
        ↓
       dev
```

After review and testing, merge into `dev`.

---

## Release Workflow

When `dev` has been fully tested:

```text
dev
 ↓
main
```

Create a Pull Request:

```text
Source: dev
Target: main
```

Only tested and approved code should enter `main`.

---

## Branch Rules

✅ Allowed

```text
feature/* → dev
dev → main
```

❌ Not Allowed

```text
feature/* → main
direct commits → main
direct pushes → main
```

---

## Syncing Your Branch

Update your feature branch with the latest `dev` changes:

```bash
git checkout dev
git pull origin dev

git checkout feature/esp32-monitor
git merge dev
```

---

## Useful Commands

### Check Current Branch

```bash
git branch
```

### View Status

```bash
git status
```

### Pull Latest Changes

```bash
git pull origin dev
```

### Push Changes

```bash
git push
```

### Delete Local Branch

```bash
git branch -d feature/esp32-monitor
```

### Delete Remote Branch

```bash
git push origin --delete feature/esp32-monitor
```

---

## Visual Workflow

```text
main
 │
 └─────► Stable Releases
           ▲
           │
          dev
           ▲
           │
    ┌──────┼──────┐
    │      │      │
feature  feature  feature
  A        B        C
```

### Golden Rule

> Develop on `feature/*` branches, merge into `dev`, and only release to `main` after testing. Never push directly to `main`.