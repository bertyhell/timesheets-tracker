import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Clipboard, ClipboardCheck, Eye, EyeOff } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import Button, { ButtonVariant } from '../../../components/Button/Button';
import { integrationsApi, type UpsertIntegrationPayload } from '../../../api/integrations';
import { jiraControllerTestConnection } from '../../../generated/api/sdk.gen';

const INTEGRATION_TYPE = 'jira';

const API_TOKEN_URL = 'https://id.atlassian.com/manage-profile/security/api-tokens';

interface FormState {
  baseUrl: string;
  userId: string;
  token: string;
}

export function JiraSettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<FormState>({ baseUrl: '', userId: '', token: '' });
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
      setForm({ baseUrl: existing.baseUrl, userId: existing.userId, token: existing.token });
    }
  }, [existing]);

  // Jira has no organisation id, but the integrations table is shared with Productive and requires
  // the column, so it is stored empty.
  const toPayload = (state: FormState): UpsertIntegrationPayload => ({
    baseUrl: state.baseUrl,
    organisationId: '',
    userId: state.userId,
    token: state.token,
  });

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

  // The connection is tested against what is saved, so the form is stored first — otherwise the
  // button would report on the previous credentials while showing the new ones.
  const testMutation = useMutation({
    mutationFn: async () => {
      await integrationsApi.upsert(INTEGRATION_TYPE, toPayload(form));
      const { data } = await jiraControllerTestConnection();
      return data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['integrations', INTEGRATION_TYPE] });
      if (result?.ok) {
        toast(`Connected to Jira as ${result.displayName ?? 'your account'}`, { type: 'success' });
      } else {
        toast(result?.error ?? 'Could not reach Jira', { type: 'error' });
      }
    },
    onError: () => toast('Could not reach Jira', { type: 'error' }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertMutation.mutate(toPayload(form));
  };

  const isComplete = !!form.baseUrl && !!form.userId && !!form.token;

  if (isLoading) return null;

  return (
    <div className="p-jira-settings">
      <PageHeader
        title="Jira"
        description="Pull ticket info for the Jira tickets you visit, so you can tag time by project, sprint or label."
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
                placeholder="https://your-org.atlassian.net"
                value={form.baseUrl}
                onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                className="c-input w-full"
                type="email"
                required
                placeholder="you@example.com"
                value={form.userId}
                onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium">API token</label>
                <a
                  href={API_TOKEN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline"
                >
                  create an API token
                </a>
              </div>
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
              <p className="text-gray-500 mt-2" style={{ fontSize: '0.8em' }}>
                An Atlassian API token carries the same permissions as your account — Atlassian has
                no read-only variant. Timesheet Tracker only ever reads from Jira.
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button
              variant={ButtonVariant.Primary}
              type="submit"
              disabled={upsertMutation.isPending}
            >
              {upsertMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
            <Button
              variant={ButtonVariant.Secondary}
              type="button"
              disabled={!isComplete || testMutation.isPending}
              onClick={() => testMutation.mutate()}
            >
              {testMutation.isPending ? 'Testing…' : 'Test connection'}
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
