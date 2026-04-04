export enum TimelineType {
  Program = 'Program',
  Website = 'Website',
  Tag = 'Tag',
  AutoTag = 'AutoTag',
  Active = 'Active',
  Calendar = 'Calendar',
}

export interface TimelineEvent {
  id?: string;
  info: Record<string, string>;
  color: string;
  startedAt: Date;
  endedAt: Date;
  type: TimelineType;
}
