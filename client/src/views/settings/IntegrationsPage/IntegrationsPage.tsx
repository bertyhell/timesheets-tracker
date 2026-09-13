import React from 'react';
import './IntegrationsPage.css';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import Button, { ButtonVariant } from '../../../components/Button/Button';
import { Dropdown } from '../../../components/Dropdown/Dropdown';
import { integrationsApi } from '../../../api/integrations';
import productiveLogo from '../../../assets/integrations/productive.svg';
import jiraLogo from '../../../assets/integrations/jira.svg';
import excelCsvLogo from '../../../assets/integrations/excel-csv.svg';

// Adding an integration is this entry plus its own settings page — everything below is driven off
// this list rather than off the integration name.
const INTEGRATION_TYPES = [
  {
    value: 'productive',
    label: 'Productive',
    path: '/settings/integrations/productive',
    logo: productiveLogo,
  },
  { value: 'jira', label: 'Jira', path: '/settings/integrations/jira', logo: jiraLogo },
  {
    value: 'excel-csv',
    label: 'Excel CSV',
    path: '/settings/integrations/excel-csv',
    logo: excelCsvLogo,
    // A local file export has no endpoint, so the card shows what it does instead of a host.
    subtitle: 'Export to a file on this computer',
  },
] as const;

export function IntegrationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const integrationQueries = useQueries({
    queries: INTEGRATION_TYPES.map(({ value }) => ({
      queryKey: ['integrations', value],
      queryFn: () => integrationsApi.findOne(value),
    })),
  });

  const isLoading = integrationQueries.some((query) => query.isLoading);

  const deleteMutation = useMutation({
    mutationFn: (type: string) => integrationsApi.remove(type),
    onSuccess: (_, type) => {
      queryClient.invalidateQueries({ queryKey: ['integrations', type] });
      toast('Integration removed', { type: 'success' });
    },
    onError: () => toast('Failed to remove integration', { type: 'error' }),
  });

  const integrations = INTEGRATION_TYPES.map((integrationType, index) => ({
    ...integrationType,
    // Credential-backed integrations identify themselves by host; one without an endpoint falls
    // back to the static subtitle on its entry.
    subtitle:
      ('subtitle' in integrationType ? integrationType.subtitle : '') ||
      integrationQueries[index].data?.baseUrl ||
      '',
    isConfigured: !!integrationQueries[index].data,
  }));

  const configuredTypes = integrations.filter(({ isConfigured }) => isConfigured);
  const unconfiguredTypes = integrations.filter(({ isConfigured }) => !isConfigured);

  return (
    <div className="p-integrations-settings">
      <PageHeader
        title="Integrations"
        description="Connect external services to Timesheet Tracker."
      />

      <div className="px-6 mt-4 max-w-2xl">
        {isLoading ? null : (
          <>
            {configuredTypes.length > 0 && (
              <div className="flex flex-col gap-3 mb-6">
                {configuredTypes.map(({ value, label, path, subtitle, logo }) => (
                  <div key={value} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={logo} alt="" className="m-integrations__logo" />
                        <div>
                          <p className="font-semibold text-sm">{label}</p>
                          <p className="text-gray-500" style={{ fontSize: '0.8em' }}>
                            {subtitle}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant={ButtonVariant.Secondary}
                          icon={<Pencil size={14} />}
                          onClick={() => navigate(path)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant={ButtonVariant.Secondary}
                          icon={<Trash2 size={14} />}
                          onClick={() => deleteMutation.mutate(value)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {unconfiguredTypes.length > 0 && (
              <Dropdown label={<><Plus size={14} />Add integration</>}>
                {(close) => (
                  <>
                    {unconfiguredTypes.map(({ value, label, path, logo }) => (
                      <button
                        key={value}
                        className="m-integrations-dropdown__item"
                        onClick={() => { navigate(path); close(); }}
                      >
                        <img src={logo} alt="" className="m-integrations__logo" />
                        {label}
                      </button>
                    ))}
                  </>
                )}
              </Dropdown>
            )}
          </>
        )}
      </div>
    </div>
  );
}
