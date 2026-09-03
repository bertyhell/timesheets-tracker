import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  settingsControllerGetAutoMergeTagsOptions,
  settingsControllerGetAutoMergeTagsQueryKey,
  settingsControllerSetAutoMergeTagsMutation,
} from '../../../generated/api/@tanstack/react-query.gen';
import { PageHeader } from '../../../components/PageHeader/PageHeader';

/** Matches DEFAULT_AUTO_MERGE_TAGS_MINUTES on the api, used only while the setting is loading. */
const DEFAULT_MERGE_MINUTES = 5;

/** Fine grained for the first quarter of an hour, coarser after that, up to 8 hours. */
const MERGE_MINUTES_OPTIONS = [
  0,
  ...Array.from({ length: 15 }, (_, index) => index + 1),
  20,
  30,
  45,
  60,
  90,
  120,
  180,
  240,
  360,
  480,
];

function formatMergeMinutes(minutes: number): string {
  if (minutes === 0) {
    return '0 (no merge)';
  }
  if (minutes < 60) {
    return String(minutes);
  }
  const hours = minutes / 60;
  const hoursLabel = Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
  return `${minutes} (${hoursLabel} ${hours === 1 ? 'hour' : 'hours'})`;
}

export function AutoTagsSettingsPage() {
  const queryClient = useQueryClient();

  const { data: autoMergeTags } = useQuery({
    ...settingsControllerGetAutoMergeTagsOptions(),
    refetchOnMount: true,
  });

  const [minutes, setMinutes] = useState<number>(DEFAULT_MERGE_MINUTES);

  useEffect(() => {
    if (autoMergeTags?.minutes != null) setMinutes(autoMergeTags.minutes);
  }, [autoMergeTags]);

  const { mutateAsync: saveAutoMergeTags, isPending: isSaving } = useMutation({
    ...settingsControllerSetAutoMergeTagsMutation(),
  });

  const handleChange = async (newMinutes: number) => {
    setMinutes(newMinutes);
    try {
      await saveAutoMergeTags({ body: { minutes: newMinutes } });
      await queryClient.invalidateQueries({
        queryKey: settingsControllerGetAutoMergeTagsQueryKey(),
      });
      // Auto tags are recalculated server side on every events request, so refetch the timelines.
      await queryClient.invalidateQueries({
        predicate: (query) =>
          (query.queryKey[0] as { _id?: string })?._id === 'timelinesControllerFindAllEvents',
      });
      toast('Auto merge setting saved', { type: 'success' });
    } catch (err: any) {
      toast(err?.message ?? 'Failed to save auto merge setting', { type: 'error' });
      // Roll back to whatever the server still has stored.
      setMinutes(autoMergeTags?.minutes ?? DEFAULT_MERGE_MINUTES);
    }
  };

  return (
    <div className="p-auto-tags-settings">
      <PageHeader
        title="Auto tags"
        description="Configure how automatically detected tags are calculated."
      />

      <div className="px-6 mt-4 max-w-2xl">
        <section>
          <h3 className="font-semibold mb-1">Auto merge tags</h3>
          <p className="text-gray-500 mb-3" style={{ fontSize: '0.9em' }}>
            Consecutive auto tags that resolve to the same tag are merged into a single block, and the
            conditions that matched them are combined. Pick 0 to keep every auto tag separate. Changes
            are saved immediately.
          </p>

          <div className="flex gap-2 items-center">
            <span>Merge tags that are less than</span>
            <select
              className="c-input"
              style={{ width: 'auto' }}
              value={minutes}
              disabled={isSaving}
              onChange={(e) => handleChange(Number(e.target.value))}
            >
              {MERGE_MINUTES_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {formatMergeMinutes(option)}
                </option>
              ))}
            </select>
            <span>minutes apart</span>
          </div>
        </section>
      </div>
    </div>
  );
}
