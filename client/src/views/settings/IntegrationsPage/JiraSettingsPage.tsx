import React, { useEffect, useState } from 'react';
import './JiraSettingsPage.css';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Clipboard, ClipboardCheck, Eye, EyeOff, InfoIcon } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import Button, { ButtonVariant } from '../../../components/Button/Button';
import Tooltip from '../../../components/Tooltip/Tooltip';
import { integrationsApi, type UpsertIntegrationPayload } from '../../../api/integrations';
import { jiraControllerTestConnection } from '../../../generated/api/sdk.gen';

const INTEGRATION_TYPE = 'jira';

const API_TOKEN_URL = 'https://id.atlassian.com/manage-profile/security/api-tokens';

/**
 * The two GET requests this integration makes, and the scopes Jira demands for each.
 *
 * Jira enforces a whole set per endpoint rather than one scope per field, so the lists below are
 * wider than what this integration reads — `read:avatar:jira` is required to read an issue even
 * though no avatar is ever requested, for instance. They are taken from the `Beta` (granular) scope
 * sets in Atlassian's own OpenAPI description of the Jira Cloud platform REST API; leaving any one
 * of them unticked makes the whole request fail with `401 — scope does not match`.
 */
const SCOPE_GROUPS = [
  {
    request: 'The field list',
    reason: 'to find which custom field this Jira site uses for Sprint. Also tests the connection.',
    scopes: [
      'read:field:jira',
      'read:field-configuration:jira',
      'read:project:jira',
      'read:project-category:jira',
      'read:avatar:jira',
    ],
  },
  {
    request: 'The tickets you visit',
    reason: 'summary, labels, fix version, project, status, assignee and the rest.',
    scopes: [
      'read:issue:jira',
      'read:issue-meta:jira',
      'read:issue-security-level:jira',
      'read:issue.changelog:jira',
      'read:issue.vote:jira',
      'read:status:jira',
      'read:user:jira',
      'read:field-configuration:jira',
      'read:avatar:jira',
    ],
  },
] as const;

/** Every scope to tick, each listed once, in the order the groups above introduce them. */
const REQUIRED_SCOPES = [...new Set(SCOPE_GROUPS.flatMap(({ scopes }) => scopes))];

const SCOPES_EXPLANATION = (
  <div>
    <p>
      When Atlassian asks, choose <strong>Create API token with scopes</strong>, pick{' '}
      <strong>Jira</strong> as the app, and tick all {REQUIRED_SCOPES.length}:
    </p>
    <ul className="p-jira-settings__scopes">
      {SCOPE_GROUPS.map(({ request, reason, scopes }) => (
        <li key={request}>
          <span className="p-jira-settings__scope-reason">
            <strong>{request}</strong> — {reason}
          </span>
          <span className="p-jira-settings__scope-names">
            {scopes.map((scope) => (
              <code key={scope}>{scope}</code>
            ))}
          </span>
        </li>
      ))}
    </ul>
    <p className="p-jira-settings__scope-legend">
      Jira asks for more than it hands over: reading an issue requires the avatar and changelog
      scopes even though neither is ever requested here. They are all read scopes, and Jira enforces
      them — so this token cannot change anything in your Jira, no matter what Timesheet Tracker
      does. A token created <em>without</em> scopes carries every permission your own account has,
      including write.
    </p>
  </div>
);

const SCOPES_ARIA_LABEL = `Create the token with scopes, pick Jira as the app, and tick all ${REQUIRED_SCOPES.length}: ${REQUIRED_SCOPES.join(', ')}. They are all read-only and enforced by Jira.`;

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
  const [copiedScopes, setCopiedScopes] = useState(false);

  // Atlassian has no way to pre-tick scopes from a link, so they have to be ticked by hand on the
  // token page — copying the list makes that a matter of reading down it rather than retyping.
  const handleCopyScopes = () => {
    navigator.clipboard.writeText(REQUIRED_SCOPES.join('\n'));
    setCopiedScopes(true);
    setTimeout(() => setCopiedScopes(false), 2000);
    toast('Scopes copied to clipboard', { type: 'success' });
  };

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
        // A warning still means the credentials work, so it is not an error — but it is the only
        // hint that the check did not cover everything, so it must not be swallowed by a plain
        // success message either.
        toast(result.warning ?? 'Connected to Jira', {
          type: result.warning ? 'warning' : 'success',
        });
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
                <div className="flex items-center gap-1.5">
                  <label className="block text-sm font-medium">Scoped API token</label>
                  <Tooltip
                    content={SCOPES_EXPLANATION}
                    placement="top"
                    className="p-jira-settings__tooltip"
                  >
                    <span
                      className="p-jira-settings__info"
                      tabIndex={0}
                      role="img"
                      aria-label={SCOPES_ARIA_LABEL}
                    >
                      <InfoIcon size={14} />
                    </span>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="p-jira-settings__copy-scopes"
                    onClick={handleCopyScopes}
                  >
                    {copiedScopes ? <ClipboardCheck size={13} /> : <Clipboard size={13} />}
                    copy the {REQUIRED_SCOPES.length} scopes
                  </button>
                  <a
                    href={API_TOKEN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline"
                  >
                    create a scoped token
                  </a>
                </div>
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
