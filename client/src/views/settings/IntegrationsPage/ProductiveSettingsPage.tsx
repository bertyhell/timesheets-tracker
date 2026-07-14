import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Clipboard, ClipboardCheck, Eye, EyeOff } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import Button, { ButtonVariant } from '../../../components/Button/Button';
import { integrationsApi, type UpsertIntegrationPayload } from '../../../api/integrations';

const INTEGRATION_TYPE = 'productive';

interface FormState {
  baseUrl: string;
  organisationId: string;
  userId: string;
  token: string;
}

export function ProductiveSettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<FormState>({ baseUrl: 'https://api.productive.io', organisationId: '', userId: '', token: '' });
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyToken = () => {
    navigator.clipboard.writeText(form.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast('Token copied to clipboard', { type: 'success' });
  };

  const { data: existing, isLoading } = useQuery({
    queryKey: ['integrations', INTEGRATION_TYPE],
    queryFn: () => integrationsApi.findOne(INTEGRATION_TYPE),
  });

  useEffect(() => {
    if (existing) {
      setForm({ baseUrl: existing.baseUrl, organisationId: existing.organisationId, userId: existing.userId, token: existing.token });
    }
  }, [existing]);

  const upsertMutation = useMutation({
    mutationFn: (payload: UpsertIntegrationPayload) =>
      integrationsApi.upsert(INTEGRATION_TYPE, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', INTEGRATION_TYPE] });
      toast('Integration saved', { type: 'success' });
      navigate('/settings/integrations');
    },
    onError: () => toast('Failed to save integration', { type: 'error' }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertMutation.mutate(form);
  };

  if (isLoading) return null;

  return (
    <div className="p-productive-settings">
      <PageHeader
        title="Productive"
        description="Configure the Productive integration."
      />

      <div className="px-6 mt-4 max-w-2xl">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Base URL</label>
              <input
                className="c-input w-full"
                type="url"
                required
                placeholder="https://api.productive.io"
                value={form.baseUrl}
                onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Organisation ID</label>
              <input
                className="c-input w-full"
                type="text"
                required
                placeholder="12345"
                value={form.organisationId}
                onChange={(e) => setForm((f) => ({ ...f, organisationId: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">User ID</label>
              <input
                className="c-input w-full"
                type="text"
                required
                placeholder="67890"
                value={form.userId}
                onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Token</label>
              <div className="flex gap-2">
                <input
                  className="c-input flex-1"
                  type={showToken ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={form.token}
                  onChange={(e) => setForm((f) => ({ ...f, token: e.target.value }))}
                />
                <button
                  type="button"
                  className="c-input px-3"
                  style={{ width: 'auto', flexShrink: 0 }}
                  onClick={() => setShowToken((v) => !v)}
                  title={showToken ? 'Hide token' : 'Show token'}
                >
                  {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button
                  type="button"
                  className="c-input px-3"
                  style={{ width: 'auto', flexShrink: 0 }}
                  onClick={handleCopyToken}
                  title={copied ? 'Copied!' : 'Copy token'}
                  disabled={!form.token}
                >
                  {copied ? <ClipboardCheck size={16} /> : <Clipboard size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button variant={ButtonVariant.Primary} type="submit" disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
            <Button
              variant={ButtonVariant.Secondary}
              type="button"
              onClick={() => navigate('/settings/integrations')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
