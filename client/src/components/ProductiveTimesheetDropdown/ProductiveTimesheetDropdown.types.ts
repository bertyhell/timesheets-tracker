import type { ProductiveServiceTreeNode } from '../../api/productive';

/** What the dropdown emits when a service leaf is picked. */
export interface ProductiveServiceSelection {
  serviceId: string;
  /** Ancestor ids, kept so the existing tag-name `code` shape stays intact. */
  companyId: string;
  projectId: string;
  dealId: string;
  /** `[company, project, budget, service]` labels, for the trigger label. */
  parts: string[];
  /** `Company · Project · Budget · Service`, for the trigger label. */
  path: string;
}

export interface ProductiveTimesheetDropdownProps {
  /** yyyy-MM-dd — only services bookable on this date are offered. */
  date: string;
  /** Currently selected service id, or '' for nothing selected. */
  value: string;
  /**
   * Previously stored path for `value`, used as the trigger label while the
   * service tree loads or when the service is no longer part of that tree.
   */
  valuePath?: string;
  /**
   * Stored label parts for `value` (`[company, project, budget, service]`),
   * preferred over `valuePath` because it renders on two lines.
   */
  valueParts?: string[];
  onChange: (selection: ProductiveServiceSelection | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

export type TreeNode = ProductiveServiceTreeNode;
