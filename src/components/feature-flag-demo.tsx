'use client';

import { useFeatureFlag, useFeatureFlags } from '@/lib/feature-flags';

export function FeatureFlagDemo() {
  const { flags, isLoading } = useFeatureFlags();
  const newDashboard = useFeatureFlag('new-dashboard');
  const darkMode = useFeatureFlag('dark-mode');
  const aiAssistant = useFeatureFlag('ai-assistant');

  if (isLoading) {
    return <div className="p-4">Loading feature flags...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h2 className="mb-6 text-2xl font-bold">Feature Flag Demo</h2>

      <div className="space-y-4">
        <div className="rounded-lg border p-4">
          <h3 className="mb-2 font-semibold">New Dashboard</h3>
          <p className="mb-2 text-sm text-gray-600">
            Status: {newDashboard.isEnabled ? '✅ Enabled' : '❌ Disabled'}
          </p>
          {newDashboard.isEnabled && (
            <div className="rounded border-l-4 border-blue-400 bg-blue-50 p-3">
              🎉 You&apos;re seeing the new dashboard experience!
            </div>
          )}
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="mb-2 font-semibold">Dark Mode</h3>
          <p className="mb-2 text-sm text-gray-600">
            Status: {darkMode.isEnabled ? '✅ Enabled' : '❌ Disabled'}
          </p>
          {darkMode.isEnabled && (
            <div className="rounded bg-gray-800 p-3 text-white">
              🌙 Dark mode is available!
            </div>
          )}
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="mb-2 font-semibold">AI Assistant</h3>
          <p className="mb-2 text-sm text-gray-600">
            Status: {aiAssistant.isEnabled ? '✅ Enabled' : '❌ Disabled'}
          </p>
          {aiAssistant.isEnabled && (
            <div className="rounded border-l-4 border-purple-400 bg-purple-50 p-3">
              🤖 AI Assistant is ready to help!
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="mb-4 font-semibold">All Feature Flags</h3>
        <div className="rounded-lg bg-gray-50 p-4">
          <pre className="overflow-x-auto text-sm">
            {JSON.stringify(flags, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
