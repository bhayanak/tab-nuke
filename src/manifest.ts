import { ManifestV3Export } from '@crxjs/vite-plugin';

const manifest: ManifestV3Export = {
  manifest_version: 3,
  name: 'Tab Nuke',
  version: '1.0.0',
  description: 'Smart tab manager: auto-suspend inactive tabs, save sessions, focus mode, memory dashboard.',
  permissions: ['tabs', 'tabGroups', 'storage', 'alarms', 'scripting'],
  host_permissions: ['<all_urls>'],
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  action: {
    default_popup: 'src/popup/popup.html',
    default_icon: {
      '16': 'icons/icon-16.png',
      '48': 'icons/icon-48.png',
      '128': 'icons/icon-128.png',
    },
  },
  icons: {
    '16': 'icons/icon-16.png',
    '48': 'icons/icon-48.png',
    '128': 'icons/icon-128.png',
  },
  side_panel: {
    default_path: 'src/sidebar/sidebar.html',
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/scroll-tracker.ts'],
      run_at: 'document_idle',
    },
  ],
  commands: {
    'suspend-current': {
      suggested_key: { default: 'Alt+S' },
      description: 'Suspend current tab',
    },
    'suspend-all': {
      suggested_key: { default: 'Alt+Shift+S' },
      description: 'Suspend all other tabs',
    },
    'focus-mode': {
      suggested_key: { default: 'Alt+F' },
      description: 'Toggle focus mode',
    },
    'search-tabs': {
      suggested_key: { default: 'Alt+T' },
      description: 'Search tabs',
    },
  },
};

export default manifest;
