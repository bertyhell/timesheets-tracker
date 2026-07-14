import React from 'react';
import './IntegrationsPage.css';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import Button, { ButtonVariant } from '../../../components/Button/Button';
import { Dropdown } from '../../../components/Dropdown/Dropdown';
import { integrationsApi } from '../../../api/integrations';

const INTEGRATION_TYPES = [
  { value: 'productive', label: 'Productive', path: '/settings/integrations/productive' },
] as const;

type IntegrationTypeValue = (typeof INTEGRATION_TYPES)[number]['value'];

export function IntegrationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: productiveIntegration, isLoading } = useQuery({
    queryKey: ['integrations', 'productive'],
    queryFn: () => integrationsApi.findOne('productive'),
  });

  const deleteMutation = useMutation({
    mutationFn: (type: string) => integrationsApi.remove(type),
    onSuccess: (_, type) => {
      queryClient.invalidateQueries({ queryKey: ['integrations', type] });
      toast('Integration removed', { type: 'success' });
    },
    onError: () => toast('Failed to remove integration', { type: 'error' }),
  });

  const isConfigured = (type: IntegrationTypeValue) =>
    type === 'productive' ? !!productiveIntegration : false;

  const configuredTypes = INTEGRATION_TYPES.filter(({ value }) => isConfigured(value));
  const unconfiguredTypes = INTEGRATION_TYPES.filter(({ value }) => !isConfigured(value));

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
                {configuredTypes.map(({ value, label, path }) => (
                  <div key={value} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{label}</p>
                        <p className="text-gray-500" style={{ fontSize: '0.8em' }}>
                          {value === 'productive' ? (productiveIntegration?.baseUrl ?? '') : ''}
                        </p>
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
                    {unconfiguredTypes.map(({ value, label, path }) => (
                      <button
                        key={value}
                        className="m-integrations-dropdown__item"
                        onClick={() => { navigate(path); close(); }}
                      >
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
