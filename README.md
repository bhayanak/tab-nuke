<p align="center">
  <img src="icons/logo.svg" alt="Tab Nuke" width="128" />
</p>

<h1 align="center">Tab Nuke</h1>

<p align="center">
  Smart tab manager that tames your browser.<br/>
  <strong>Auto-suspend · Session save · Focus mode · Memory dashboard</strong>
</p>

<p align="center">
  <a href="https://github.com/bhayanak/tab-nuke/actions"><img src="https://img.shields.io/github/actions/workflow/status/bhayanak/tab-nuke/ci.yml?branch=main&label=CI" alt="CI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" /></a>
  <img src="https://img.shields.io/badge/manifest-v3-green.svg" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/coverage-96%25-brightgreen" alt="Coverage 97%" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen" alt="Node >= 18" />
  <img src="https://img.shields.io/badge/chrome-116%2B-yellow" alt="Chrome 116+" />
  <img src="https://img.shields.io/badge/firefox-109%2B-orange" alt="Firefox 109+" />
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

## Screens
## Screens
<p align="center">
  <img src="docs/screens/tabs.png" width="400" alt="Screenshot 1" />
  <img src="docs/screens/sessions.png" width="400" alt="Screenshot 2" />
</p>

<p align="center">
  <img src="docs/screens/groups.png" width="400" alt="Screenshot 3" />
  <img src="docs/screens/settings.png" width="400" alt="Screenshot 4" />
</p>


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
