import {
  ActiveStateEventInfoDto,
  AutoTagEventInfoDto,
  CalendarEventDto,
  ProgramEventInfoDto,
  TagEventInfoDto,
  TimelineDto,
  TimelineEventDto,
} from '../../../generated/api/requests';
import {
  ACTIVE_COLOR,
  COLOR_LIST,
  INACTIVE_COLOR,
} from '../../../views/TimelinesPage/TimelinesPage.consts';
import { stringToColorIndex } from '../../../helpers/string-to-color-index';
import { TimelineType } from '../Timeline.types';

const getColorFromString = (text: string): string => {
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
  }
  return getColorFromString(timelineInfo.title);
}
