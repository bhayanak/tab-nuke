<p align="center">
  <img src="icons/logo.svg" alt="Tab Nuke" width="128" />
</p>

<h1 align="center">Tab Nuke</h1>

<p align="center">
  Smart tab manager that tames your browser.<br/>
  <strong>Auto-suspend · Session save · Focus mode · Memory dashboard</strong>
</p>

<p align="center">
  <a href="https://github.com/tab-nuke/tab-nuke/actions"><img src="https://img.shields.io/github/actions/workflow/status/tab-nuke/tab-nuke/ci.yml?branch=main&label=CI" alt="CI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" /></a>
  <img src="https://img.shields.io/badge/manifest-v3-green.svg" alt="Manifest V3" />
</p>

---

## Features

| Feature | Description |
|---------|-------------|
| **Auto-Suspend** | Hibernates inactive tabs after configurable timeout, freeing memory |
| **Smart Grouping** | Groups tabs by domain with one click |
| **Session Save/Restore** | Save all tabs as a named session, restore later |
| **Focus Mode** | Close all tabs except current domain — restore them later |
| **Memory Dashboard** | Track memory usage and savings from suspended tabs |
| **Tab Search** | Fuzzy search across all open and suspended tabs |
| **Keyboard Shortcuts** | Quick actions via configurable shortcuts |
| **Dark Mode** | Follows system preference |

## Comparison

| Feature | Tab Nuke | OneTab | The Great Suspender |
|---------|----------|--------|---------------------|
| Auto-suspend | ✅ | ❌ | ✅ (discontinued) |
| Tab grouping | ✅ | ❌ | ❌ |
| Session save | ✅ | ✅ | ❌ |
| Focus mode | ✅ | ❌ | ❌ |
| Memory stats | ✅ | ❌ | ❌ |
| Fuzzy search | ✅ | ❌ | ❌ |
| Manifest V3 | ✅ | ❌ | ❌ |
| Privacy-first | ✅ | ⚠️ | ❌ |
| Open source | ✅ | ❌ | ❌ |

## Install

### Chrome / Edge

1. Download the latest release ZIP from [Releases](https://github.com/tab-nuke/tab-nuke/releases)
2. Go to `chrome://extensions` (or `edge://extensions`)
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extracted folder

### Firefox

1. Download the latest `.xpi` from [Releases](https://github.com/tab-nuke/tab-nuke/releases)
2. Go to `about:addons`
3. Click the gear icon → "Install Add-on From File"
4. Select the `.xpi` file

## Usage

### Quick Actions

- **Suspend All** — Suspends all tabs except the active one
- **Restore All** — Restores all suspended tabs
- **Focus Mode** — Closes all tabs except those on the current domain

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+S` | Suspend current tab |
| `Alt+Shift+S` | Suspend all other tabs |
| `Alt+F` | Toggle focus mode |
| `Alt+T` | Search tabs |

### Configuration

Open the extension popup → Settings tab to configure:

- Auto-suspend timeout (0 to disable)
- Whitelisted domains
- Pinned tab protection
- Audio tab protection
- Form data protection

## Development

### Prerequisites

- Node.js 18+
- pnpm 9+

### Setup

```bash
git clone https://github.com/tab-nuke/tab-nuke.git
cd tab-nuke
pnpm install
```

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server with hot reload |
| `pnpm build` | Production build |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm lint` | ESLint with security rules |
| `pnpm test` | Run unit tests |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm package:chrome` | Package for Chrome |
| `pnpm package:firefox` | Package for Firefox |
| `pnpm package:edge` | Package for Edge |

### Loading in Chrome for Development

1. Run `pnpm dev`
2. Go to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist/` folder
6. The extension auto-reloads on file changes

## Architecture

```
src/
├── background/          # Service worker: tab watcher, suspend engine, sessions
├── content/             # Content script: scroll position tracking
├── popup/               # React popup: tab list, sessions, groups, settings
├── sidebar/             # React sidebar: analytics, session browser
├── suspended/           # Lightweight suspended tab placeholder
└── shared/              # Types, constants, utilities, Zustand store
```

## Security

- **Zero tracking** — No analytics, no external requests
- **URL validation** — All URLs sanitized before tab operations
- **XSS prevention** — Dynamic content uses `textContent`, never `innerHTML`
- **Minimal permissions** — Only `tabs`, `tabGroups`, `storage`, `alarms`, `scripting`
- **Local storage** — All data stored locally in the browser

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for development guidelines.

## License

[MIT](LICENSE) — free to use, modify, and distribute.
