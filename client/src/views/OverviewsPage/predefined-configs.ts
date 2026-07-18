import { type LucideIcon, Tag, BarChart2, Zap, Globe } from 'lucide-react';
import { DateRangeMode, OverviewSourceType } from '../../types/types';

export interface PredefinedOverviewConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  dateRangeMode: DateRangeMode;
  sourceTypes: OverviewSourceType[];
  pivotState: Record<string, any>;
}

const BASE_PIVOT_STATE = {
  aggregatorName: 'Sum',
  rendererName: 'Table',
  valueFilter: {},
  sorters: {},
  derivedAttributes: {},
};

export const PREDEFINED_OVERVIEW_CONFIGS: PredefinedOverviewConfig[] = [
  {
    id: 'hours-per-tag-month',
    label: 'Hours per Tag — This Month',
    icon: Tag,
    dateRangeMode: DateRangeMode.ThisMonth,
    sourceTypes: [OverviewSourceType.Tag],
    pivotState: { ...BASE_PIVOT_STATE, rows: ['tagName'], cols: ['week'], vals: ['durationHours'] },
  },
  {
    id: 'most-used-programs-month',
    label: 'Most Used Programs — This Month',
    icon: BarChart2,
    dateRangeMode: DateRangeMode.ThisMonth,
    sourceTypes: [OverviewSourceType.Program],
    pivotState: {
      ...BASE_PIVOT_STATE,
      rendererName: 'Multiple Pie Chart',
      rows: ['programName'],
      cols: [],
      vals: ['durationHours'],
      rowOrder: 'value_z_to_a',
    },
  },
  {
    id: 'active-vs-inactive-week',
    label: 'Active vs Inactive Time — This Week',
    icon: Zap,
    dateRangeMode: DateRangeMode.ThisWeek,
    sourceTypes: [OverviewSourceType.ActiveState],
    pivotState: { ...BASE_PIVOT_STATE, rows: ['activeState'], cols: ['date'], vals: ['durationHours'] },
  },
  {
    id: 'website-usage-month',
    label: 'Website Usage — This Month',
    icon: Globe,
    dateRangeMode: DateRangeMode.ThisMonth,
    sourceTypes: [OverviewSourceType.Website],
    pivotState: { ...BASE_PIVOT_STATE, rows: ['websiteDomain'], cols: [], vals: ['durationHours'] },
  },
];
