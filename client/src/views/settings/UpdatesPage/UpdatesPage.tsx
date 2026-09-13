import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { AlertCircle, CheckCircle2, Download, ExternalLink, RefreshCw, RotateCw } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import Button, { ButtonVariant } from '../../../components/Button/Button';
import { appControllerStatus } from '../../../generated/api/sdk.gen';

// Electron exposes the updater over the preload bridge. Outside Electron the
// page still renders, showing the version reported by the API.
const updates = typeof window.electron?.updates?.check === 'function'
  ? window.electron.updates
  : undefined;

async function fetchApiStatus(): Promise<{ status: string; version: string } | null> {
  // The generated types leave /api/status' 200 body as `unknown` — it is the
  // { status, version } payload from AppController.
  const { data } = await appControllerStatus();
  return (data as { status: string; version: string } | undefined) ?? null;
}

export function UpdatesPage() {
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const { data: apiStatus } = useQuery({
    queryKey: ['status'],
    queryFn: fetchApiStatus,
  });

  useEffect(() => {
    if (!updates) return;

    updates.getStatus().then(setStatus);
    return updates.onStatus(setStatus);
  }, []);

  const currentVersion = status?.currentVersion ?? apiStatus?.version ?? null;
  const state = status?.state ?? 'unsupported';

  const check = async () => {
    if (!updates) return;
    setIsChecking(true);
    try {
      const next = await updates.check();
      setStatus(next);
      if (next.state === 'idle') {
        toast(`You're running the latest version (${next.currentVersion}).`, { type: 'success' });
      }
    } finally {
      setIsChecking(false);
    }
  };

  const download = async () => {
    if (!updates) return;
    setStatus(await updates.download());
  };

  const install = async () => {
    if (!updates) return;
    await updates.install();
  };

  return (
    <div className="p-updates-settings">
      <PageHeader title="Updates" description="Check for and install new versions of the app." />

      <div className="px-6 mt-4 max-w-2xl flex flex-col gap-3">
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-sm">Current version</p>
              <p className="text-gray-500" style={{ fontSize: '0.8em' }}>
                {currentVersion ?? 'Unknown'}
              </p>
            </div>

            <div className="flex gap-2">
              {updates && (
                <Button
                  variant={ButtonVariant.Secondary}
                  icon={<RefreshCw size={14} className={isChecking ? 'animate-spin' : undefined} />}
                  disabled={isChecking || state === 'downloading'}
                  onClick={check}
                >
                  {isChecking ? 'Checking…' : 'Check for new versions'}
                </Button>
              )}
              <a
                href="https://github.com/bertyhell/timesheets-tracker/releases"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant={ButtonVariant.Secondary} icon={<ExternalLink size={14} />}>
                  Release notes
                </Button>
              </a>
            </div>
          </div>
        </div>

        {!updates && (
          <p className="text-gray-500" style={{ fontSize: '0.8em' }}>
            Automatic updates are only available in the desktop app.
          </p>
        )}

        {state === 'unsupported' && updates && (
          <p className="text-gray-500" style={{ fontSize: '0.8em' }}>
            Automatic updates are disabled in development builds.
          </p>
        )}

        {state === 'idle' && status?.availableVersion === null && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <CheckCircle2 size={16} />
            <span>You're up to date.</span>
          </div>
        )}

        {state === 'available' && status?.availableVersion && (
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-sm">Version {status.availableVersion} available</p>
                <p className="text-gray-500" style={{ fontSize: '0.8em' }}>
                  The update is downloaded and installed automatically.
                </p>
              </div>
              <Button icon={<Download size={14} />} onClick={download}>
                Update to version {status.availableVersion}
              </Button>
            </div>
          </div>
        )}

        {state === 'downloading' && (
          <div className="border border-gray-200 rounded-lg p-6">
            <p className="font-semibold text-sm">
              Downloading version {status?.availableVersion ?? ''}…
            </p>
            <div className="mt-3 h-2 w-full rounded bg-[var(--gray-200)] overflow-hidden">
              <div
                className="h-full bg-[var(--primary-0)] transition-all duration-150"
                style={{ width: `${status?.percent ?? 0}%` }}
              />
            </div>
            <p className="text-gray-500 mt-2" style={{ fontSize: '0.8em' }}>
              {status?.percent ?? 0}%
            </p>
          </div>
        )}

        {state === 'downloaded' && (
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-sm">
                  Version {status?.availableVersion} is ready to install
                </p>
                <p className="text-gray-500" style={{ fontSize: '0.8em' }}>
                  Restart now, or it will be applied the next time you quit the app.
                </p>
              </div>
              <Button icon={<RotateCw size={14} />} onClick={install}>
                Restart and install
              </Button>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="flex items-start gap-2 text-sm text-red-600">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{status?.error ?? 'Update check failed.'}</span>
          </div>
        )}
      </div>
    </div>
  );
}
