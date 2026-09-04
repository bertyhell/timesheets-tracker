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
      return String(info['tagNameName'] ?? info['tagNameTitle'] ?? info['name'] ?? '');
    case TimelineType.Calendar:
      return String(info['summary'] ?? '');
    case TimelineType.ActiveState:
      return info['isActive'] ? 'Active' : 'Inactive';
    case TimelineType.GitCommit:
      return String(info['repoName'] ?? timelineInfo.title ?? '');
    case TimelineType.Productive: {
      // deal - service - company, skipping whichever parts Productive did not return
      const parts = [info['dealName'], info['serviceName'], info['companyName']]
        .filter(Boolean)
        .map(String);
      const label = parts.join(' - ');
      const note = String(info['tagNameName'] ?? '');
      return note && note !== 'Unnamed booking' ? `${label}: ${note}` : label;
    }
    default:
      return timelineInfo.title ?? '';
  }
}
