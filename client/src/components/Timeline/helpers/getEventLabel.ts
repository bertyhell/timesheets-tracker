import type { TimelineDto, TimelineEventDto } from '../../../generated/api/types.gen';
import { TimelineType } from '../Timeline.types';

export function getEventLabel(timelineInfo: TimelineDto, event: TimelineEventDto): string {
  const info = event.info as Record<string, string | number | boolean>;
  switch (timelineInfo.timelineType) {
    case TimelineType.Program:
      return String(info['programName'] ?? info['windowTitle'] ?? '');
    case TimelineType.Website:
      return String(info['websiteTitle'] ?? info['websiteUrl'] ?? '');
    case TimelineType.Tag:
    case TimelineType.AutoTag:
      return String(info['tagNameName'] ?? info['name'] ?? '');
    case TimelineType.Calendar:
      return String(info['summary'] ?? '');
    case TimelineType.ActiveState:
      return info['isActive'] ? 'Active' : 'Inactive';
    default:
      return timelineInfo.title ?? '';
  }
}
