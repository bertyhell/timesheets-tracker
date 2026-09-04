import type { OverviewFlatRowDto } from '../../../../api/overviews';
import { OverviewSourceType } from '../../../../types/types';
import {
  ACTIVE_COLOR,
  getColorFromString,
  INACTIVE_COLOR,
} from '../../../../components/Timeline/helpers/getColorForEvent';
import { Dimension } from '../report.types';

export const DIMENSION_LABELS: Record<Dimension, string> = {
  [Dimension.TagName]: 'Tag',
  [Dimension.TagCode]: 'Tag code',
  [Dimension.ProgramName]: 'Program',
  [Dimension.WindowTitle]: 'Window title',
  [Dimension.WebsiteDomain]: 'Website domain',
  [Dimension.WebsiteTitle]: 'Page title',
  [Dimension.ActiveState]: 'Active state',
  [Dimension.AutoTagTitle]: 'Auto-tag rule',
  [Dimension.AutoTagTagName]: 'Resulting tag',
};

/** Which timeline the dimension's values come from, and therefore what has to be fetched. */
export const DIMENSION_SOURCE_TYPE: Record<Dimension, OverviewSourceType> = {
  [Dimension.TagName]: OverviewSourceType.Tag,
  [Dimension.TagCode]: OverviewSourceType.Tag,
  [Dimension.ProgramName]: OverviewSourceType.Program,
  [Dimension.WindowTitle]: OverviewSourceType.Program,
  [Dimension.WebsiteDomain]: OverviewSourceType.Website,
  [Dimension.WebsiteTitle]: OverviewSourceType.Website,
  [Dimension.ActiveState]: OverviewSourceType.ActiveState,
  [Dimension.AutoTagTitle]: OverviewSourceType.AutoTag,
  [Dimension.AutoTagTagName]: OverviewSourceType.AutoTag,
};

const UNKNOWN_LABEL = 'Unknown';

export function getDimensionValue(row: OverviewFlatRowDto, dimension: Dimension): string {
  switch (dimension) {
    case Dimension.TagName:
      return row.tagName || UNKNOWN_LABEL;
    case Dimension.TagCode:
      return row.tagCode || 'No code';
    case Dimension.ProgramName:
      return row.programName || UNKNOWN_LABEL;
    case Dimension.WindowTitle:
      return row.windowTitle || UNKNOWN_LABEL;
    case Dimension.WebsiteDomain:
      return row.websiteDomain || UNKNOWN_LABEL;
    case Dimension.WebsiteTitle:
      return row.websiteTitle || UNKNOWN_LABEL;
    case Dimension.ActiveState:
      return row.activeState || UNKNOWN_LABEL;
    case Dimension.AutoTagTitle:
      return row.autoTagTitle || UNKNOWN_LABEL;
    case Dimension.AutoTagTagName:
      return row.tagName || UNKNOWN_LABEL;
  }
}

/**
 * Charts reuse the timeline colors: tags keep their configured color, active/inactive keep the
 * green/red of the active-state timeline, and everything else is hashed into the shared palette
 * so a program has the same color here as it has on its timeline.
 */
export function getDimensionColor(
  label: string,
  dimension: Dimension,
  rowsByLabel: Map<string, OverviewFlatRowDto>
): string | undefined {
  if (dimension === Dimension.ActiveState) {
    if (label === 'Active') return ACTIVE_COLOR;
    if (label === 'Inactive') return INACTIVE_COLOR;
  }
  if (
    dimension === Dimension.TagName ||
    dimension === Dimension.TagCode ||
    dimension === Dimension.AutoTagTagName
  ) {
    const tagColor = rowsByLabel.get(label)?.tagColor;
    if (tagColor) return tagColor;
  }
  return getColorFromString(label);
}
