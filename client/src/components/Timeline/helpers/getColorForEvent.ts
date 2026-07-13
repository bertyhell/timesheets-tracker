import {
  ActiveStateEventInfoDto,
  AutoTagEventInfoDto,
  CalendarEventDto,
  ProgramEventInfoDto,
  TagEventInfoDto,
  TimelineDto,
  TimelineEventDto,
} from '../../../generated/api/types.gen';
import { stringToColorIndex } from '../../../helpers/string-to-color-index';
import { TimelineType } from '../Timeline.types';

export const COLOR_LIST = [
  '#4a7c7c',
  '#8b4a4a',
  '#4a4a8b',
  '#3a7a4a',
  '#b09070',
  '#a05050',
  '#4a9fa0',
  '#b08030',
  '#a0a030',
  '#4a9a5a',
  '#5060b0',
  '#a050a0',
  '#5080c0',
  '#9070a0',
  '#b05080',
  '#70a878',
];

export const ACTIVE_COLOR = '#4caf50';
export const INACTIVE_COLOR = '#f44336';

export const getRandomColor = (): string =>
  COLOR_LIST[Math.floor(Math.random() * COLOR_LIST.length)];

export const getColorFromString = (text: string | undefined): string => {
  if (!text) return '#ffffff';
  return COLOR_LIST[stringToColorIndex(text, COLOR_LIST.length)];
};

export function getColorForEvent(timelineInfo: TimelineDto, event: TimelineEventDto) {
  switch (timelineInfo.timelineType) {
    case TimelineType.Program:
      return getColorFromString((event.info as ProgramEventInfoDto)?.programName);

    case TimelineType.Website: {
      const parsedUrl = new URL((event.info as any)?.websiteUrl);
      return getColorFromString(parsedUrl.hostname);
    }

    case TimelineType.Tag: {
      return (event.info as TagEventInfoDto).tagNameColor;
    }

    case TimelineType.AutoTag: {
      return (event.info as AutoTagEventInfoDto).tagNameColor;
    }

    case TimelineType.Calendar: {
      return getColorFromString((event.info as CalendarEventDto)?.summary);
    }

    case TimelineType.ActiveState: {
      return (event.info as ActiveStateEventInfoDto).isActive ? ACTIVE_COLOR : INACTIVE_COLOR;
    }

    case TimelineType.GitCommit: {
      return getColorFromString((event.info as { repoName?: string })?.repoName);
    }
  }
  return getColorFromString(timelineInfo.title);
}
