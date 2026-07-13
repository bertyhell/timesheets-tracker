import { OverviewSourceType } from '../../types/types';

export const SOURCE_TYPE_OPTIONS: { value: OverviewSourceType; label: string }[] = [
  { value: OverviewSourceType.Tag, label: 'Tags' },
  { value: OverviewSourceType.Program, label: 'Programs' },
  { value: OverviewSourceType.Website, label: 'Websites' },
  { value: OverviewSourceType.ActiveState, label: 'Active state' },
];
