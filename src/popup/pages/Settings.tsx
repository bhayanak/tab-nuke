import React, { useState } from 'react';
import { useStore } from '@/shared/store';
import * as api from '@/shared/messages';
import { SuspendConfig } from '@/shared/types';

export function Settings() {
  const { config, setConfig, memoryStats } = useStore();
  const [whitelistInput, setWhitelistInput] = useState('');

  async function handleUpdate(partial: Partial<SuspendConfig>) {
    const updated = await api.updateConfig(partial);
    setConfig(updated);
  }

  function handleAddWhitelist() {
    const domain = whitelistInput.trim().toLowerCase();
    if (!domain || config.whitelist.includes(domain)) return;
    handleUpdate({ whitelist: [...config.whitelist, domain] });
    setWhitelistInput('');
  }

  function handleRemoveWhitelist(domain: string) {
    handleUpdate({ whitelist: config.whitelist.filter((d) => d !== domain) });
  }

  return (
    <div className="px-4 py-3 space-y-4">
      {/* Auto-suspend timeout */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Auto-suspend after (minutes)
        </label>
        <input
          type="number"
          min={0}
          max={1440}
          value={config.autoSuspendMinutes}
          onChange={(e) => handleUpdate({ autoSuspendMinutes: Number(e.target.value) })}
          className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-white"
        />
        <p className="text-xs text-gray-400 mt-1">Set to 0 to disable auto-suspend</p>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <ToggleOption
          label="Preserve pinned tabs"
          description="Never suspend pinned tabs"
          checked={config.preservePinned}
          onChange={(v) => handleUpdate({ preservePinned: v })}
        />
        <ToggleOption
          label="Preserve audio tabs"
          description="Never suspend tabs playing audio"
          checked={config.preserveAudio}
          onChange={(v) => handleUpdate({ preserveAudio: v })}
        />
        <ToggleOption
          label="Preserve forms"
          description="Never suspend tabs with unsaved form data"
          checked={config.preserveForms}
          onChange={(v) => handleUpdate({ preserveForms: v })}
        />
      </div>

      {/* Whitelist */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Whitelist domains
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={whitelistInput}
            onChange={(e) => setWhitelistInput(e.target.value)}
            placeholder="example.com"
            className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-white"
            onKeyDown={(e) => e.key === 'Enter' && handleAddWhitelist()}
          />
          <button
            onClick={handleAddWhitelist}
            className="px-3 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Add
          </button>
        </div>
        {config.whitelist.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {config.whitelist.map((domain) => (
              <span
                key={domain}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full"
              >
                {domain}
                <button
                  onClick={() => handleRemoveWhitelist(domain)}
                  className="text-red-400 hover:text-red-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Memory Stats */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Memory Stats</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <StatCard label="Active Tabs" value={String(memoryStats.activeCount)} />
          <StatCard label="Suspended" value={String(memoryStats.suspendedCount)} />
          <StatCard label="Est. Usage" value={`${memoryStats.currentUsageMB} MB`} />
          <StatCard label="Total Saved" value={`${memoryStats.totalSavedMB} MB`} />
        </div>
      </div>

      {/* Version */}
      <div className="text-xs text-center text-gray-400 pt-2">Tab Nuke v1.0.0</div>
    </div>
  );
}

function ToggleOption({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <div>
        <div className="text-sm text-gray-700 dark:text-gray-300">{label}</div>
        <div className="text-xs text-gray-400">{description}</div>
      </div>
      <div
        className={`relative w-10 h-5 rounded-full transition-colors ${
          checked ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
        }`}
        onClick={() => onChange(!checked)}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </div>
    </label>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="text-gray-400">{label}</div>
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{value}</div>
    </div>
  );
}
