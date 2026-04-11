// generated with @7nohe/openapi-react-query-codegen@1.3.0 

import { UseQueryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ActiveStatesService, AutoNotesService, AutoTagsService, CalendarsService, ProgramsService, StatusService, TagNamesService, TagsService, TimelinesService, WebsitesService } from "../requests/services.gen";
import * as Common from "./common";
/**
* @returns unknown
* @throws ApiError
*/
export const useStatusServiceAppControllerStatusSuspense = <TData = Common.StatusServiceAppControllerStatusDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>(queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useSuspenseQuery<TData, TError>({ queryKey: Common.UseStatusServiceAppControllerStatusKeyFn(), queryFn: () => StatusService.appControllerStatus() as TData, ...options });
/**
* @param data The data for the request.
* @param data.startedAt
* @param data.endedAt
* @returns ResponseProgramDto Get a list of all programs
* @throws ApiError
*/
export const useProgramsServiceProgramsControllerFindAllSuspense = <TData = Common.ProgramsServiceProgramsControllerFindAllDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ endedAt, startedAt }: {
  endedAt: string;
  startedAt: string;
}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useSuspenseQuery<TData, TError>({ queryKey: Common.UseProgramsServiceProgramsControllerFindAllKeyFn({ endedAt, startedAt }, queryKey), queryFn: () => ProgramsService.programsControllerFindAll({ endedAt, startedAt }) as TData, ...options });
/**
* @param data The data for the request.
* @param data.id
* @returns unknown
* @throws ApiError
*/
export const useProgramsServiceProgramsControllerFindOneSuspense = <TData = Common.ProgramsServiceProgramsControllerFindOneDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ id }: {
  id: string;
}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useSuspenseQuery<TData, TError>({ queryKey: Common.UseProgramsServiceProgramsControllerFindOneKeyFn({ id }, queryKey), queryFn: () => ProgramsService.programsControllerFindOne({ id }) as TData, ...options });
/**
* @param data The data for the request.
* @param data.startedAt
* @param data.endedAt
* @returns ResponseActiveStateDto Get a list of all active states
* @throws ApiError
*/
export const useActiveStatesServiceActiveStatesControllerFindAllSuspense = <TData = Common.ActiveStatesServiceActiveStatesControllerFindAllDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ endedAt, startedAt }: {
  endedAt: string;
  startedAt: string;
}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useSuspenseQuery<TData, TError>({ queryKey: Common.UseActiveStatesServiceActiveStatesControllerFindAllKeyFn({ endedAt, startedAt }, queryKey), queryFn: () => ActiveStatesService.activeStatesControllerFindAll({ endedAt, startedAt }) as TData, ...options });
/**
* @param data The data for the request.
* @param data.id
* @returns unknown
* @throws ApiError
*/
export const useActiveStatesServiceActiveStatesControllerFindOneSuspense = <TData = Common.ActiveStatesServiceActiveStatesControllerFindOneDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ id }: {
  id: string;
}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useSuspenseQuery<TData, TError>({ queryKey: Common.UseActiveStatesServiceActiveStatesControllerFindOneKeyFn({ id }, queryKey), queryFn: () => ActiveStatesService.activeStatesControllerFindOne({ id }) as TData, ...options });
/**
* @param data The data for the request.
* @param data.startedAt
* @param data.endedAt
* @returns TagDto Get all tag entries filtered by date
* @throws ApiError
*/
export const useTagsServiceTagsControllerFindAllSuspense = <TData = Common.TagsServiceTagsControllerFindAllDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ endedAt, startedAt }: {
  endedAt: string;
  startedAt: string;
}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useSuspenseQuery<TData, TError>({ queryKey: Common.UseTagsServiceTagsControllerFindAllKeyFn({ endedAt, startedAt }, queryKey), queryFn: () => TagsService.tagsControllerFindAll({ endedAt, startedAt }) as TData, ...options });
/**
* @param data The data for the request.
* @param data.id
* @returns unknown
* @throws ApiError
*/
export const useTagsServiceTagsControllerFindOneSuspense = <TData = Common.TagsServiceTagsControllerFindOneDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ id }: {
  id: string;
}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useSuspenseQuery<TData, TError>({ queryKey: Common.UseTagsServiceTagsControllerFindOneKeyFn({ id }, queryKey), queryFn: () => TagsService.tagsControllerFindOne({ id }) as TData, ...options });
/**
* @param data The data for the request.
* @param data.term
* @returns TagNameDto Get tag name entries optionally filtered by name
* @throws ApiError
*/
export const useTagNamesServiceTagNamesControllerFindAllSuspense = <TData = Common.TagNamesServiceTagNamesControllerFindAllDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ term }: {
  term?: string;
} = {}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useSuspenseQuery<TData, TError>({ queryKey: Common.UseTagNamesServiceTagNamesControllerFindAllKeyFn({ term }, queryKey), queryFn: () => TagNamesService.tagNamesControllerFindAll({ term }) as TData, ...options });
/**
* @returns number Count the number of tag names
* @throws ApiError
*/
export const useTagNamesServiceTagNamesControllerCountSuspense = <TData = Common.TagNamesServiceTagNamesControllerCountDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>(queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useSuspenseQuery<TData, TError>({ queryKey: Common.UseTagNamesServiceTagNamesControllerCountKeyFn(), queryFn: () => TagNamesService.tagNamesControllerCount() as TData, ...options });
/**
* @param data The data for the request.
* @param data.id
* @returns TagNameDto Get one tag name entry by id
* @throws ApiError
*/
export const useTagNamesServiceTagNamesControllerFindOneSuspense = <TData = Common.TagNamesServiceTagNamesControllerFindOneDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ id }: {
  id: string;
}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useSuspenseQuery<TData, TError>({ queryKey: Common.UseTagNamesServiceTagNamesControllerFindOneKeyFn({ id }, queryKey), queryFn: () => TagNamesService.tagNamesControllerFindOne({ id }) as TData, ...options });
/**
* @param data The data for the request.
* @param data.term
* @returns AutoTagDto Get a list of auto tags optionally filtered by a term that should occur in the name of the tag
* @throws ApiError
*/
export const useAutoTagsServiceAutoTagsControllerFindAllSuspense = <TData = Common.AutoTagsServiceAutoTagsControllerFindAllDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ term }: {
  term?: string;
} = {}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useSuspenseQuery<TData, TError>({ queryKey: Common.UseAutoTagsServiceAutoTagsControllerFindAllKeyFn({ term }, queryKey), queryFn: () => AutoTagsService.autoTagsControllerFindAll({ term }) as TData, ...options });
/**
* @returns AutoTagCountDto Returns the number of auto tags that exist
* @throws ApiError
*/
export const useAutoTagsServiceAutoTagsControllerCountSuspense = <TData = Common.AutoTagsServiceAutoTagsControllerCountDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>(queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useSuspenseQuery<TData, TError>({ queryKey: Common.UseAutoTagsServiceAutoTagsControllerCountKeyFn(), queryFn: () => AutoTagsService.autoTagsControllerCount() as TData, ...options });
/**
* @param data The data for the request.
* @param data.id
* @returns AutoTagDto Return a single auto tag by id
* @throws ApiError
*/
export const useAutoTagsServiceAutoTagsControllerFindOneSuspense = <TData = Common.AutoTagsServiceAutoTagsControllerFindOneDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ id }: {
  id: string;
}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useSuspenseQuery<TData, TError>({ queryKey: Common.UseAutoTagsServiceAutoTagsControllerFindOneKeyFn({ id }, queryKey), queryFn: () => AutoTagsService.autoTagsControllerFindOne({ id }) as TData, ...options });
/**
* @param data The data for the request.
* @param data.startedAt
* @param data.endedAt
* @returns ResponseWebsiteDto Get a list of all websites
* @throws ApiError
*/
export const useWebsitesServiceWebsitesControllerFindAllSuspense = <TData = Common.WebsitesServiceWebsitesControllerFindAllDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ endedAt, startedAt }: {
  endedAt: string;
  startedAt: string;
}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useSuspenseQuery<TData, TError>({ queryKey: Common.UseWebsitesServiceWebsitesControllerFindAllKeyFn({ endedAt, startedAt }, queryKey), queryFn: () => WebsitesService.websitesControllerFindAll({ endedAt, startedAt }) as TData, ...options });
/**
* @param data The data for the request.
* @param data.id
* @returns unknown
* @throws ApiError
*/
export const useWebsitesServiceWebsitesControllerFindOneSuspense = <TData = Common.WebsitesServiceWebsitesControllerFindOneDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ id }: {
  id: string;
}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useSuspenseQuery<TData, TError>({ queryKey: Common.UseWebsitesServiceWebsitesControllerFindOneKeyFn({ id }, queryKey), queryFn: () => WebsitesService.websitesControllerFindOne({ id }) as TData, ...options });
/**
* @param data The data for the request.
* @param data.term
* @returns AutoNoteDto Get autoNote entries optionally filtered by name
* @throws ApiError
*/
export const useAutoNotesServiceAutoNotesControllerFindAllSuspense = <TData = Common.AutoNotesServiceAutoNotesControllerFindAllDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ term }: {
  term?: string;
} = {}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useSuspenseQuery<TData, TError>({ queryKey: Common.UseAutoNotesServiceAutoNotesControllerFindAllKeyFn({ term }, queryKey), queryFn: () => AutoNotesService.autoNotesControllerFindAll({ term }) as TData, ...options });
/**
* @returns number Count the number of autoNotes
* @throws ApiError
*/
export const useAutoNotesServiceAutoNotesControllerCountSuspense = <TData = Common.AutoNotesServiceAutoNotesControllerCountDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>(queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useSuspenseQuery<TData, TError>({ queryKey: Common.UseAutoNotesServiceAutoNotesControllerCountKeyFn(), queryFn: () => AutoNotesService.autoNotesControllerCount() as TData, ...options });
/**
* @param data The data for the request.
* @param data.id
* @returns AutoNoteDto Get one autoNote entry by id
* @throws ApiError
*/
export const useAutoNotesServiceAutoNotesControllerFindOneSuspense = <TData = Common.AutoNotesServiceAutoNotesControllerFindOneDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ id }: {
  id: string;
}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useSuspenseQuery<TData, TError>({ queryKey: Common.UseAutoNotesServiceAutoNotesControllerFindOneKeyFn({ id }, queryKey), queryFn: () => AutoNotesService.autoNotesControllerFindOne({ id }) as TData, ...options });
/**
* @returns CalendarDto Get a list of all calendars
* @throws ApiError
*/
export const useCalendarsServiceCalendarsControllerFindAllSuspense = <TData = Common.CalendarsServiceCalendarsControllerFindAllDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>(queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useSuspenseQuery<TData, TError>({ queryKey: Common.UseCalendarsServiceCalendarsControllerFindAllKeyFn(), queryFn: () => CalendarsService.calendarsControllerFindAll() as TData, ...options });
/**
* @param data The data for the request.
* @param data.id
* @returns CalendarDto Return a single calendar by id
* @throws ApiError
*/
export const useCalendarsServiceCalendarsControllerFindOneSuspense = <TData = Common.CalendarsServiceCalendarsControllerFindOneDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ id }: {
  id: string;
}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useSuspenseQuery<TData, TError>({ queryKey: Common.UseCalendarsServiceCalendarsControllerFindOneKeyFn({ id }, queryKey), queryFn: () => CalendarsService.calendarsControllerFindOne({ id }) as TData, ...options });
/**
* @param data The data for the request.
* @param data.id
* @param data.startedAt Start timestamp in ISO format
* @param data.endedAt End timestamp in ISO format
* @returns CalendarEventDto Get events from a calendar for a given time range
* @throws ApiError
*/
export const useCalendarsServiceCalendarsControllerGetEventsSuspense = <TData = Common.CalendarsServiceCalendarsControllerGetEventsDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ endedAt, id, startedAt }: {
  endedAt: string;
  id: string;
  startedAt: string;
}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useSuspenseQuery<TData, TError>({ queryKey: Common.UseCalendarsServiceCalendarsControllerGetEventsKeyFn({ endedAt, id, startedAt }, queryKey), queryFn: () => CalendarsService.calendarsControllerGetEvents({ endedAt, id, startedAt }) as TData, ...options });
/**
* @param data The data for the request.
* @param data.term
* @returns TimelineDto Get a list of timelines optionally filtered by a term that should occur in the title of the timeline
* @throws ApiError
*/
export const useTimelinesServiceTimelinesControllerFindAllSuspense = <TData = Common.TimelinesServiceTimelinesControllerFindAllDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ term }: {
  term?: string;
} = {}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useSuspenseQuery<TData, TError>({ queryKey: Common.UseTimelinesServiceTimelinesControllerFindAllKeyFn({ term }, queryKey), queryFn: () => TimelinesService.timelinesControllerFindAll({ term }) as TData, ...options });
/**
* @param data The data for the request.
* @param data.startedAt
* @param data.endedAt
* @param data.term
* @param data.timelineIds
* @returns TimelineWithEventsDto Get a list of timelines with their events that happened within the specified time interval for all timelines that exist or one specific one
* @throws ApiError
*/
export const useTimelinesServiceTimelinesControllerFindAllEventsSuspense = <TData = Common.TimelinesServiceTimelinesControllerFindAllEventsDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ endedAt, startedAt, term, timelineIds }: {
  endedAt: string;
  startedAt: string;
  term?: string;
  timelineIds?: string[];
}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useSuspenseQuery<TData, TError>({ queryKey: Common.UseTimelinesServiceTimelinesControllerFindAllEventsKeyFn({ endedAt, startedAt, term, timelineIds }, queryKey), queryFn: () => TimelinesService.timelinesControllerFindAllEvents({ endedAt, startedAt, term, timelineIds }) as TData, ...options });
/**
* @returns TimelineCountDto Returns the number of timelines that exist
* @throws ApiError
*/
export const useTimelinesServiceTimelinesControllerCountSuspense = <TData = Common.TimelinesServiceTimelinesControllerCountDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>(queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useSuspenseQuery<TData, TError>({ queryKey: Common.UseTimelinesServiceTimelinesControllerCountKeyFn(), queryFn: () => TimelinesService.timelinesControllerCount() as TData, ...options });
/**
* @param data The data for the request.
* @param data.id
* @returns TimelineDto Return a single timeline by id
* @throws ApiError
*/
export const useTimelinesServiceTimelinesControllerFindOneSuspense = <TData = Common.TimelinesServiceTimelinesControllerFindOneDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ id }: {
  id: string;
}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useSuspenseQuery<TData, TError>({ queryKey: Common.UseTimelinesServiceTimelinesControllerFindOneKeyFn({ id }, queryKey), queryFn: () => TimelinesService.timelinesControllerFindOne({ id }) as TData, ...options });
